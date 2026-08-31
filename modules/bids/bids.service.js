"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BidsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsService = void 0;
const common_1 = require("@nestjs/common");
const base_1 = require("@scure/base");
const btc = require("@scure/btc-signer");
const drizzle_orm_1 = require("drizzle-orm");
const core_1 = require("ordpool-sdk/core");
const array_utils_1 = require("../shared/array-utils");
const backend_network_1 = require("../shared/backend-network");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const bids_1 = require("../shared/drizzle/schema/bids");
const electrs_client_service_1 = require("../sync/electrs-client.service");
const ord_client_service_1 = require("../sync/ord-client.service");
const MARKETPLACE_FLOOR_SATS = 1_000;
let BidsService = BidsService_1 = class BidsService {
    constructor(drizzle, ordClient, electrsClient) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.electrsClient = electrsClient;
        this.logger = new common_1.Logger(BidsService_1.name);
        this.backendNetwork = (0, backend_network_1.readBackendNetworkFromEnv)();
        this.logger.log(`BidsService: BACKEND_NETWORK = ${this.backendNetwork}`);
    }
    get network() {
        return this.backendNetwork;
    }
    async create(dto) {
        if (dto.network !== this.backendNetwork) {
            throw new common_1.BadRequestException({
                code: 'network-mismatch',
                detail: `Bid targets network=${dto.network}; this backend serves ${this.backendNetwork}.`,
            });
        }
        if (!dto.cats.includes(dto.headlineCatNumber)) {
            throw new common_1.BadRequestException({
                code: 'headline-not-in-bundle',
                detail: `headlineCatNumber ${dto.headlineCatNumber} is not a member of cats [${dto.cats.join(',')}]`,
            });
        }
        if (dto.bidSats < MARKETPLACE_FLOOR_SATS) {
            throw new common_1.BadRequestException({
                code: 'bid-below-marketplace-floor',
                detail: `bidSats=${dto.bidSats} is below the marketplace floor of ${MARKETPLACE_FLOOR_SATS} sats. ` +
                    'Very-low-price bids are rejected as spam.',
            });
        }
        let psbtBytes;
        try {
            psbtBytes = base_1.base64.decode(dto.psbtBase64);
        }
        catch (err) {
            throw new common_1.BadRequestException({
                code: 'psbt-malformed',
                detail: `PSBT base64 decode failed: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
        let tx;
        try {
            tx = btc.Transaction.fromPSBT(psbtBytes, {
                allowUnknowInput: true,
                allowUnknowOutput: true,
            });
        }
        catch (err) {
            throw new common_1.BadRequestException({
                code: 'psbt-malformed',
                detail: `PSBT parse failed: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
        if (tx.inputsLength < 2) {
            throw new common_1.BadRequestException({
                code: 'psbt-shape-invalid',
                detail: 'PSBT must have input 0 = seller cat UTXO plus at least one buyer funding input',
            });
        }
        if (tx.outputsLength < 2 || tx.outputsLength > 3) {
            throw new common_1.BadRequestException({
                code: 'psbt-shape-invalid',
                detail: 'PSBT must have 2 or 3 outputs (cat, seller-payment, optional buyer-change)',
            });
        }
        const sdkNetwork = (0, backend_network_1.toSdkNetwork)(dto.network);
        const sdkResult = (0, core_1.validateCat21BuyOfferPsbt)({
            psbt: psbtBytes,
            expectedSellerUtxo: { txid: dto.catTxid, vout: dto.catVout },
            floorPriceSats: 0,
            expectedSellerPaymentAddress: dto.sellerPaymentAddress,
            expectedBuyerReceiveAddress: dto.buyerOrdinalsAddress,
            expectedBuyerChangeAddress: dto.buyerPaymentAddress,
            expectedExactPrice: dto.bidSats,
            network: sdkNetwork,
        });
        if (!sdkResult.ok) {
            throw new common_1.BadRequestException({
                code: `psbt-${sdkResult.reason}`,
                detail: sdkResult.detail ?? `SDK validator rejected: ${sdkResult.reason}`,
            });
        }
        for (let i = 1; i < tx.inputsLength; i++) {
            const inp = tx.getInput(i);
            if (!inp.txid)
                continue;
            const inpTxid = base_1.hex.encode(inp.txid);
            const inpVout = inp.index ?? 0;
            const status = await this.electrsClient.getOutpointStatus(inpTxid, inpVout);
            if (status === 'spent') {
                throw new common_1.BadRequestException({
                    code: 'psbt-buyer-input-unspendable',
                    detail: `PSBT input ${i} (${inpTxid}:${inpVout}) is unspendable — either the txid is ` +
                        `unknown to electrs (never broadcast / orphaned) or the vout was already spent.`,
                });
            }
        }
        let liveCats;
        try {
            liveCats = await this.ordClient.getCatsAtOutput(dto.catTxid, dto.catVout);
        }
        catch (err) {
            this.logger.warn(`ord /output lookup failed for ${dto.catTxid}:${dto.catVout}: ${err instanceof Error ? err.message : err}`);
            throw new common_1.BadRequestException({
                code: 'ord-lookup-failed',
                detail: 'On-chain cats-bundle check could not complete. Try again in a moment.',
            });
        }
        if (liveCats === null || liveCats.length === 0) {
            throw new common_1.BadRequestException({
                code: 'cat-not-found',
                detail: `UTXO ${dto.catTxid}:${dto.catVout} carries no cats on ord (already spent, unknown, ` +
                    'or never held a cat).',
            });
        }
        if (!(0, array_utils_1.catsArraysEqual)(liveCats, dto.cats)) {
            throw new common_1.BadRequestException({
                code: 'cats-bundle-drift',
                detail: `Buyer signed for cats=[${dto.cats.join(',')}] but the UTXO now carries ` +
                    `[${liveCats.join(',')}]. Re-bid against the current bundle.`,
            });
        }
        const catsSorted = [...new Set(dto.cats)].sort((a, b) => a - b);
        await this.drizzle.db
            .insert(bids_1.bids)
            .values({
            network: dto.network,
            catTxid: dto.catTxid,
            catVout: dto.catVout,
            catsOnUtxo: catsSorted,
            headlineCatNumber: dto.headlineCatNumber,
            bidSats: dto.bidSats,
            buyerOrdinalsAddress: dto.buyerOrdinalsAddress,
            buyerPaymentAddress: dto.buyerPaymentAddress,
            sellerPaymentAddress: dto.sellerPaymentAddress,
            psbtBase64: dto.psbtBase64,
        })
            .onDuplicateKeyUpdate({
            set: {
                catsOnUtxo: catsSorted,
                headlineCatNumber: dto.headlineCatNumber,
                bidSats: dto.bidSats,
                buyerPaymentAddress: dto.buyerPaymentAddress,
                sellerPaymentAddress: dto.sellerPaymentAddress,
                psbtBase64: dto.psbtBase64,
            },
        });
        const persisted = await this.findByOutpointAndBuyer(dto.network, dto.catTxid, dto.catVout, dto.buyerOrdinalsAddress);
        if (!persisted) {
            throw new common_1.BadRequestException({
                code: 'persist-race',
                detail: 'Bid was accepted but disappeared before read-back. Retry.',
            });
        }
        return persisted;
    }
    async findByOutpoint(network, catTxid, catVout) {
        const rows = await this.drizzle.db
            .select()
            .from(bids_1.bids)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(bids_1.bids.network, network), (0, drizzle_orm_1.eq)(bids_1.bids.catTxid, catTxid), (0, drizzle_orm_1.eq)(bids_1.bids.catVout, catVout)))
            .orderBy((0, drizzle_orm_1.desc)(bids_1.bids.bidSats), (0, drizzle_orm_1.desc)(bids_1.bids.createdAt));
        return rows.map((r) => this.rowToDto(r));
    }
    async findByOutpointAndBuyer(network, catTxid, catVout, buyerOrdinalsAddress) {
        const rows = await this.drizzle.db
            .select()
            .from(bids_1.bids)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(bids_1.bids.network, network), (0, drizzle_orm_1.eq)(bids_1.bids.catTxid, catTxid), (0, drizzle_orm_1.eq)(bids_1.bids.catVout, catVout), (0, drizzle_orm_1.eq)(bids_1.bids.buyerOrdinalsAddress, buyerOrdinalsAddress)))
            .limit(1);
        if (rows.length === 0)
            return null;
        return this.rowToDto(rows[0]);
    }
    async findPaginated(itemsPerPage, currentPage) {
        if (!Number.isInteger(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
            throw new common_1.BadRequestException('itemsPerPage must be an integer in [1, 100]');
        }
        if (!Number.isInteger(currentPage) || currentPage < 1) {
            throw new common_1.BadRequestException('currentPage must be a positive integer');
        }
        const offset = (currentPage - 1) * itemsPerPage;
        const [rows, [{ total }]] = await Promise.all([
            this.drizzle.db
                .select()
                .from(bids_1.bids)
                .orderBy((0, drizzle_orm_1.desc)(bids_1.bids.createdAt))
                .limit(itemsPerPage)
                .offset(offset),
            this.drizzle.db.select({ total: (0, drizzle_orm_1.count)() }).from(bids_1.bids),
        ]);
        return {
            total,
            currentPage,
            itemsPerPage,
            items: rows.map((r) => this.rowToDto(r)),
        };
    }
    async deleteByOutpointAndBuyer(network, catTxid, catVout, buyerOrdinalsAddress) {
        await this.drizzle.db
            .delete(bids_1.bids)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(bids_1.bids.network, network), (0, drizzle_orm_1.eq)(bids_1.bids.catTxid, catTxid), (0, drizzle_orm_1.eq)(bids_1.bids.catVout, catVout), (0, drizzle_orm_1.eq)(bids_1.bids.buyerOrdinalsAddress, buyerOrdinalsAddress)));
    }
    rowToDto(row) {
        return {
            id: row.id,
            network: row.network,
            catTxid: row.catTxid,
            catVout: row.catVout,
            cats: row.catsOnUtxo,
            headlineCatNumber: row.headlineCatNumber,
            bidSats: row.bidSats,
            buyerOrdinalsAddress: row.buyerOrdinalsAddress,
            buyerPaymentAddress: row.buyerPaymentAddress,
            sellerPaymentAddress: row.sellerPaymentAddress,
            psbtBase64: row.psbtBase64,
            createdAt: row.createdAt.toISOString(),
        };
    }
};
exports.BidsService = BidsService;
exports.BidsService = BidsService = BidsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        ord_client_service_1.OrdClientService,
        electrs_client_service_1.ElectrsClientService])
], BidsService);
//# sourceMappingURL=bids.service.js.map