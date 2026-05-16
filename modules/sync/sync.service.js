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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
exports.deriveCategory = deriveCategory;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const drizzle_orm_1 = require("drizzle-orm");
const ordpool_parser_1 = require("ordpool-parser");
const cache_service_1 = require("../shared/cache/cache.service");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const cats_1 = require("../shared/drizzle/schema/cats");
const ord_client_service_1 = require("./ord-client.service");
const BATCH_SIZE = 50;
function deriveCategory(catNumber) {
    if (catNumber < 1000)
        return 'sub1k';
    if (catNumber < 10000)
        return 'sub10k';
    if (catNumber < 50000)
        return 'sub50k';
    if (catNumber < 100000)
        return 'sub100k';
    if (catNumber < 250000)
        return 'sub250k';
    if (catNumber < 500000)
        return 'sub500k';
    if (catNumber < 1000000)
        return 'sub1M';
    return '';
}
let SyncService = SyncService_1 = class SyncService {
    constructor(drizzle, ordClient, cache) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.cache = cache;
        this.logger = new common_1.Logger(SyncService_1.name);
        this.syncing = false;
        this.localMax = -1;
        this.blockHashCache = new Map();
        this.lastSuccessAt = null;
        this.lastErrorAt = null;
        this.lastError = null;
    }
    getSyncHealth() {
        return {
            lastSuccessAt: this.lastSuccessAt,
            lastErrorAt: this.lastErrorAt,
            lastError: this.lastError,
        };
    }
    async onModuleInit() {
        this.backfillDominantColorCategory().catch((e) => {
            this.logger.warn(`Dominant-color backfill failed: ${e instanceof Error ? e.message : String(e)}`);
        });
    }
    async backfillDominantColorCategory() {
        const BACKFILL_BATCH = 500;
        let total = 0;
        while (true) {
            const rows = await this.drizzle.db
                .select({
                catNumber: cats_1.cats.catNumber,
                txHash: cats_1.cats.txHash,
                blockHash: cats_1.cats.blockHash,
                feeRate: cats_1.cats.feeRate,
            })
                .from(cats_1.cats)
                .where((0, drizzle_orm_1.isNull)(cats_1.cats.dominantColorCategory))
                .limit(BACKFILL_BATCH);
            if (rows.length === 0)
                break;
            const byCategory = new Map();
            for (const row of rows) {
                const category = (0, ordpool_parser_1.getCatColorCategory)(row.txHash, row.blockHash, row.feeRate);
                const bucket = byCategory.get(category) ?? [];
                bucket.push(row.catNumber);
                byCategory.set(category, bucket);
            }
            for (const [category, catNumbers] of byCategory) {
                await this.drizzle.db
                    .update(cats_1.cats)
                    .set({ dominantColorCategory: category })
                    .where((0, drizzle_orm_1.inArray)(cats_1.cats.catNumber, catNumbers));
            }
            total += rows.length;
            this.logger.log(`Dominant-color backfill: updated ${total} cats so far`);
            if (rows.length < BACKFILL_BATCH)
                break;
        }
        if (total > 0) {
            this.logger.log(`Dominant-color backfill complete: ${total} cats updated`);
        }
    }
    async handleSync() {
        await this.sync();
    }
    async getBlockHashCached(height) {
        const cached = this.blockHashCache.get(height);
        if (cached)
            return cached;
        const hash = await this.ordClient.getBlockHash(height);
        this.blockHashCache.set(height, hash);
        return hash;
    }
    async sync() {
        if (this.syncing) {
            this.logger.debug('Sync already in progress, skipping');
            return;
        }
        this.syncing = true;
        try {
            if (this.localMax < 0) {
                const [result] = await this.drizzle.db
                    .select({ maxCatNumber: (0, drizzle_orm_1.max)(cats_1.cats.catNumber) })
                    .from(cats_1.cats);
                this.localMax = result.maxCatNumber ?? -1;
            }
            const remoteMax = await this.ordClient.getLatestCatNumber();
            if (remoteMax <= this.localMax) {
                this.logger.debug(`Already up to date (local: #${this.localMax}, remote: #${remoteMax})`);
                this.lastSuccessAt = new Date();
                return;
            }
            const totalToSync = remoteMax - this.localMax;
            this.logger.log(`Syncing cats #${this.localMax + 1} to #${remoteMax} (${totalToSync} cats)`);
            let nextCatNumber = this.localMax + 1;
            let insertedCount = 0;
            while (nextCatNumber <= remoteMax) {
                const batchEnd = Math.min(nextCatNumber + BATCH_SIZE, remoteMax + 1);
                const numbers = Array.from({ length: batchEnd - nextCatNumber }, (_, i) => nextCatNumber + i);
                const settled = await Promise.allSettled(numbers.map((n) => this.ordClient.getCat(n)));
                const details = settled
                    .filter((r) => r.status === 'fulfilled')
                    .map((r) => r.value)
                    .filter((d) => d !== null);
                if (details.length === 0)
                    break;
                const uniqueHeights = [...new Set(details.map((d) => d.height))];
                await Promise.all(uniqueHeights.map((h) => this.getBlockHashCached(h)));
                const rows = details.map((detail) => {
                    const blockHash = this.blockHashCache.get(detail.height);
                    const txid = detail.id.replace(/i\d+$/, '');
                    const parsed = ordpool_parser_1.Cat21ParserService.parse({
                        txid,
                        locktime: 21,
                        weight: detail.weight,
                        fee: detail.fee,
                        status: { block_hash: blockHash },
                    });
                    const traits = parsed?.getTraits();
                    const feeRate = detail.fee / (detail.weight / 4);
                    const dominantColorCategory = (0, ordpool_parser_1.getCatColorCategory)(txid, blockHash, feeRate);
                    return {
                        catNumber: detail.number,
                        txHash: txid,
                        blockHash,
                        blockHeight: detail.height,
                        mintedAt: new Date(detail.timestamp * 1000),
                        mintedBy: detail.minted_by,
                        fee: detail.fee,
                        weight: detail.weight,
                        size: detail.size,
                        feeRate,
                        sat: detail.sat,
                        value: detail.value,
                        category: deriveCategory(detail.number),
                        genesis: traits?.genesis ?? false,
                        catColors: traits?.catColors ?? [],
                        gender: traits?.gender ?? '',
                        designIndex: traits?.designIndex,
                        designPose: traits?.designPose,
                        designExpression: traits?.designExpression,
                        designPattern: traits?.designPattern,
                        designFacing: traits?.designFacing,
                        laserEyes: traits?.laserEyes,
                        background: traits?.background,
                        backgroundColors: traits?.backgroundColors ?? [],
                        crown: traits?.crown,
                        glasses: traits?.glasses,
                        glassesColors: traits?.glassesColors ?? [],
                        dominantColorCategory,
                    };
                });
                await this.drizzle.db.insert(cats_1.cats).ignore().values(rows);
                const batchMax = rows[rows.length - 1].catNumber;
                this.cache.onNewCatsSynced(batchMax);
                insertedCount += details.length;
                nextCatNumber += numbers.length;
                if (insertedCount % 100 < BATCH_SIZE) {
                    this.logger.log(`Synced ${insertedCount}/${totalToSync} cats (up to #${nextCatNumber - 1})`);
                }
            }
            this.localMax = remoteMax;
            this.cache.onNewCatsSynced(remoteMax);
            const [sumResult] = await this.drizzle.db
                .select({ proofOfCatWork: (0, drizzle_orm_1.sum)(cats_1.cats.fee) })
                .from(cats_1.cats);
            this.cache.setProofOfCatWork(Number(sumResult.proofOfCatWork ?? 0));
            this.logger.log(`Sync complete: ${insertedCount} new cats (synced up to #${remoteMax})`);
            this.lastSuccessAt = new Date();
        }
        catch (error) {
            this.lastErrorAt = new Date();
            this.lastError = error instanceof Error ? error.message : String(error);
            this.logger.error('Sync failed', error);
        }
        finally {
            this.blockHashCache.clear();
            this.syncing = false;
        }
    }
};
exports.SyncService = SyncService;
__decorate([
    (0, schedule_1.Interval)(60_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncService.prototype, "handleSync", null);
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        ord_client_service_1.OrdClientService,
        cache_service_1.CacheService])
], SyncService);
//# sourceMappingURL=sync.service.js.map