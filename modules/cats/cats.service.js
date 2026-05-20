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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsService = void 0;
exports.buildSearchWhere = buildSearchWhere;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const ordpool_parser_1 = require("ordpool-parser");
const cache_service_1 = require("../shared/cache/cache.service");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const cats_1 = require("../shared/drizzle/schema/cats");
const sync_service_1 = require("../sync/sync.service");
const RARITY_THRESHOLDS = {
    top10: 10,
    top100: 100,
    top1k: 1000,
};
const SYNC_STALL_SECONDS = 300;
let CatsService = class CatsService {
    constructor(drizzle, cache, sync) {
        this.drizzle = drizzle;
        this.cache = cache;
        this.sync = sync;
        this.startedAt = Date.now();
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
            version: process.env.npm_package_version ?? '0.1.0',
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            cache: this.cache.getStats(),
        };
    }
    async getExtendedHealth() {
        const pingStart = Date.now();
        let reachable = false;
        let latencyMs = null;
        let dbError = null;
        try {
            await this.drizzle.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
            reachable = true;
            latencyMs = Date.now() - pingStart;
        }
        catch (e) {
            dbError = e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200);
        }
        const syncHealth = this.sync.getSyncHealth();
        const now = Date.now();
        const secondsSinceLastSuccess = syncHealth.lastSuccessAt
            ? Math.floor((now - syncHealth.lastSuccessAt.getTime()) / 1000)
            : null;
        const stalled = secondsSinceLastSuccess === null || secondsSinceLastSuccess > SYNC_STALL_SECONDS;
        let status;
        if (!reachable) {
            status = 'down';
        }
        else if (stalled) {
            status = 'degraded';
        }
        else {
            status = 'ok';
        }
        return {
            status,
            timestamp: new Date().toISOString(),
            uptimeSec: Math.floor((now - this.startedAt) / 1000),
            version: process.env.npm_package_version ?? '0.1.0',
            memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            database: { reachable, latencyMs, error: dbError },
            sync: {
                lastSuccessAt: syncHealth.lastSuccessAt?.toISOString() ?? null,
                lastErrorAt: syncHealth.lastErrorAt?.toISOString() ?? null,
                lastError: syncHealth.lastError,
                secondsSinceLastSuccess,
                stalled,
            },
            cache: this.cache.getStats(),
        };
    }
    async getStatus() {
        await this.ensureTotalsPrimed();
        return {
            totalCats: this.cache.getTotalCatCount(),
            lastSyncedCatNumber: this.cache.getLastSyncedCatNumber(),
            proofOfCatWork: this.cache.getProofOfCatWork(),
        };
    }
    async getCatByNumber(catNumber) {
        await this.ensureTotalsPrimed();
        const cached = this.cache.getCachedCat(catNumber);
        if (cached)
            return cached;
        const [result] = await this.drizzle.db
            .select()
            .from(cats_1.cats)
            .where((0, drizzle_orm_1.eq)(cats_1.cats.catNumber, catNumber));
        if (!result)
            return null;
        const dto = this.mapToDto(result);
        this.cache.setCachedCat(dto);
        return dto;
    }
    async getCatByTxHash(txHash) {
        await this.ensureTotalsPrimed();
        const catNumber = this.cache.getCachedCatNumberByTxHash(txHash);
        if (catNumber !== undefined) {
            const cached = this.cache.getCachedCat(catNumber);
            if (cached)
                return cached;
        }
        const [result] = await this.drizzle.db
            .select()
            .from(cats_1.cats)
            .where((0, drizzle_orm_1.eq)(cats_1.cats.txHash, txHash));
        if (!result)
            return null;
        const dto = this.mapToDto(result);
        this.cache.setCachedCat(dto);
        return dto;
    }
    async getCats(itemsPerPage, currentPage) {
        await this.ensureTotalsPrimed();
        const catNumbers = this.cache.computeCatNumbersForPage(itemsPerPage, currentPage);
        const total = this.cache.getTotalCatCount();
        if (catNumbers.length === 0) {
            return { cats: [], total, currentPage, itemsPerPage };
        }
        const catsFromCache = new Map();
        const missingNumbers = [];
        for (const n of catNumbers) {
            const cached = this.cache.getCachedCat(n);
            if (cached) {
                catsFromCache.set(n, cached);
            }
            else {
                missingNumbers.push(n);
            }
        }
        if (missingNumbers.length > 0) {
            const rows = await this.drizzle.db
                .select()
                .from(cats_1.cats)
                .where((0, drizzle_orm_1.inArray)(cats_1.cats.catNumber, missingNumbers));
            for (const row of rows) {
                const dto = this.mapToDto(row);
                this.cache.setCachedCat(dto);
                catsFromCache.set(dto.catNumber, dto);
            }
        }
        const dtos = catNumbers
            .map((n) => catsFromCache.get(n))
            .filter((c) => c !== undefined);
        return {
            cats: dtos,
            total,
            currentPage,
            itemsPerPage,
        };
    }
    async getCatNumbers(itemsPerPage, currentPage) {
        await this.ensureTotalsPrimed();
        const catNumbers = this.cache.computeCatNumbersForPage(itemsPerPage, currentPage);
        const total = this.cache.getTotalCatCount();
        return {
            catNumbers,
            total,
            currentPage,
            itemsPerPage,
        };
    }
    async searchCatNumbers(filters, itemsPerPage, currentPage) {
        const where = buildSearchWhere(filters);
        const offset = (currentPage - 1) * itemsPerPage;
        const [[totalRow], rows] = await Promise.all([
            this.drizzle.db.select({ count: (0, drizzle_orm_1.count)() }).from(cats_1.cats).where(where),
            this.drizzle.db
                .select({ catNumber: cats_1.cats.catNumber })
                .from(cats_1.cats)
                .where(where)
                .orderBy((0, drizzle_orm_1.desc)(cats_1.cats.catNumber))
                .limit(itemsPerPage)
                .offset(offset),
        ]);
        return {
            catNumbers: rows.map((r) => r.catNumber),
            total: totalRow.count,
            currentPage,
            itemsPerPage,
        };
    }
    async randomCatNumber(filters) {
        const where = buildSearchWhere(filters);
        const [countRow] = await this.drizzle.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(cats_1.cats)
            .where(where);
        if (countRow.count === 0)
            return null;
        const offset = Math.floor(Math.random() * countRow.count);
        const [row] = await this.drizzle.db
            .select({ catNumber: cats_1.cats.catNumber })
            .from(cats_1.cats)
            .where(where)
            .limit(1)
            .offset(offset);
        return row?.catNumber ?? null;
    }
    async ensureTotalsPrimed() {
        if (this.cache.getLastSyncedCatNumber() >= 0)
            return;
        const [result] = await this.drizzle.db
            .select({
            totalCats: (0, drizzle_orm_1.count)(),
            lastSyncedCatNumber: (0, drizzle_orm_1.max)(cats_1.cats.catNumber),
            proofOfCatWork: (0, drizzle_orm_1.sum)(cats_1.cats.fee),
        })
            .from(cats_1.cats);
        this.cache.setTotals(result.totalCats, result.lastSyncedCatNumber ?? -1);
        this.cache.setProofOfCatWork(Number(result.proofOfCatWork ?? 0));
    }
    async getCatSvg(catNumber) {
        const [row] = await this.drizzle.db
            .select({
            txHash: cats_1.cats.txHash,
            weight: cats_1.cats.weight,
            fee: cats_1.cats.fee,
            blockHash: cats_1.cats.blockHash,
        })
            .from(cats_1.cats)
            .where((0, drizzle_orm_1.eq)(cats_1.cats.catNumber, catNumber));
        if (!row)
            return null;
        const parsed = ordpool_parser_1.Cat21ParserService.parse({
            txid: row.txHash,
            locktime: 21,
            weight: row.weight,
            fee: row.fee,
            status: { block_hash: row.blockHash },
        });
        return parsed?.getImage() ?? null;
    }
    mapToDto(row) {
        return {
            id: row.id,
            catNumber: row.catNumber,
            txHash: row.txHash,
            blockHash: row.blockHash,
            blockHeight: row.blockHeight,
            mintedAt: row.mintedAt.toISOString(),
            mintedBy: row.mintedBy,
            fee: row.fee,
            weight: row.weight,
            size: row.size,
            feeRate: row.feeRate,
            sat: row.sat,
            value: row.value,
            category: row.category,
            genesis: row.genesis,
            catColors: row.catColors,
            gender: row.gender,
            designIndex: row.designIndex,
            designPose: row.designPose,
            designExpression: row.designExpression,
            designPattern: row.designPattern,
            designFacing: row.designFacing,
            laserEyes: row.laserEyes,
            background: row.background,
            backgroundColors: row.backgroundColors,
            crown: row.crown,
            glasses: row.glasses,
            glassesColors: row.glassesColors,
            rarityBits: row.rarityBits,
            rarityRank: row.rarityRank,
            rarityCategoryTotal: categoryPopulation(row.category, this.cache.getLastSyncedCatNumber()),
        };
    }
};
exports.CatsService = CatsService;
exports.CatsService = CatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        cache_service_1.CacheService,
        sync_service_1.SyncService])
], CatsService);
function categoryPopulation(category, lastSynced) {
    const RANGES = {
        sub1: [0, 0, 1],
        sub1k: [1, 999, 999],
        sub10k: [1000, 9999, 9000],
        sub50k: [10000, 49999, 40000],
        sub100k: [50000, 99999, 50000],
        sub250k: [100000, 249999, 150000],
        sub500k: [250000, 499999, 250000],
        sub1M: [500000, 999999, 500000],
    };
    const range = RANGES[category];
    if (!range)
        return null;
    const [min, max, full] = range;
    if (lastSynced < min)
        return 0;
    if (lastSynced >= max)
        return full;
    return lastSynced - min + 1;
}
function buildSearchWhere(filters) {
    const clauses = [];
    if (filters.eyes?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.laserEyes, filters.eyes));
    if (filters.pose?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.designPose, filters.pose));
    if (filters.expression?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.designExpression, filters.expression));
    if (filters.pattern?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.designPattern, filters.pattern));
    if (filters.background?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.background, filters.background));
    if (filters.crown?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.crown, filters.crown));
    if (filters.glasses?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.glasses, filters.glasses));
    if (filters.color?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.dominantColorCategory, filters.color));
    if (filters.gender?.length)
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.gender, filters.gender));
    if (filters.category?.length) {
        clauses.push((0, drizzle_orm_1.inArray)(cats_1.cats.category, filters.category));
    }
    if (filters.genesis?.length) {
        const wantsGenesis = filters.genesis.includes('genesis');
        const wantsNormal = filters.genesis.includes('normal');
        if (wantsGenesis && !wantsNormal)
            clauses.push((0, drizzle_orm_1.eq)(cats_1.cats.genesis, true));
        else if (wantsNormal && !wantsGenesis)
            clauses.push((0, drizzle_orm_1.eq)(cats_1.cats.genesis, false));
    }
    if (filters.rarity?.length) {
        const thresholds = filters.rarity
            .map((v) => RARITY_THRESHOLDS[v])
            .filter((t) => t !== undefined);
        if (thresholds.length > 0) {
            clauses.push((0, drizzle_orm_1.lte)(cats_1.cats.rarityRank, Math.max(...thresholds)));
        }
    }
    if (clauses.length === 0)
        return undefined;
    if (clauses.length === 1)
        return clauses[0];
    return (0, drizzle_orm_1.and)(...clauses);
}
//# sourceMappingURL=cats.service.js.map