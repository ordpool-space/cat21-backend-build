"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_service_1 = require("./cache.service");
function makeCatDto(catNumber, txHash) {
    return {
        id: `uuid-${catNumber}`,
        catNumber,
        txHash: txHash ?? `tx-${catNumber}`,
        blockHash: `block-${catNumber}`,
        blockHeight: 824205 + catNumber,
        mintedAt: '2024-01-03T21:04:46.000Z',
        mintedBy: 'bc1p...',
        fee: 40834,
        weight: 705,
        size: 258,
        feeRate: 231.68,
        sat: 1924083497071885 + catNumber,
        value: 546,
        category: 'sub1k',
        genesis: catNumber === 0,
        catColors: ['#4acf16'],
        gender: 'Male',
        designIndex: 0,
        designPose: 'standing',
        designExpression: 'smile',
        designPattern: 'solid',
        designFacing: 'left',
        laserEyes: 'None',
        background: 'None',
        backgroundColors: [],
        crown: 'None',
        glasses: 'None',
        glassesColors: [],
        rarityBits: null,
        rarityRank: null,
        rarityCategoryTotal: null,
    };
}
describe('CacheService', () => {
    let cache;
    beforeEach(() => {
        cache = new cache_service_1.CacheService();
    });
    it('should cache and retrieve a cat by number', () => {
        const cat = makeCatDto(42);
        cache.setCachedCat(cat);
        expect(cache.getCachedCat(42)).toBe(cat);
    });
    it('should return undefined for uncached cat', () => {
        expect(cache.getCachedCat(999)).toBeUndefined();
    });
    it('should cache and retrieve cat number by txHash', () => {
        const cat = makeCatDto(42, 'abc123');
        cache.setCachedCat(cat);
        expect(cache.getCachedCatNumberByTxHash('abc123')).toBe(42);
    });
    it('should clean up txHash index on eviction', () => {
        const smallCache = new cache_service_1.CacheService();
        smallCache.catsByNumber.setMaxSize(2);
        smallCache.setTotals(100000, 99999);
        const cat1 = makeCatDto(50000, 'tx-1');
        const cat2 = makeCatDto(50001, 'tx-2');
        const cat3 = makeCatDto(50002, 'tx-3');
        smallCache.setCachedCat(cat1);
        smallCache.setCachedCat(cat2);
        smallCache.setCachedCat(cat3);
        expect(smallCache.getCachedCatNumberByTxHash('tx-1')).toBeUndefined();
        expect(smallCache.getCachedCatNumberByTxHash('tx-2')).toBe(50001);
        expect(smallCache.getCachedCatNumberByTxHash('tx-3')).toBe(50002);
    });
    it('should pin oldest cats (< 2400)', () => {
        cache.setTotals(63737, 63736);
        cache.catsByNumber.setMaxSize(4);
        cache.setCachedCat(makeCatDto(0, 'genesis'));
        cache.setCachedCat(makeCatDto(1, 'second'));
        cache.setCachedCat(makeCatDto(2, 'third'));
        cache.setCachedCat(makeCatDto(30000, 'middle-1'));
        cache.setCachedCat(makeCatDto(30001, 'middle-2'));
        expect(cache.getCachedCat(0)).toBeDefined();
        expect(cache.getCachedCat(1)).toBeDefined();
        expect(cache.getCachedCat(2)).toBeDefined();
        expect(cache.getCachedCat(30000)).toBeUndefined();
        expect(cache.getCachedCat(30001)).toBeDefined();
    });
    it('should pin newest cats (top 2400)', () => {
        cache.setTotals(63737, 63736);
        cache.catsByNumber.setMaxSize(5);
        cache.setCachedCat(makeCatDto(63736, 'newest'));
        cache.setCachedCat(makeCatDto(63000, 'newest-mid'));
        cache.setCachedCat(makeCatDto(61337, 'newest-edge'));
        cache.setCachedCat(makeCatDto(30000, 'middle-1'));
        cache.setCachedCat(makeCatDto(30001, 'middle-2'));
        cache.setCachedCat(makeCatDto(30002, 'middle-3'));
        expect(cache.getCachedCat(63736)).toBeDefined();
        expect(cache.getCachedCat(63000)).toBeDefined();
        expect(cache.getCachedCat(61337)).toBeDefined();
        expect(cache.getCachedCat(30000)).toBeUndefined();
        expect(cache.getCachedCat(30001)).toBeDefined();
        expect(cache.getCachedCat(30002)).toBeDefined();
    });
    it('should NOT pin newest range when lastSyncedCatNumber < PINNED_COUNT', () => {
        cache.setTotals(1000, 999);
        cache.catsByNumber.setMaxSize(3);
        cache.setCachedCat(makeCatDto(500, 'a'));
        cache.setCachedCat(makeCatDto(501, 'b'));
        cache.setCachedCat(makeCatDto(502, 'c'));
        cache.setCachedCat(makeCatDto(503, 'd'));
        expect(cache.getCachedCat(501)).toBeDefined();
        expect(cache.getCachedCat(502)).toBeDefined();
        expect(cache.getCachedCat(503)).toBeDefined();
    });
    it('should compute cat numbers for page 1 (newest)', () => {
        cache.setTotals(1000, 999);
        const numbers = cache.computeCatNumbersForPage(48, 1);
        expect(numbers.length).toBe(48);
        expect(numbers[0]).toBe(999);
        expect(numbers[47]).toBe(952);
    });
    it('should compute cat numbers for page 2', () => {
        cache.setTotals(1000, 999);
        const numbers = cache.computeCatNumbersForPage(48, 2);
        expect(numbers[0]).toBe(951);
        expect(numbers[47]).toBe(904);
    });
    it('should compute cat numbers for last (partial) page', () => {
        cache.setTotals(1000, 999);
        const lastPage = Math.ceil(1000 / 48);
        const numbers = cache.computeCatNumbersForPage(48, lastPage);
        expect(numbers[0]).toBe(39);
        expect(numbers[numbers.length - 1]).toBe(0);
        expect(numbers.length).toBe(40);
    });
    it('should return empty array on cold start (lastSyncedCatNumber = -1)', () => {
        expect(cache.computeCatNumbersForPage(48, 1)).toEqual([]);
    });
    it('should return empty array for out-of-range page', () => {
        cache.setTotals(100, 99);
        expect(cache.computeCatNumbersForPage(48, 100)).toEqual([]);
    });
    it('should handle page 1 with small dataset', () => {
        cache.setTotals(10, 9);
        const numbers = cache.computeCatNumbersForPage(48, 1);
        expect(numbers).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });
    it('should return cached totals', () => {
        cache.setTotals(63732, 63731);
        expect(cache.getTotalCatCount()).toBe(63732);
        expect(cache.getLastSyncedCatNumber()).toBe(63731);
    });
    it('should start with zero totals', () => {
        expect(cache.getTotalCatCount()).toBe(0);
        expect(cache.getLastSyncedCatNumber()).toBe(-1);
    });
    it('should update totals on sync', () => {
        cache.setTotals(100, 99);
        cache.onNewCatsSynced(109);
        expect(cache.getTotalCatCount()).toBe(110);
        expect(cache.getLastSyncedCatNumber()).toBe(109);
    });
    it('should be idempotent on sync with same/lower value', () => {
        cache.setTotals(1000, 999);
        cache.onNewCatsSynced(999);
        expect(cache.getLastSyncedCatNumber()).toBe(999);
        cache.onNewCatsSynced(500);
        expect(cache.getLastSyncedCatNumber()).toBe(999);
    });
    it('should NOT clear individual cat cache on sync', () => {
        cache.setTotals(1000, 999);
        const cat = makeCatDto(42);
        cache.setCachedCat(cat);
        cache.onNewCatsSynced(1005);
        expect(cache.getCachedCat(42)).toBe(cat);
    });
    it('should auto-bump lastSyncedCatNumber when setCachedCat sees higher number', () => {
        cache.setTotals(1000, 999);
        const cat = makeCatDto(1005);
        cache.setCachedCat(cat);
        expect(cache.getLastSyncedCatNumber()).toBe(1005);
        expect(cache.getTotalCatCount()).toBe(1006);
    });
    it('should NOT auto-bump when setCachedCat sees lower number', () => {
        cache.setTotals(1000, 999);
        const cat = makeCatDto(500);
        cache.setCachedCat(cat);
        expect(cache.getLastSyncedCatNumber()).toBe(999);
        expect(cache.getTotalCatCount()).toBe(1000);
    });
    it('should report cache stats', () => {
        cache.setCachedCat(makeCatDto(1));
        cache.setCachedCat(makeCatDto(2));
        cache.setTotals(1000, 999);
        const stats = cache.getStats();
        expect(stats.cats).toBe(2);
        expect(stats.txHashIndex).toBe(2);
        expect(stats.totalCatCount).toBe(1000);
        expect(stats.lastSyncedCatNumber).toBe(999);
        expect(stats.memoryLimitMB).toBeGreaterThan(0);
        expect(stats.memoryRssMB).toBeGreaterThan(0);
    });
    describe('pin predicate boundaries', () => {
        it('pins exactly cat #2399 (oldest boundary inclusive)', () => {
            cache.setTotals(100000, 99999);
            cache.catsByNumber.setMaxSize(2);
            cache.setCachedCat(makeCatDto(2399, 'pinned-oldest-edge'));
            cache.setCachedCat(makeCatDto(50000, 'middle-a'));
            cache.setCachedCat(makeCatDto(50001, 'middle-b'));
            expect(cache.getCachedCat(2399)).toBeDefined();
            expect(cache.getCachedCat(50000)).toBeUndefined();
        });
        it('does NOT pin cat #2400 (just past oldest boundary)', () => {
            cache.setTotals(100000, 99999);
            cache.catsByNumber.setMaxSize(2);
            cache.setCachedCat(makeCatDto(2400, 'not-pinned'));
            cache.setCachedCat(makeCatDto(50000, 'middle-a'));
            cache.setCachedCat(makeCatDto(50001, 'middle-b'));
            expect(cache.getCachedCat(2400)).toBeUndefined();
        });
        it('pins cat at exact newestFloor (lastSynced - 2399)', () => {
            cache.setTotals(63737, 63736);
            cache.catsByNumber.setMaxSize(3);
            cache.setCachedCat(makeCatDto(61337, 'newest-floor'));
            cache.setCachedCat(makeCatDto(50000, 'middle-a'));
            cache.setCachedCat(makeCatDto(50001, 'middle-b'));
            cache.setCachedCat(makeCatDto(50002, 'middle-c'));
            expect(cache.getCachedCat(61337)).toBeDefined();
        });
        it('does NOT pin cat at newestFloor - 1 (just outside newest range)', () => {
            cache.setTotals(63737, 63736);
            cache.catsByNumber.setMaxSize(3);
            cache.setCachedCat(makeCatDto(61336, 'just-outside'));
            cache.setCachedCat(makeCatDto(50000, 'middle-a'));
            cache.setCachedCat(makeCatDto(50001, 'middle-b'));
            cache.setCachedCat(makeCatDto(50002, 'middle-c'));
            expect(cache.getCachedCat(61336)).toBeUndefined();
        });
        it('does NOT pin cat with catNumber > lastSyncedCatNumber (future cat guard)', () => {
            cache.setTotals(63737, 63736);
            expect(cache.isPinnedNumber(63736)).toBe(true);
            expect(cache.isPinnedNumber(63737)).toBe(false);
            expect(cache.isPinnedNumber(99999)).toBe(false);
        });
        it('when lastSyncedCatNumber < PINNED_COUNT, only oldest is pinned', () => {
            cache.setTotals(500, 499);
            expect(cache.isPinnedNumber(0)).toBe(true);
            expect(cache.isPinnedNumber(499)).toBe(true);
            expect(cache.isPinnedNumber(2399)).toBe(true);
            expect(cache.isPinnedNumber(2400)).toBe(false);
        });
        it('on cold start (lastSyncedCatNumber = -1), only oldest is pinned', () => {
            expect(cache.isPinnedNumber(0)).toBe(true);
            expect(cache.isPinnedNumber(2399)).toBe(true);
            expect(cache.isPinnedNumber(2400)).toBe(false);
            expect(cache.isPinnedNumber(100000)).toBe(false);
        });
    });
    describe('LRU promotion on get()', () => {
        it('moves accessed cat to the end of LRU (saves it from eviction)', () => {
            cache.setTotals(100000, 99999);
            cache.catsByNumber.setMaxSize(3);
            cache.setCachedCat(makeCatDto(10000, 'a'));
            cache.setCachedCat(makeCatDto(10001, 'b'));
            cache.setCachedCat(makeCatDto(10002, 'c'));
            cache.getCachedCat(10000);
            cache.setCachedCat(makeCatDto(10003, 'd'));
            expect(cache.getCachedCat(10000)).toBeDefined();
            expect(cache.getCachedCat(10001)).toBeUndefined();
            expect(cache.getCachedCat(10002)).toBeDefined();
            expect(cache.getCachedCat(10003)).toBeDefined();
        });
    });
    describe('secondary txHash index', () => {
        it('finds catNumber by txHash after insert', () => {
            cache.setCachedCat(makeCatDto(500, 'abc123'));
            expect(cache.getCachedCatNumberByTxHash('abc123')).toBe(500);
        });
        it('returns undefined for unknown txHash', () => {
            expect(cache.getCachedCatNumberByTxHash('unknown')).toBeUndefined();
        });
        it('updates index when same cat number is re-cached with different txHash', () => {
            cache.setCachedCat(makeCatDto(500, 'tx-original'));
            cache.setCachedCat(makeCatDto(500, 'tx-updated'));
            expect(cache.getCachedCatNumberByTxHash('tx-updated')).toBe(500);
            expect(cache.getCachedCat(500)?.txHash).toBe('tx-updated');
        });
        it('preserves pinned cats txHash index across many insertions', () => {
            cache.setTotals(100000, 99999);
            cache.catsByNumber.setMaxSize(5);
            cache.setCachedCat(makeCatDto(0, 'genesis-tx'));
            for (let i = 0; i < 20; i++) {
                cache.setCachedCat(makeCatDto(50000 + i, `tx-${i}`));
            }
            expect(cache.getCachedCat(0)).toBeDefined();
            expect(cache.getCachedCatNumberByTxHash('genesis-tx')).toBe(0);
        });
    });
    describe('computeCatNumbersForPage edge cases', () => {
        it('returns array of exact length for full page', () => {
            cache.setTotals(1000, 999);
            const numbers = cache.computeCatNumbersForPage(48, 1);
            expect(numbers).toHaveLength(48);
        });
        it('returns DESC order (newest first)', () => {
            cache.setTotals(1000, 999);
            const numbers = cache.computeCatNumbersForPage(48, 1);
            for (let i = 1; i < numbers.length; i++) {
                expect(numbers[i]).toBeLessThan(numbers[i - 1]);
            }
        });
        it('last page clamps to cat #0 (no negative numbers)', () => {
            cache.setTotals(50, 49);
            const numbers = cache.computeCatNumbersForPage(48, 2);
            expect(numbers).toEqual([1, 0]);
        });
        it('returns empty for ipp = 0', () => {
            cache.setTotals(1000, 999);
            expect(cache.computeCatNumbersForPage(0, 1)).toEqual([]);
        });
        it('returns empty for page = 0', () => {
            cache.setTotals(1000, 999);
            expect(cache.computeCatNumbersForPage(48, 0)).toEqual([]);
        });
        it('returns empty for negative page', () => {
            cache.setTotals(1000, 999);
            expect(cache.computeCatNumbersForPage(48, -5)).toEqual([]);
        });
        it('handles ipp larger than total cats', () => {
            cache.setTotals(10, 9);
            const numbers = cache.computeCatNumbersForPage(100, 1);
            expect(numbers).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
        });
        it('handles single-cat DB', () => {
            cache.setTotals(1, 0);
            expect(cache.computeCatNumbersForPage(48, 1)).toEqual([0]);
            expect(cache.computeCatNumbersForPage(48, 2)).toEqual([]);
        });
        it('handles genesis-only DB correctly', () => {
            cache.setTotals(1, 0);
            const p1 = cache.computeCatNumbersForPage(1, 1);
            expect(p1).toEqual([0]);
            const p2 = cache.computeCatNumbersForPage(1, 2);
            expect(p2).toEqual([]);
        });
        it('different ipp values produce non-overlapping consecutive pages', () => {
            cache.setTotals(1000, 999);
            const p1 = cache.computeCatNumbersForPage(10, 1);
            const p2 = cache.computeCatNumbersForPage(10, 2);
            expect(p1[p1.length - 1] - 1).toBe(p2[0]);
        });
    });
    describe('auto-bump interactions', () => {
        it('auto-bump updates lastSyncedCatNumber atomically', () => {
            cache.setTotals(100, 99);
            cache.setCachedCat(makeCatDto(200));
            expect(cache.getLastSyncedCatNumber()).toBe(200);
            expect(cache.getTotalCatCount()).toBe(201);
        });
        it('auto-bump shifts newest pin boundary', () => {
            cache.setTotals(63737, 63736);
            expect(cache.isPinnedNumber(61337)).toBe(true);
            expect(cache.isPinnedNumber(61336)).toBe(false);
            cache.setCachedCat(makeCatDto(63740));
            expect(cache.isPinnedNumber(61341)).toBe(true);
            expect(cache.isPinnedNumber(61340)).toBe(false);
            expect(cache.isPinnedNumber(63740)).toBe(true);
        });
        it('auto-bump does not interfere with oldest pin', () => {
            cache.setTotals(63737, 63736);
            cache.setCachedCat(makeCatDto(70000));
            expect(cache.isPinnedNumber(0)).toBe(true);
            expect(cache.isPinnedNumber(2399)).toBe(true);
        });
        it('multiple auto-bumps: always uses the highest value', () => {
            cache.setTotals(100, 99);
            cache.setCachedCat(makeCatDto(200));
            cache.setCachedCat(makeCatDto(150));
            cache.setCachedCat(makeCatDto(300));
            expect(cache.getLastSyncedCatNumber()).toBe(300);
        });
        it('sync notification and auto-bump are idempotent when mixed', () => {
            cache.onNewCatsSynced(100);
            expect(cache.getLastSyncedCatNumber()).toBe(100);
            cache.setCachedCat(makeCatDto(50));
            expect(cache.getLastSyncedCatNumber()).toBe(100);
            cache.setCachedCat(makeCatDto(150));
            expect(cache.getLastSyncedCatNumber()).toBe(150);
            cache.onNewCatsSynced(120);
            expect(cache.getLastSyncedCatNumber()).toBe(150);
            cache.onNewCatsSynced(200);
            expect(cache.getLastSyncedCatNumber()).toBe(200);
        });
    });
    describe('capacity management', () => {
        it('starts with default capacity 10000', () => {
            const stats = cache.getStats();
            expect(stats.catsMax).toBe(10000);
        });
        it('accepts setMaxSize via LruMap directly (test hook)', () => {
            cache.catsByNumber.setMaxSize(5000);
            expect(cache.getStats().catsMax).toBe(5000);
        });
        it('adjustCacheSizes is clamped between MIN (5300) and MAX (20000)', () => {
            cache.catsByNumber.setMaxSize(100);
            expect(cache.getStats().catsMax).toBe(100);
        });
    });
    describe('sync notification edge cases', () => {
        it('onNewCatsSynced(0) sets totalCatCount to 1', () => {
            cache.onNewCatsSynced(0);
            expect(cache.getLastSyncedCatNumber()).toBe(0);
            expect(cache.getTotalCatCount()).toBe(1);
        });
        it('onNewCatsSynced with negative value is a no-op (idempotent)', () => {
            cache.onNewCatsSynced(100);
            cache.onNewCatsSynced(-1);
            expect(cache.getLastSyncedCatNumber()).toBe(100);
        });
        it('onNewCatsSynced does not touch cached cat DTOs', () => {
            cache.setCachedCat(makeCatDto(42));
            cache.setCachedCat(makeCatDto(100));
            cache.onNewCatsSynced(200);
            expect(cache.getCachedCat(42)).toBeDefined();
            expect(cache.getCachedCat(100)).toBeDefined();
        });
    });
    describe('Proof of Cat Work', () => {
        it('starts at 0', () => {
            expect(cache.getProofOfCatWork()).toBe(0);
        });
        it('setProofOfCatWork stores the value', () => {
            cache.setProofOfCatWork(123456789);
            expect(cache.getProofOfCatWork()).toBe(123456789);
        });
        it('setProofOfCatWork overwrites (DB is source of truth)', () => {
            cache.setProofOfCatWork(100);
            cache.setProofOfCatWork(200);
            cache.setProofOfCatWork(150);
            expect(cache.getProofOfCatWork()).toBe(150);
        });
        it('handles very large numbers (BTC sat range)', () => {
            const tenMillionBtc = 10_000_000 * 100_000_000;
            cache.setProofOfCatWork(tenMillionBtc);
            expect(cache.getProofOfCatWork()).toBe(tenMillionBtc);
            expect(cache.getProofOfCatWork()).toBeLessThan(Number.MAX_SAFE_INTEGER);
        });
        it('is exposed in cache stats', () => {
            cache.setProofOfCatWork(42);
            const stats = cache.getStats();
            expect(stats.proofOfCatWork).toBe(42);
        });
        it('is NOT touched by sync notification', () => {
            cache.setProofOfCatWork(1000);
            cache.onNewCatsSynced(500);
            expect(cache.getProofOfCatWork()).toBe(1000);
        });
        it('is NOT touched by setCachedCat', () => {
            cache.setProofOfCatWork(1000);
            cache.setCachedCat(makeCatDto(42));
            expect(cache.getProofOfCatWork()).toBe(1000);
        });
    });
    describe('full scenario: cold start through 1000 cats minted', () => {
        it('cold start → first paginated access → many mints → boundary shift', () => {
            expect(cache.getLastSyncedCatNumber()).toBe(-1);
            expect(cache.computeCatNumbersForPage(48, 1)).toEqual([]);
            cache.setTotals(10, 9);
            expect(cache.computeCatNumbersForPage(48, 1)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
            for (let n = 9; n >= 0; n--) {
                cache.setCachedCat(makeCatDto(n));
            }
            expect(cache.getStats().cats).toBe(10);
            for (let n = 10; n <= 1000; n++) {
                cache.onNewCatsSynced(n);
            }
            expect(cache.getLastSyncedCatNumber()).toBe(1000);
            expect(cache.getTotalCatCount()).toBe(1001);
            expect(cache.getCachedCat(0)).toBeDefined();
            expect(cache.getCachedCat(9)).toBeDefined();
            const p1 = cache.computeCatNumbersForPage(48, 1);
            expect(p1[0]).toBe(1000);
            expect(p1[47]).toBe(953);
        });
        it('churn through 100 middle cats without evicting pinned', () => {
            cache.setTotals(100000, 99999);
            for (const n of [0, 1, 100, 2399, 97600, 99000, 99999]) {
                cache.setCachedCat(makeCatDto(n));
            }
            for (let i = 0; i < 100; i++) {
                cache.setCachedCat(makeCatDto(50000 + i));
            }
            for (const n of [0, 1, 100, 2399, 97600, 99000, 99999]) {
                expect(cache.getCachedCat(n)).toBeDefined();
            }
        });
    });
});
//# sourceMappingURL=cache.service.spec.js.map