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
exports.scriptToAddress = scriptToAddress;
const common_1 = require("@nestjs/common");
const base_1 = require("@scure/base");
const btc = require("@scure/btc-signer");
const drizzle_orm_1 = require("drizzle-orm");
const core_1 = require("ordpool-sdk/core");
const core_2 = require("ordpool-sdk/core");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const bids_1 = require("../shared/drizzle/schema/bids");
const ord_client_service_1 = require("../sync/ord-client.service");
function readBackendNetworkFromEnv() {
    const raw = process.env.BACKEND_NETWORK;
    const allowed = ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'];
    if (raw && allowed.includes(raw)) {
        return raw;
    }
    return 'mainnet';
}
const MARKETPLACE_FLOOR_SATS = 1_000;
const CAT21_POSTAGE_SATS = 546;
function toSdkNetwork(name) {
    switch (name) {
        case 'mainnet': return core_1.Network.Mainnet;
        case 'testnet3': return core_1.Network.Testnet3;
        case 'testnet4': return core_1.Network.Testnet4;
        case 'signet': return core_1.Network.Signet;
        case 'regtest': return core_1.Network.Regtest;
    }
}
const REGTEST_NETWORK = { ...btc.TEST_NETWORK, bech32: 'bcrt' };
function toScureNetwork(n) {
    switch (n) {
        case core_1.Network.Mainnet: return btc.NETWORK;
        case core_1.Network.Testnet3:
        case core_1.Network.Testnet4:
        case core_1.Network.Signet:
            return btc.TEST_NETWORK;
        case core_1.Network.Regtest:
            return REGTEST_NETWORK;
    }
}
function catsArraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.every((v, i) => v === sb[i]);
}
function scriptToAddress(script, network) {
    try {
        const decoded = btc.OutScript.decode(script);
        return btc.Address(toScureNetwork(network)).encode(decoded);
    }
    catch {
        return null;
    }
}
let BidsService = BidsService_1 = class BidsService {
    constructor(drizzle, ordClient) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.logger = new common_1.Logger(BidsService_1.name);
        this.backendNetwork = readBackendNetworkFromEnv();
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
        const sdkNetwork = toSdkNetwork(dto.network);
        const input0 = tx.getInput(0);
        const input0Txid = input0.txid ? base_1.hex.encode(input0.txid) : null;
        if (input0Txid !== dto.catTxid.toLowerCase() || input0.index !== dto.catVout) {
            throw new common_1.BadRequestException({
                code: 'psbt-input0-mismatch',
                detail: `PSBT input 0 = ${input0Txid}:${input0.index}, but DTO claims ${dto.catTxid}:${dto.catVout}.`,
            });
        }
        const out0 = tx.getOutput(0);
        if (!out0.script) {
            throw new common_1.BadRequestException({ code: 'psbt-shape-invalid', detail: 'PSBT output 0 has no script' });
        }
        if (Number(out0.amount ?? 0n) !== CAT21_POSTAGE_SATS) {
            throw new common_1.BadRequestException({
                code: 'psbt-shape-invalid',
                detail: `PSBT output 0 must be exactly ${CAT21_POSTAGE_SATS} sats (cat postage); got ${out0.amount}`,
            });
        }
        const out0Address = scriptToAddress(out0.script, sdkNetwork);
        if (!out0Address || out0Address !== dto.buyerOrdinalsAddress) {
            throw new common_1.BadRequestException({
                code: 'psbt-output0-mismatch',
                detail: `PSBT output 0 pays ${out0Address ?? 'unknown'}, DTO claims ${dto.buyerOrdinalsAddress}`,
            });
        }
        const out1 = tx.getOutput(1);
        if (!out1.script || out1.amount === undefined) {
            throw new common_1.BadRequestException({ code: 'psbt-shape-invalid', detail: 'PSBT output 1 has no script or amount' });
        }
        const out1Address = scriptToAddress(out1.script, sdkNetwork);
        if (!out1Address || out1Address !== dto.sellerPaymentAddress) {
            throw new common_1.BadRequestException({
                code: 'psbt-output1-mismatch',
                detail: `PSBT output 1 pays ${out1Address ?? 'unknown'}, DTO claims ${dto.sellerPaymentAddress}`,
            });
        }
        const expectedOut1 = dto.bidSats + CAT21_POSTAGE_SATS;
        if (Number(out1.amount) !== expectedOut1) {
            throw new common_1.BadRequestException({
                code: 'psbt-price-mismatch',
                detail: `PSBT output 1 amount = ${out1.amount} sats, expected bidSats + postage = ${expectedOut1}`,
            });
        }
        if (tx.outputsLength === 3) {
            const out2 = tx.getOutput(2);
            if (!out2.script) {
                throw new common_1.BadRequestException({ code: 'psbt-shape-invalid', detail: 'PSBT output 2 has no script' });
            }
            const out2Address = scriptToAddress(out2.script, sdkNetwork);
            if (!out2Address || out2Address !== dto.buyerPaymentAddress) {
                throw new common_1.BadRequestException({
                    code: 'psbt-output2-mismatch',
                    detail: `PSBT output 2 pays ${out2Address ?? 'unknown'}, DTO claims ${dto.buyerPaymentAddress}`,
                });
            }
        }
        const sdkResult = (0, core_2.validateCat21BuyOfferPsbt)({
            psbt: psbtBytes,
            expectedSellerUtxo: { txid: dto.catTxid, vout: dto.catVout },
            floorPriceSats: 0,
            expectedSellerPaymentAddress: dto.sellerPaymentAddress,
            network: sdkNetwork,
        });
        if (!sdkResult.ok) {
            throw new common_1.BadRequestException({
                code: `psbt-${sdkResult.reason}`,
                detail: sdkResult.detail ?? `SDK validator rejected: ${sdkResult.reason}`,
            });
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
        if (!catsArraysEqual(liveCats, dto.cats)) {
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
        ord_client_service_1.OrdClientService])
], BidsService);
//# sourceMappingURL=bids.service.js.map