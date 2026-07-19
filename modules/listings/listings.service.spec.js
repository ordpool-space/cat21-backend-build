"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const listings_service_1 = require("./listings.service");
let mockVerify;
let mockBuildMessage;
jest.mock('ordpool-sdk/core', () => ({
    buildListingMessage: (fields) => mockBuildMessage(fields),
    verifyListingSignature: (args) => mockVerify(args),
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
    network: 'mainnet',
    askSats: 21_000,
    payTo: PAY_ADDR,
    catTxid: REAL_TXID,
    catVout: 0,
    ordinalsAddress: ORD_ADDR,
    signedAt: NOW_S,
    signature: 'AUHd69PrJQEv+oKTfZ8l+WROBHuy9HKrbFCJu7U1iK2iiEy1vMU5EfMtjc+VSHM7aU0SDbak5IUZRVno2P5mjSafAQ==',
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
function createOrdMock(location = null, throwOnLookup = false) {
    return {
        getCatCurrentLocation: jest.fn().mockImplementation(() => {
            if (throwOnLookup)
                throw new Error('ord unreachable');
            return Promise.resolve(location);
        }),
    };
}
describe('ListingsService.create — signature verification', () => {
    beforeEach(() => {
        mockVerify = jest.fn().mockReturnValue({ ok: true });
        mockBuildMessage = jest.fn().mockReturnValue('some-message');
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('rejects with signature-* code when verify returns ok=false', async () => {
        mockVerify.mockReturnValue({ ok: false, reason: 'signature-does-not-verify', detail: 'schnorr false' });
        const drizzle = createDrizzleMock();
        const ord = createOrdMock();
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'signature-signature-does-not-verify' }),
        });
        expect(ord.getCatCurrentLocation).not.toHaveBeenCalled();
    });
    it('maps every SDK rejection reason into a signature-* code', async () => {
        const reasons = [
            'malformed-signature',
            'unsupported-address-type',
            'invalid-address',
            'signature-does-not-verify',
        ];
        for (const reason of reasons) {
            mockVerify.mockReturnValue({ ok: false, reason });
            const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
            await expect(service.create(validDto())).rejects.toMatchObject({
                response: expect.objectContaining({ code: `signature-${reason}` }),
            });
        }
    });
    it('surfaces signature-* codes for malformed input the SDK verify rejects (no separate build-message step)', async () => {
        mockVerify.mockReturnValue({ ok: false, reason: 'malformed-signature', detail: 'witness structure decode failed' });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'signature-malformed-signature' }),
        });
    });
});
describe('ListingsService.create — anti-replay window', () => {
    beforeEach(() => {
        mockVerify = jest.fn().mockReturnValue({ ok: true });
        mockBuildMessage = jest.fn().mockReturnValue('some-message');
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('rejects signature-too-old when signedAt is > 24h in the past', async () => {
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto({ signedAt: NOW_S - 25 * 3600 }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'signature-too-old' }),
        });
    });
    it('accepts a signedAt exactly at the 24h back edge (inclusive floor)', async () => {
        const ord = createOrdMock({ txid: REAL_TXID, vout: 0, ordinalsAddress: ORD_ADDR });
        const dbSelectResult = [{
                id: 'uuid-1', catNumber: 42, askSats: 21_000, payTo: PAY_ADDR, catTxid: REAL_TXID,
                catVout: 0, ordinalsAddress: ORD_ADDR, signedAt: NOW_S - 24 * 3600,
                signature: 'sig', createdAt: new Date(NOW_S * 1000),
            }];
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue(dbSelectResult) });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto({ signedAt: NOW_S - 24 * 3600 }))).resolves.toBeDefined();
    });
    it('rejects signature-in-future when signedAt is > 1h in the future', async () => {
        const service = new listings_service_1.ListingsService(createDrizzleMock(), createOrdMock());
        await expect(service.create(validDto({ signedAt: NOW_S + 2 * 3600 }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'signature-in-future' }),
        });
    });
});
describe('ListingsService.create — on-chain cross-check', () => {
    beforeEach(() => {
        mockVerify = jest.fn().mockReturnValue({ ok: true });
        mockBuildMessage = jest.fn().mockReturnValue('some-message');
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('rejects ord-lookup-failed when ord throws', async () => {
        const ord = createOrdMock(null, true);
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'ord-lookup-failed' }),
        });
    });
    it('rejects cat-not-found when ord returns null (unspendable output or unknown cat)', async () => {
        const ord = createOrdMock(null);
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects not-current-owner when signature is valid but the address does not own the cat right now', async () => {
        const ord = createOrdMock({ txid: REAL_TXID, vout: 0, ordinalsAddress: OTHER_ORD_ADDR });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'not-current-owner' }),
        });
    });
    it('rejects outpoint-mismatch when the cat has moved since signing', async () => {
        const ord = createOrdMock({ txid: OTHER_TXID, vout: 0, ordinalsAddress: ORD_ADDR });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'outpoint-mismatch' }),
        });
    });
    it('rejects outpoint-mismatch when only vout differs', async () => {
        const ord = createOrdMock({ txid: REAL_TXID, vout: 1, ordinalsAddress: ORD_ADDR });
        const service = new listings_service_1.ListingsService(createDrizzleMock(), ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'outpoint-mismatch' }),
        });
    });
});
describe('ListingsService.create — happy path + upsert', () => {
    beforeEach(() => {
        mockVerify = jest.fn().mockReturnValue({ ok: true });
        mockBuildMessage = jest.fn().mockReturnValue('some-message');
        jest.spyOn(Date, 'now').mockReturnValue(NOW_S * 1000);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('inserts on ok + on-chain match + within-window and reads back the DTO', async () => {
        const ord = createOrdMock({ txid: REAL_TXID, vout: 0, ordinalsAddress: ORD_ADDR });
        const persistedRow = {
            id: 'uuid-1', catNumber: 42, askSats: 21_000, payTo: PAY_ADDR, catTxid: REAL_TXID,
            catVout: 0, ordinalsAddress: ORD_ADDR, signedAt: NOW_S, signature: 'sig',
            createdAt: new Date(NOW_S * 1000),
        };
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow]),
        });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        const result = await service.create(validDto());
        expect(result).toMatchObject({
            catNumber: 42,
            askSats: 21_000,
            payTo: PAY_ADDR,
            catTxid: REAL_TXID,
            catVout: 0,
            ordinalsAddress: ORD_ADDR,
        });
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(drizzle.db.insert).toHaveBeenCalled();
        expect(drizzle.db.onDuplicateKeyUpdate).toHaveBeenCalled();
    });
    it('throws persist-race when readback returns nothing (concurrent prune)', async () => {
        const ord = createOrdMock({ txid: REAL_TXID, vout: 0, ordinalsAddress: ORD_ADDR });
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new listings_service_1.ListingsService(drizzle, ord);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'persist-race' }),
        });
    });
});
describe('ListingsService.findByCatNumber', () => {
    it('returns the DTO when the row exists', async () => {
        const row = {
            id: 'uuid-1', catNumber: 42, askSats: 21_000, payTo: PAY_ADDR, catTxid: REAL_TXID,
            catVout: 0, ordinalsAddress: ORD_ADDR, signedAt: NOW_S, signature: 'sig',
            createdAt: new Date(NOW_S * 1000),
        };
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([row]) });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        const result = await service.findByCatNumber(42);
        expect(result?.catNumber).toBe(42);
    });
    it('returns null when the row does not exist', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new listings_service_1.ListingsService(drizzle, createOrdMock());
        expect(await service.findByCatNumber(999)).toBeNull();
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