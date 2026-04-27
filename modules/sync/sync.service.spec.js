"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sync_service_1 = require("./sync.service");
describe('deriveCategory', () => {
    it('should return sub1k for cats 0-999', () => {
        expect((0, sync_service_1.deriveCategory)(0)).toBe('sub1k');
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
        return {
            id: `hash${n}i0`,
            number: n,
            address: 'bc1p...',
            sat: 100000 + n,
            fee: 1000,
            height,
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
            getBlockHash: jest.fn().mockImplementation(() => Promise.resolve('0'.repeat(64))),
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
    it('should fetch block hashes for unique heights only', async () => {
        const { service, ordClient } = createMocks(-1, 1);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(0, 800000))
            .mockResolvedValueOnce(makeCat(1, 800000));
        await service.sync();
        expect(ordClient.getBlockHash).toHaveBeenCalledWith(800000);
        expect(ordClient.getBlockHash).toHaveBeenCalledTimes(1);
    });
    it('should fetch separate block hashes for different heights', async () => {
        const { service, ordClient } = createMocks(-1, 1);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(0, 800000))
            .mockResolvedValueOnce(makeCat(1, 800001));
        await service.sync();
        expect(ordClient.getBlockHash).toHaveBeenCalledWith(800000);
        expect(ordClient.getBlockHash).toHaveBeenCalledWith(800001);
        expect(ordClient.getBlockHash).toHaveBeenCalledTimes(2);
    });
    it('should prevent concurrent syncs', async () => {
        const { service, ordClient } = createMocks(0, 5);
        ordClient.getCat.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(makeCat(1)), 50)));
        const sync1 = service.sync();
        const sync2 = service.sync();
        await Promise.all([sync1, sync2]);
        expect(ordClient.getLatestCatNumber).toHaveBeenCalledTimes(1);
    });
    it('should handle partial batch failures gracefully (some cats fail)', async () => {
        const { service, ordClient, insertMock } = createMocks(-1, 2);
        ordClient.getCat
            .mockResolvedValueOnce(makeCat(0))
            .mockRejectedValueOnce(new Error('timeout'))
            .mockResolvedValueOnce(makeCat(2));
        await service.sync();
        expect(insertMock).toHaveBeenCalled();
        const insertedValues = insertMock.mock.results[0].value.ignore.mock.results[0].value.values.mock.calls[0][0];
        expect(insertedValues).toHaveLength(2);
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
    it('should not throw when getBlockHash fails mid-sync', async () => {
        const { service, ordClient } = createMocks(-1, 0);
        ordClient.getBlockHash.mockRejectedValue(new Error('500 Internal Server Error'));
        await expect(service.sync()).resolves.toBeUndefined();
    });
    it('should reset syncing flag after error (allows retry on next tick)', async () => {
        const { service, ordClient } = createMocks(0, 5);
        ordClient.getLatestCatNumber.mockRejectedValue(new Error('network down'));
        await service.sync();
        ordClient.getLatestCatNumber.mockResolvedValue(0);
        await service.sync();
        expect(ordClient.getLatestCatNumber).toHaveBeenCalledTimes(2);
    });
    it('should clear blockHashCache after error (no stale data)', async () => {
        const { service, ordClient } = createMocks(-1, 0);
        await service.sync();
        expect(ordClient.getBlockHash).toHaveBeenCalledTimes(1);
        ordClient.getLatestCatNumber.mockResolvedValue(1);
        ordClient.getCat.mockResolvedValue(makeCat(1));
        await service.sync();
        expect(ordClient.getBlockHash).toHaveBeenCalledTimes(2);
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
});
//# sourceMappingURL=sync.service.spec.js.map