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
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const ordpool_parser_1 = require("ordpool-parser");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const cats_1 = require("../shared/drizzle/schema/cats");
let CatsService = class CatsService {
    constructor(drizzle) {
        this.drizzle = drizzle;
        this.startedAt = Date.now();
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
            version: process.env.npm_package_version ?? '0.1.0',
        };
    }
    async getStatus() {
        const [result] = await this.drizzle.db
            .select({
            totalCats: (0, drizzle_orm_1.count)(),
            lastSyncedCatNumber: (0, drizzle_orm_1.max)(cats_1.cats.catNumber),
        })
            .from(cats_1.cats);
        return {
            totalCats: result.totalCats,
            lastSyncedCatNumber: result.lastSyncedCatNumber ?? -1,
        };
    }
    async getCatByNumber(catNumber) {
        const [result] = await this.drizzle.db
            .select()
            .from(cats_1.cats)
            .where((0, drizzle_orm_1.eq)(cats_1.cats.catNumber, catNumber));
        if (!result)
            return null;
        return this.mapToDto(result);
    }
    async getCatByTxHash(txHash) {
        const [result] = await this.drizzle.db
            .select()
            .from(cats_1.cats)
            .where((0, drizzle_orm_1.eq)(cats_1.cats.txHash, txHash));
        if (!result)
            return null;
        return this.mapToDto(result);
    }
    async getCats(itemsPerPage, currentPage) {
        const offset = (currentPage - 1) * itemsPerPage;
        const [totalQuery, results] = await Promise.all([
            this.drizzle.db.select({ count: (0, drizzle_orm_1.count)() }).from(cats_1.cats),
            this.drizzle.db.select().from(cats_1.cats).orderBy((0, drizzle_orm_1.desc)(cats_1.cats.catNumber)).limit(itemsPerPage).offset(offset),
        ]);
        const [totalResult] = totalQuery;
        return {
            cats: results.map((r) => this.mapToDto(r)),
            total: totalResult.count,
            currentPage,
            itemsPerPage,
        };
    }
    async getCatNumbers(itemsPerPage, currentPage) {
        const offset = (currentPage - 1) * itemsPerPage;
        const [totalQuery, results] = await Promise.all([
            this.drizzle.db.select({ count: (0, drizzle_orm_1.count)() }).from(cats_1.cats),
            this.drizzle.db.select({ catNumber: cats_1.cats.catNumber }).from(cats_1.cats).orderBy((0, drizzle_orm_1.desc)(cats_1.cats.catNumber)).limit(itemsPerPage).offset(offset),
        ]);
        const [totalResult] = totalQuery;
        return {
            catNumbers: results.map((r) => r.catNumber),
            total: totalResult.count,
            currentPage,
            itemsPerPage,
        };
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
            male: row.male,
            female: row.female,
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
        };
    }
};
exports.CatsService = CatsService;
exports.CatsService = CatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], CatsService);
//# sourceMappingURL=cats.service.js.map