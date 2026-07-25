"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const listings_service_1 = require("./listings.service");
jest.mock('ordpool-sdk/core', () => ({
    Network: {
        Mainnet: 'mainnet',
        Testnet3: 'testnet3',
        Testnet4: 'testnet4',
        Signet: 'signet',
        Regtest: 'regtest',
    },
    MAX_ASK_SATS: 21_000_000 * 100_000_000,
}));
const REAL_TXID = 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df';
const OTHER_TXID = 'ff'.repeat(32);
const ORD_ADDR = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9';
const OTHER_ORD_ADDR = 'bc1p85ra9kv6a48yvk4mq4hx08wxk6t32tdjw9ylahergexkymsc3uwsdrx6sh';
const PAY_ADDR = 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm';
const NOW_S = 1_784_419_200;
const validDto = (over = {}) => ({
    catNumber: 42,
    cats: [42],
    network: 'mainnet',
    askSats: 21_000,
    payTo: PAY_ADDR,
    catTxid: REAL_TXID,
    catVout: 0,
    ordinalsAddress: ORD_ADDR,
    ...over,
});
const persistedRow = (over = {}) => ({
    id: 'uuid-1',
    catNumber: 42,
    catsOnUtxo: [42],
    headlineCatNumber: 42,
    network: 'mainnet',
    askSats: 21_000,
    payTo: PAY_ADDR,
    catTxid: REAL_TXID,
    catVout: 0,
    ordinalsAddress: ORD_ADDR,
    signedAt: NOW_S,
    signature: 'sig',
    createdAt: new Date(NOW_S * 1000),
    ...over,
});
function createDrizzleMock(overrides = {}) {
    const chain = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        offset: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        onDuplicateKeyUpdate: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockReturnThis(),
        ...overrides,
    };
    return { db: chain };
}
function createOrdMock(opts = {}) {
    const { catsAtOutput = [42], location = { txid: REAL_TXID, vout: 0, ordinalsAddress: ORD_ADDR }, throwOnLookup = false, throwOnCatsAtOutput = false, } = opts;
    return {
        getCatsAtOutput: jest.fn().mockImplementation(() => {
            if (throwOnCatsAtOutput)
                throw new Error('ord /output unreachable');
            return Promise.resolve(catsAtOutput);
        }),
        getCatCurrentLocation: jest.fn().mockImplementation(() => {
            if (throwOnLookup)
                throw new Error('ord unreachable');
            return Promise.resolve(location);
        }),
    };
}
describe('ListingsService.create — session-address match', () => {
    it('rejects session-address-mismatch when dto.ordinalsAddress differs from the session address', async () => {
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto(), OTHER_ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'session-address-mismatch' }),
        });
    });
});
describe('ListingsService.create — network + headline pre-checks (v3)', () => {
    it('rejects network-mismatch when the DTO network is not the backend deployment', async () => {
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto({ network: 'testnet3' }), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'network-mismatch' }),
        });
    });
    it('rejects headline-not-in-bundle when catNumber is not a member of cats', async () => {
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto({ catNumber: 999, cats: [42, 100] }), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'headline-not-in-bundle' }),
        });
    });
    it('accepts a bundle where headline is min(cats) — the canonical case', async () => {
        const ord = createOrdMock({ catsAtOutput: [0, 42, 100] });
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow({ catNumber: 0, catsOnUtxo: [0, 42, 100], headlineCatNumber: 0 })]),
        });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto({ catNumber: 0, cats: [0, 42, 100] }), ORD_ADDR)).resolves.toBeDefined();
    });
    it('accepts a bundle where headline is a non-minimum member (presentational choice)', async () => {
        const ord = createOrdMock({ catsAtOutput: [0, 42, 100] });
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow({ catsOnUtxo: [0, 42, 100] })]),
        });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto({ catNumber: 42, cats: [0, 42, 100] }), ORD_ADDR)).resolves.toBeDefined();
    });
});
describe('ListingsService.create — on-chain cross-check', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('rejects ord-lookup-failed when the /output call throws', async () => {
        const ord = createOrdMock({ throwOnCatsAtOutput: true });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'ord-lookup-failed' }),
        });
        expect(ord.getCatCurrentLocation).not.toHaveBeenCalled();
    });
    it('rejects cat-not-found when /output returns null (UTXO unknown / spent)', async () => {
        const ord = createOrdMock({ catsAtOutput: null });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects cat-not-found when /output returns an empty cats array (UTXO exists, no cats)', async () => {
        const ord = createOrdMock({ catsAtOutput: [] });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects cats-bundle-drift when the live bundle differs from what was signed (extra cat)', async () => {
        const ord = createOrdMock({ catsAtOutput: [42, 99] });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto({ cats: [42] }), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cats-bundle-drift' }),
        });
    });
    it('rejects cats-bundle-drift when the live bundle differs (missing cat)', async () => {
        const ord = createOrdMock({ catsAtOutput: [42, 100] });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto({ catNumber: 42, cats: [0, 42, 100] }), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cats-bundle-drift' }),
        });
    });
    it('rejects ord-lookup-failed when the /cat lookup throws (after /output passed)', async () => {
        const ord = createOrdMock({ throwOnLookup: true });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'ord-lookup-failed' }),
        });
    });
    it('rejects cat-not-found when the headline-owner lookup returns null', async () => {
        const ord = createOrdMock({ location: null });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects not-current-owner when the signature is valid but the address does not own the cat right now', async () => {
        const ord = createOrdMock({ location: { txid: REAL_TXID, vout: 0, ordinalsAddress: OTHER_ORD_ADDR } });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'not-current-owner' }),
        });
    });
    it('rejects outpoint-mismatch when the cat has moved since signing', async () => {
        const ord = createOrdMock({
            catsAtOutput: [42],
            location: { txid: OTHER_TXID, vout: 0, ordinalsAddress: ORD_ADDR },
        });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'outpoint-mismatch' }),
        });
    });
});
describe('ListingsService.create — happy path + upsert', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('inserts on ok + on-chain match + within-window and reads back the DTO', async () => {
        const ord = createOrdMock();
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow()]),
        });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        const result = await service.create(validDto(), ORD_ADDR);
        expect(result).toMatchObject({
            catNumber: 42,
            cats: [42],
            askSats: 21_000,
            payTo: PAY_ADDR,
            catTxid: REAL_TXID,
            catVout: 0,
            ordinalsAddress: ORD_ADDR,
            network: 'mainnet',
        });
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(drizzle.db.insert).toHaveBeenCalled();
        expect(drizzle.db.onDuplicateKeyUpdate).toHaveBeenCalled();
    });
    it('read-back DTO carries the multi-cat bundle exactly as persisted (v3 UI needs the full array)', async () => {
        const ord = createOrdMock({ catsAtOutput: [0, 42, 100] });
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow({ catNumber: 0, catsOnUtxo: [0, 42, 100], headlineCatNumber: 0 })]),
        });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        const result = await service.create(validDto({ catNumber: 0, cats: [0, 42, 100] }), ORD_ADDR);
        expect(result.cats).toEqual([0, 42, 100]);
        expect(result.catNumber).toBe(0);
    });
    it('throws persist-race when readback returns nothing (concurrent prune)', async () => {
        const ord = createOrdMock();
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto(), ORD_ADDR)).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'persist-race' }),
        });
    });
});
describe('ListingsService.findByCatNumber', () => {
    it('returns the DTO (including the cats bundle) when the row exists', async () => {
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow({ catsOnUtxo: [42, 100] })]),
        });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        const result = await service.findByCatNumber(42);
        expect(result?.catNumber).toBe(42);
        expect(result?.cats).toEqual([42, 100]);
    });
    it('returns null when the row does not exist', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        expect(await service.findByCatNumber(999)).toBeNull();
    });
});
describe('ListingsService.findByOutpoint (v3 UTXO lookup)', () => {
    it('returns the DTO for the UTXO when it exists', async () => {
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow()]),
        });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        const result = await service.findByOutpoint('mainnet', REAL_TXID, 0);
        expect(result?.catNumber).toBe(42);
    });
    it('returns null when no listing pins this UTXO', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        expect(await service.findByOutpoint('mainnet', OTHER_TXID, 0)).toBeNull();
    });
});
describe('ListingsService.findPaginated — bounds', () => {
    const service = () => new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
    it('rejects itemsPerPage=0', async () => {
        await expect(service().findPaginated(0, 1)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('rejects itemsPerPage>100', async () => {
        await expect(service().findPaginated(101, 1)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('rejects currentPage=0', async () => {
        await expect(service().findPaginated(25, 0)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('rejects non-integer itemsPerPage', async () => {
        await expect(service().findPaginated(2.5, 1)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
});
describe('ListingsService.deleteByCatNumber', () => {
    it('runs the delete query with the catNumber', async () => {
        const where = jest.fn().mockResolvedValue(undefined);
        const drizzle = createDrizzleMock({
            delete: jest.fn().mockReturnValue({ where }),
        });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        await service.deleteByCatNumber(42);
        expect(drizzle.db.delete).toHaveBeenCalled();
        expect(where).toHaveBeenCalled();
    });
});
//# sourceMappingURL=listings.service.spec.js.map