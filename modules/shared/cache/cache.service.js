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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("node:fs");
const lru_map_1 = require("./lru-map");
const PINNED_COUNT = 2400;
const MIN_CAT_CAPACITY = 2 * PINNED_COUNT + 500;
const DEFAULT_CAT_CAPACITY = 10_000;
const MAX_CAT_CAPACITY = 20_000;
const MEMORY_CHECK_INTERVAL = 60_000;
const FALLBACK_MEMORY_LIMIT = 512 * 1024 * 1024;
const MEMORY_TARGET_RATIO = 0.75;
const DANGER_HEADROOM = 20 * 1024 * 1024;
const GROWTH_HEADROOM = 100 * 1024 * 1024;
function detectMemoryLimit() {
    if (typeof process.constrainedMemory === 'function') {
        const limit = process.constrainedMemory();
        if (limit > 0)
            return limit;
    }
    try {
        const content = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
        if (content !== 'max') {
            const n = parseInt(content, 10);
            if (n > 0)
                return n;
        }
    }
    catch {
    }
    try {
        const content = fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim();
        const n = parseInt(content, 10);
        if (n > 0 && n < Number.MAX_SAFE_INTEGER / 2)
            return n;
    }
    catch {
    }
    return FALLBACK_MEMORY_LIMIT;
}
let CacheService = CacheService_1 = class CacheService {
    constructor() {
        this.logger = new common_1.Logger(CacheService_1.name);
        this.memoryLimit = detectMemoryLimit();
        this.txHashToNumber = new Map();
        this.totalCatCount = 0;
        this.lastSyncedCatNumber = -1;
        this.proofOfCatWork = 0;
        this.memoryCheckTimer = null;
        this.catsByNumber = new lru_map_1.LruMap(DEFAULT_CAT_CAPACITY, {
            onEvict: (_key, cat) => this.txHashToNumber.delete(cat.txHash),
            isPinned: (n) => this.isPinnedNumber(n),
        });
    }
    onModuleInit() {
        this.memoryCheckTimer = setInterval(() => this.adjustCacheSizes(), MEMORY_CHECK_INTERVAL);
        this.logger.log(`Cache initialized (capacity: ${DEFAULT_CAT_CAPACITY}, pinned: ${2 * PINNED_COUNT}, memory limit: ${Math.round(this.memoryLimit / 1024 / 1024)}MB)`);
    }
    onModuleDestroy() {
        if (this.memoryCheckTimer) {
            clearInterval(this.memoryCheckTimer);
        }
    }
    isPinnedNumber(n) {
        if (n < PINNED_COUNT)
            return true;
        if (this.lastSyncedCatNumber < PINNED_COUNT)
            return false;
        const newestFloor = this.lastSyncedCatNumber - PINNED_COUNT + 1;
        return n >= newestFloor && n <= this.lastSyncedCatNumber;
    }
    getCachedCat(catNumber) {
        return this.catsByNumber.get(catNumber);
    }
    getCachedCatNumberByTxHash(txHash) {
        return this.txHashToNumber.get(txHash);
    }
    setCachedCat(cat) {
        if (cat.catNumber > this.lastSyncedCatNumber) {
            this.lastSyncedCatNumber = cat.catNumber;
            this.totalCatCount = cat.catNumber + 1;
        }
        this.catsByNumber.set(cat.catNumber, cat);
        this.txHashToNumber.set(cat.txHash, cat.catNumber);
    }
    computeCatNumbersForPage(ipp, page) {
        if (this.lastSyncedCatNumber < 0)
            return [];
        if (ipp <= 0 || page <= 0)
            return [];
        const first = this.lastSyncedCatNumber - (page - 1) * ipp;
        if (first < 0)
            return [];
        const last = Math.max(0, first - ipp + 1);
        const count = first - last + 1;
        const result = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = first - i;
        }
        return result;
    }
    getTotalCatCount() {
        return this.totalCatCount;
    }
    getLastSyncedCatNumber() {
        return this.lastSyncedCatNumber;
    }
    setTotals(total, lastSynced) {
        this.totalCatCount = total;
        this.lastSyncedCatNumber = lastSynced;
    }
    getProofOfCatWork() {
        return this.proofOfCatWork;
    }
    setProofOfCatWork(sumFromDb) {
        this.proofOfCatWork = sumFromDb;
    }
    onNewCatsSynced(newMax) {
        if (newMax > this.lastSyncedCatNumber) {
            this.lastSyncedCatNumber = newMax;
            this.totalCatCount = newMax + 1;
        }
    }
    getMemoryInfo() {
        const { rss, heapUsed, heapTotal } = process.memoryUsage();
        const targetMax = this.memoryLimit * MEMORY_TARGET_RATIO;
        const headroom = targetMax - rss;
        return { rss, heapUsed, heapTotal, targetMax, headroom };
    }
    clampCapacity(desired) {
        return Math.max(MIN_CAT_CAPACITY, Math.min(MAX_CAT_CAPACITY, desired));
    }
    adjustCacheSizes() {
        const { rss, headroom } = this.getMemoryInfo();
        const currentMax = this.catsByNumber.getMaxSize();
        if (headroom < DANGER_HEADROOM) {
            const newSize = this.clampCapacity(Math.floor(currentMax * 0.5));
            if (newSize !== currentMax) {
                this.catsByNumber.setMaxSize(newSize);
                this.logger.warn(`Low memory (RSS: ${(rss / 1024 / 1024).toFixed(0)}MB, headroom: ${(headroom / 1024 / 1024).toFixed(0)}MB), cat cache shrunk to ${newSize}`);
            }
        }
        else if (headroom > GROWTH_HEADROOM) {
            const newSize = this.clampCapacity(currentMax + 2000);
            if (newSize !== currentMax) {
                this.catsByNumber.setMaxSize(newSize);
            }
        }
    }
    getStats() {
        const mem = this.getMemoryInfo();
        return {
            cats: this.catsByNumber.size,
            catsMax: this.catsByNumber.getMaxSize(),
            txHashIndex: this.txHashToNumber.size,
            totalCatCount: this.totalCatCount,
            lastSyncedCatNumber: this.lastSyncedCatNumber,
            proofOfCatWork: this.proofOfCatWork,
            memoryLimitMB: Math.round(this.memoryLimit / 1024 / 1024),
            memoryTargetMB: Math.round(mem.targetMax / 1024 / 1024),
            memoryHeadroomMB: Math.round(mem.headroom / 1024 / 1024),
            memoryRssMB: Math.round(mem.rss / 1024 / 1024),
            memoryHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        };
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CacheService);
//# sourceMappingURL=cache.service.js.map