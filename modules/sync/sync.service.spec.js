"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sync_service_1 = require("./sync.service");
describe('deriveCategory', () => {
    it('should return sub1 for the Genesis Cat (cat #0) only', () => {
        expect((0, sync_service_1.deriveCategory)(0)).toBe('sub1');
    });
    it('should return sub1k for cats 1-999', () => {
        expect((0, sync_service_1.deriveCategory)(1)).toBe('sub1k');
        expect((0, sync_service_1.deriveCategory)(999)).toBe('sub1k');
    });
    it('should return sub10k for cats 1000-9999', () => {
        expect((0, sync_service_1.deriveCategory)(1000)).toBe('sub10k');
        expect((0, sync_service_1.deriveCategory)(9999)).toBe('sub10k');
    });
    it('should return sub50k for cats 10000-49999', () => {
        expect((0, sync_service_1.deriveCategory)(10000)).toBe('sub50k');
        expect((0, sync_service_1.deriveCategory)(49999)).toBe('sub50k');
    });
    it('should return sub100k for cats 50000-99999', () => {
        expect((0, sync_service_1.deriveCategory)(50000)).toBe('sub100k');
        expect((0, sync_service_1.deriveCategory)(99999)).toBe('sub100k');
    });
    it('should return sub250k for cats 100000-249999', () => {
        expect((0, sync_service_1.deriveCategory)(100000)).toBe('sub250k');
        expect((0, sync_service_1.deriveCategory)(249999)).toBe('sub250k');
    });
    it('should return sub500k for cats 250000-499999', () => {
        expect((0, sync_service_1.deriveCategory)(250000)).toBe('sub500k');
        expect((0, sync_service_1.deriveCategory)(499999)).toBe('sub500k');
    });
    it('should return sub1M for cats 500000-999999', () => {
        expect((0, sync_service_1.deriveCategory)(500000)).toBe('sub1M');
        expect((0, sync_service_1.deriveCategory)(999999)).toBe('sub1M');
    });
    it('should return empty string for cats 1000000+', () => {
        expect((0, sync_service_1.deriveCategory)(1000000)).toBe('');
        expect((0, sync_service_1.deriveCategory)(9999999)).toBe('');
    });
});
describe('SyncService', () => {
    function makeCat(n, height = 800000 + n) {
        const hexId = n.toString(16).padStart(64, '0');
        return {
            id: `${hexId}i0`,
            number: n,
            address: 'bc1p...',
            sat: 100000 + n,
            fee: 1000,
            height,
            block_hash: height.toString(16).padStart(64, '0'),
            timestamp: 1700000000 + n,
            value: 546,
            weight: 500,
        };
    }
    function createMocks(localMax = null, remoteMax = 5) {
        const insertMock = jest.fn().mockReturnValue({
            ignore: jest.fn().mockReturnValue({
                values: jest.fn().mockResolvedValue(undefined),
            }),
        });
        const drizzle = {
            db: {
                select: jest.fn().mockReturnValue({
                    from: jest.fn().mockResolvedValue([{ maxCatNumber: localMax }]),
                }),
                insert: insertMock,
            },
        };
        const ordClient = {
            getLatestCatNumber: jest.fn().mockResolvedValue(remoteMax),
            getCat: jest.fn().mockImplementation((n) => Promise.resolve(makeCat(n))),
        };
        const cache = { onNewCatsSynced: jest.fn() };
        const service = new sync_service_1.SyncService(drizzle, ordClient, cache);
        return { service, drizzle, ordClient, insertMock, cache };
    }
    it('should skip sync when already up to date', async () => {
        const { service, ordClient, insertMock } = createMocks(10, 10);
        await service.sync();
        expect(ordClient.getLatestCatNumber).toHaveBeenCalled();
        expect(insertMock).not.toHaveBeenCalled();
    });
    it('should skip sync when remote is behind local', async () => {
        const { service, insertMock } = createMocks(10, 5);
        await service.sync();
        expect(insertMock).not.toHaveBeenCalled();
    });
    it('should sync missing cats from localMax+1 to remoteMax', async () => {
        const { service, ordClient, insertMock } = createMocks(2, 5);
        await service.sync();
        expect(ordClient.getCat).toHaveBeenCalledWith(3);
        expect(ordClient.getCat).toHaveBeenCalledWith(4);
        expect(ordClient.getCat).toHaveBeenCalledWith(5);
        expect(ordClient.getCat).not.toHaveBeenCalledWith(2);
        expect(insertMock).toHaveBeenCalled();
    });
    it('should sync from 0 when database is empty', async () => {
        const { service, ordClient, insertMock } = createMocks(null, 2);
        await service.sync();
        expect(ordClient.getCat).toHaveBeenCalledWith(0);
        expect(ordClient.getCat).toHaveBeenCalledWith(1);
        expect(ordClient.getCat).toHaveBeenCalledWith(2);
        expect(insertMock).toHaveBeenCalled();
    });
    it('should handle multi-batch sync (more cats than BATCH_SIZE)', async () => {
        const { service, ordClient, insertMock } = createMocks(-1, 24);
        await service.sync();
        expect(ordClient.getCat).toHaveBeenCalledTimes(25);
        expect(ordClient.getCat).toHaveBeenCalledWith(0);
        expect(ordClient.getCat).toHaveBeenCalledWith(10);
        expect(ordClient.getCat).toHaveBeenCalledWith(20);
        expect(ordClient.getCat).toHaveBeenCalledWith(24);
        expect(insertMock).toHaveBeenCalledTimes(1);
    });
    it('should prevent concurrent syncs', async () => {
        const { service, ordClient } = createMocks(0, 5);
        ordClient.getCat.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(makeCat(1)), 50)));
        const sync1 = service.sync();
        const sync2 = service.sync();
        await Promise.all([sync1, sync2]);
        expect(ordClient.getLatestCatNumber).toHaveBeenCalledTimes(1);
    });
    it('stops at the first gap and refuses to insert past it (contiguity invariant)', async () => {
        const { service, ordClient, insertMock } = createMocks(-1, 2);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(0))
            .mockRejectedValueOnce(new Error('timeout'))
            .mockResolvedValueOnce(makeCat(2));
        await service.sync();
        expect(insertMock).toHaveBeenCalledTimes(1);
        const insertedValues = insertMock.mock.results[0].value.ignore.mock.results[0].value.values.mock.calls[0][0];
        expect(insertedValues).toHaveLength(1);
        expect(insertedValues[0].catNumber).toBe(0);
    });
    it('does not advance localMax past a gap (next tick retries from the missing cat)', async () => {
        const { service, ordClient, insertMock, cache } = createMocks(-1, 5);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(0))
            .mockResolvedValueOnce(makeCat(1))
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(makeCat(3))
            .mockResolvedValueOnce(makeCat(4));
        await service.sync();
        const inserted = insertMock.mock.results[0].value.ignore.mock.results[0].value.values.mock.calls[0][0];
        expect(inserted).toHaveLength(2);
        expect(inserted.map((r) => r.catNumber)).toEqual([0, 1]);
        expect(cache.onNewCatsSynced).toHaveBeenCalledWith(1);
        expect(cache.onNewCatsSynced).not.toHaveBeenCalledWith(2);
        expect(cache.onNewCatsSynced).not.toHaveBeenCalledWith(5);
        ordClient.getCat.mockReset();
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(2))
            .mockResolvedValueOnce(makeCat(3))
            .mockResolvedValueOnce(makeCat(4));
        await service.sync();
        expect(ordClient.getCat).toHaveBeenCalledWith(2);
        expect(ordClient.getCat).toHaveBeenCalledWith(3);
        expect(ordClient.getCat).toHaveBeenCalledWith(4);
        expect(ordClient.getCat).not.toHaveBeenCalledWith(0);
        expect(ordClient.getCat).not.toHaveBeenCalledWith(1);
    });
    it('should break when entire batch fails (all cats return null or error)', async () => {
        const { service, ordClient, insertMock } = createMocks(-1, 2);
        ordClient.getCat
            .mockRejectedValueOnce(new Error('timeout'))
            .mockRejectedValueOnce(new Error('timeout'))
            .mockRejectedValueOnce(new Error('timeout'));
        await service.sync();
        expect(insertMock).not.toHaveBeenCalled();
    });
    it('should not throw when getLatestCatNumber fails (ord completely down)', async () => {
        const { service, ordClient } = createMocks(0, 5);
        ordClient.getLatestCatNumber.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(service.sync()).resolves.toBeUndefined();
    });
    it('should retry a cat with no block_hash rather than advance past it', async () => {
        const { service, ordClient, insertMock } = createMocks(-1, 0);
        ordClient.getCat.mockResolvedValueOnce({ ...makeCat(0), block_hash: null });
        await expect(service.sync()).resolves.toBeUndefined();
        ordClient.getCat.mockResolvedValueOnce(makeCat(0));
        await service.sync();
        const insertedValues = insertMock.mock.results[0].value.ignore.mock.results[0].value.values.mock.calls[0][0];
        expect(insertedValues).toHaveLength(1);
        expect(insertedValues[0].catNumber).toBe(0);
    });
    it('should reset syncing flag after error (allows retry on next tick)', async () => {
        const { service, ordClient } = createMocks(0, 5);
        ordClient.getLatestCatNumber.mockRejectedValue(new Error('network down'));
        await service.sync();
        ordClient.getLatestCatNumber.mockResolvedValue(0);
        await service.sync();
        expect(ordClient.getLatestCatNumber).toHaveBeenCalledTimes(2);
    });
    it('should recover after ord goes down and comes back', async () => {
        const { service, ordClient, insertMock } = createMocks(0, 5);
        ordClient.getLatestCatNumber.mockRejectedValueOnce(new Error('ECONNREFUSED'));
        await service.sync();
        expect(insertMock).not.toHaveBeenCalled();
        ordClient.getLatestCatNumber.mockResolvedValueOnce(2);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(1))
            .mockResolvedValueOnce(makeCat(2));
        await service.sync();
        expect(insertMock).toHaveBeenCalled();
    });
    it('should handle getLatestCatNumber returning -1 (ord has no cats)', async () => {
        const { service, insertMock } = createMocks(null, -1);
        await service.sync();
        expect(insertMock).not.toHaveBeenCalled();
    });
    describe('getSyncHealth', () => {
        it('reports null timestamps + no error before any sync has run', () => {
            const { service } = createMocks();
            expect(service.getSyncHealth()).toEqual({ lastSuccessAt: null, lastErrorAt: null, lastError: null });
        });
        it('records lastSuccessAt after a successful (up-to-date) sync', async () => {
            const { service } = createMocks(10, 10);
            await service.sync();
            const health = service.getSyncHealth();
            expect(health.lastSuccessAt).toBeInstanceOf(Date);
            expect(health.lastError).toBeNull();
        });
    });
    describe('handleSync (@Interval wrapper)', () => {
        it('delegates to sync()', async () => {
            const { service } = createMocks();
            const sync = jest.spyOn(service, 'sync').mockResolvedValue(undefined);
            await service.handleSync();
            expect(sync).toHaveBeenCalledTimes(1);
        });
    });
    describe('onModuleInit (fire-and-forget backfill chain)', () => {
        it('kicks off the color backfill THEN the rarity recompute', async () => {
            const { service } = createMocks();
            const backfill = jest.spyOn(service, 'backfillDominantColorCategory').mockResolvedValue(undefined);
            const rarity = jest.spyOn(service, 'recomputeRarityForAllCategories').mockResolvedValue(undefined);
            await service.onModuleInit();
            await new Promise((r) => setImmediate(r));
            expect(backfill).toHaveBeenCalledTimes(1);
            expect(rarity).toHaveBeenCalledTimes(1);
        });
        it('swallows a backfill failure (onModuleInit resolves, warn logged, rarity skipped)', async () => {
            const { service } = createMocks();
            jest.spyOn(service, 'backfillDominantColorCategory').mockRejectedValue(new Error('boom'));
            const rarity = jest.spyOn(service, 'recomputeRarityForAllCategories').mockResolvedValue(undefined);
            const warn = jest.spyOn(service.logger, 'warn').mockImplementation(() => { });
            await expect(service.onModuleInit()).resolves.toBeUndefined();
            await new Promise((r) => setImmediate(r));
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('Boot-time backfill failed: boom'));
            expect(rarity).not.toHaveBeenCalled();
        });
    });
    describe('backfillDominantColorCategory', () => {
        it('groups NULL-color rows by computed color and issues an UPDATE per bucket', async () => {
            const rows = [
                { catNumber: 1, txHash: 'a'.repeat(64), blockHash: 'b'.repeat(64), feeRate: 10 },
                { catNumber: 2, txHash: 'c'.repeat(64), blockHash: 'd'.repeat(64), feeRate: 20 },
            ];
            const limit = jest.fn().mockResolvedValue(rows);
            const updateWhere = jest.fn().mockResolvedValue(undefined);
            const drizzle = {
                db: {
                    select: jest.fn(() => ({ from: () => ({ where: () => ({ limit }) }) })),
                    update: jest.fn(() => ({ set: () => ({ where: updateWhere }) })),
                },
            };
            const service = new sync_service_1.SyncService(drizzle, {}, {});
            await service.backfillDominantColorCategory();
            expect(drizzle.db.update).toHaveBeenCalled();
            expect(updateWhere).toHaveBeenCalled();
        });
        it('does nothing when no rows have a NULL color', async () => {
            const limit = jest.fn().mockResolvedValue([]);
            const drizzle = {
                db: {
                    select: jest.fn(() => ({ from: () => ({ where: () => ({ limit }) }) })),
                    update: jest.fn(),
                },
            };
            const service = new sync_service_1.SyncService(drizzle, {}, {});
            await service.backfillDominantColorCategory();
            expect(drizzle.db.update).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=sync.service.spec.js.map