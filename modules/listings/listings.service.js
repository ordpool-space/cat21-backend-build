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
var ListingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const array_utils_1 = require("../shared/array-utils");
const backend_network_1 = require("../shared/backend-network");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const listings_1 = require("../shared/drizzle/schema/listings");
const ord_client_service_1 = require("../sync/ord-client.service");
let ListingsService = ListingsService_1 = class ListingsService {
    constructor(drizzle, ordClient) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.logger = new common_1.Logger(ListingsService_1.name);
        this.backendNetwork = (0, backend_network_1.readBackendNetworkFromEnv)();
        this.logger.log(`ListingsService: BACKEND_NETWORK = ${this.backendNetwork}`);
    }
    async create(dto, sellerOrdinalsAddress) {
        if (dto.network !== this.backendNetwork) {
            throw new common_1.BadRequestException({
                code: 'network-mismatch',
                detail: `Listing targets network=${dto.network}; this backend serves ${this.backendNetwork}.`,
            });
        }
        if (dto.ordinalsAddress !== sellerOrdinalsAddress) {
            throw new common_1.BadRequestException({
                code: 'session-address-mismatch',
                detail: 'Session token proves control of a different address than dto.ordinalsAddress.',
            });
        }
        if (!dto.cats.includes(dto.catNumber)) {
            throw new common_1.BadRequestException({
                code: 'headline-not-in-bundle',
                detail: `catNumber ${dto.catNumber} is not a member of cats [${dto.cats.join(',')}]`,
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
                detail: `UTXO ${dto.catTxid}:${dto.catVout} carries no cats on ord (already spent, ` +
                    `unknown, or never held a cat). If the cat just moved, re-sign against the ` +
                    `new outpoint.`,
            });
        }
        if (!(0, array_utils_1.catsArraysEqual)(liveCats, dto.cats)) {
            throw new common_1.BadRequestException({
                code: 'cats-bundle-drift',
                detail: `You signed for cats=[${dto.cats.join(',')}] but the UTXO now carries ` +
                    `[${liveCats.join(',')}]. Re-sign against the current bundle.`,
            });
        }
        let current;
        try {
            current = await this.ordClient.getCatCurrentLocation(dto.catNumber);
        }
        catch (err) {
            this.logger.warn(`ord lookup failed for cat #${dto.catNumber}: ${err instanceof Error ? err.message : err}`);
            throw new common_1.BadRequestException({
                code: 'ord-lookup-failed',
                detail: 'On-chain owner check could not complete. Try again in a moment.',
            });
        }
        if (!current) {
            throw new common_1.BadRequestException({
                code: 'cat-not-found',
                detail: `Cat #${dto.catNumber} not found on ord (or sits at an unspendable output).`,
            });
        }
        if (current.ordinalsAddress.toLowerCase() !== dto.ordinalsAddress.toLowerCase()) {
            throw new common_1.BadRequestException({
                code: 'not-current-owner',
                detail: `Signature is valid, but ${dto.ordinalsAddress} is not the current owner of cat #${dto.catNumber}.`,
            });
        }
        if (current.txid !== dto.catTxid.toLowerCase() || current.vout !== dto.catVout) {
            throw new common_1.BadRequestException({
                code: 'outpoint-mismatch',
                detail: `Cat has moved since you signed. Current outpoint is ${current.txid}:${current.vout}, ` +
                    `signature pinned ${dto.catTxid}:${dto.catVout}. Re-sign against the current UTXO.`,
            });
        }
        const catsSorted = [...new Set(dto.cats)].sort((a, b) => a - b);
        const insertedSignedAt = Math.floor(Date.now() / 1000);
        const row = {
            catNumber: dto.catNumber,
            cats: catsSorted,
            network: dto.network,
            askSats: dto.askSats,
            payTo: dto.payTo,
            catTxid: dto.catTxid,
            catVout: dto.catVout,
            ordinalsAddress: dto.ordinalsAddress,
            signedAt: insertedSignedAt,
            signature: '',
        };
        await this.drizzle.db
            .insert(listings_1.listings)
            .values({
            catNumber: row.catNumber,
            catsOnUtxo: row.cats,
            headlineCatNumber: row.catNumber,
            network: row.network,
            askSats: row.askSats,
            payTo: row.payTo,
            catTxid: row.catTxid,
            catVout: row.catVout,
            ordinalsAddress: row.ordinalsAddress,
            signedAt: row.signedAt,
            signature: row.signature,
        })
            .onDuplicateKeyUpdate({
            set: {
                catNumber: row.catNumber,
                catsOnUtxo: row.cats,
                headlineCatNumber: row.catNumber,
                askSats: row.askSats,
                payTo: row.payTo,
                ordinalsAddress: row.ordinalsAddress,
                signedAt: row.signedAt,
                signature: row.signature,
            },
        });
        const persisted = await this.findByOutpoint(dto.network, dto.catTxid, dto.catVout);
        if (!persisted) {
            throw new common_1.BadRequestException({
                code: 'persist-race',
                detail: 'Listing was accepted but disappeared before read-back. Retry.',
            });
        }
        return persisted;
    }
    async findByCatNumber(catNumber) {
        const rows = await this.drizzle.db
            .select()
            .from(listings_1.listings)
            .where((0, drizzle_orm_1.eq)(listings_1.listings.catNumber, catNumber))
            .limit(1);
        if (rows.length === 0)
            return null;
        return this.rowToDto(rows[0]);
    }
    async findByOutpoint(network, catTxid, catVout) {
        const rows = await this.drizzle.db
            .select()
            .from(listings_1.listings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(listings_1.listings.network, network), (0, drizzle_orm_1.eq)(listings_1.listings.catTxid, catTxid), (0, drizzle_orm_1.eq)(listings_1.listings.catVout, catVout)))
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
                .from(listings_1.listings)
                .orderBy((0, drizzle_orm_1.desc)(listings_1.listings.signedAt))
                .limit(itemsPerPage)
                .offset(offset),
            this.drizzle.db.select({ total: (0, drizzle_orm_1.count)() }).from(listings_1.listings),
        ]);
        return {
            total,
            currentPage,
            itemsPerPage,
            items: rows.map((r) => this.rowToDto(r)),
        };
    }
    async deleteByCatNumber(catNumber) {
        await this.drizzle.db.delete(listings_1.listings).where((0, drizzle_orm_1.eq)(listings_1.listings.catNumber, catNumber));
    }
    async deleteByCatNumberIfOwnedBy(catNumber, ordinalsAddress) {
        const [existing] = await this.drizzle.db
            .select({ id: listings_1.listings.id, ordinalsAddress: listings_1.listings.ordinalsAddress })
            .from(listings_1.listings)
            .where((0, drizzle_orm_1.eq)(listings_1.listings.catNumber, catNumber))
            .limit(1);
        if (!existing)
            return false;
        if (existing.ordinalsAddress !== ordinalsAddress)
            return false;
        await this.drizzle.db.delete(listings_1.listings).where((0, drizzle_orm_1.eq)(listings_1.listings.id, existing.id));
        return true;
    }
    async deleteByIdIfUnchanged(id, signedAt) {
        await this.drizzle.db
            .delete(listings_1.listings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(listings_1.listings.id, id), (0, drizzle_orm_1.eq)(listings_1.listings.signedAt, signedAt)));
    }
    rowToDto(row) {
        return {
            id: row.id,
            catNumber: row.catNumber,
            cats: row.catsOnUtxo,
            network: row.network,
            askSats: row.askSats,
            payTo: row.payTo,
            catTxid: row.catTxid,
            catVout: row.catVout,
            ordinalsAddress: row.ordinalsAddress,
            signedAt: row.signedAt,
            signature: row.signature,
            createdAt: row.createdAt.toISOString(),
        };
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = ListingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        ord_client_service_1.OrdClientService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map