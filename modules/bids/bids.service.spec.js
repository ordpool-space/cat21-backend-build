"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const btc = require("@scure/btc-signer");
const testing_1 = require("ordpool-sdk/testing");
const bids_service_1 = require("./bids.service");
const REAL_TXID = 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df';
const OTHER_TXID = 'ff'.repeat(32);
const BUYER_ORD_ADDR = testing_1.TEST_OFFER_BUYER_ORDINALS_ADDRESS;
const BUYER_PAY_ADDR = testing_1.TEST_OFFER_BUYER_PAYMENT_ADDRESS;
const SELLER_PAY_ADDR = testing_1.TEST_OFFER_SELLER_PAYMENT_ADDRESS;
const CAT_VALUE_SATS = 546;
const BID_SATS = 21_000;
const NOT_A_PSBT = 'AAECAw==';
const DEFAULT_OFFER = (0, testing_1.buildSignedTestBuyOffer)({
    sellerUtxo: { txid: REAL_TXID, vout: 0, value: CAT_VALUE_SATS },
    priceSats: BID_SATS,
});
const VALID_PSBT = DEFAULT_OFFER.base64;
const validDto = (over = {}) => ({
    network: 'mainnet',
    catTxid: REAL_TXID,
    catVout: 0,
    cats: [42],
    headlineCatNumber: 42,
    bidSats: BID_SATS,
    buyerOrdinalsAddress: BUYER_ORD_ADDR,
    buyerPaymentAddress: BUYER_PAY_ADDR,
    sellerPaymentAddress: SELLER_PAY_ADDR,
    psbtBase64: VALID_PSBT,
    ...over,
});
const persistedRow = (over = {}) => ({
    id: 'uuid-1',
    network: 'mainnet',
    catTxid: REAL_TXID,
    catVout: 0,
    catsOnUtxo: [42],
    headlineCatNumber: 42,
    bidSats: BID_SATS,
    buyerOrdinalsAddress: BUYER_ORD_ADDR,
    buyerPaymentAddress: BUYER_PAY_ADDR,
    sellerPaymentAddress: SELLER_PAY_ADDR,
    psbtBase64: VALID_PSBT,
    createdAt: new Date('2026-07-22T10:00:00Z'),
    ...over,
});
function psbtWith(opts) {
    return (0, testing_1.buildSignedTestBuyOffer)({
        sellerUtxo: { txid: REAL_TXID, vout: 0, value: CAT_VALUE_SATS },
        priceSats: BID_SATS,
        ...opts,
    }).base64;
}
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
    const { catsAtOutput = [42], throwOnCatsAtOutput = false } = opts;
    return {
        getCatsAtOutput: jest.fn().mockImplementation(() => {
            if (throwOnCatsAtOutput)
                throw new Error('ord /output unreachable');
            return Promise.resolve(catsAtOutput);
        }),
    };
}
function createElectrsMock(opts = {}) {
    const status = opts.status ?? 'unspent';
    const prevouts = opts.prevouts ?? DEFAULT_OFFER.prevouts;
    return {
        getOutpointStatus: jest.fn().mockResolvedValue(status),
        isOutpointSpent: jest.fn().mockResolvedValue(status === 'spent'),
        getPrevout: jest.fn().mockImplementation((txid, vout) => Promise.resolve(prevouts.get(`${txid}:${vout}`) ?? 'not-found')),
    };
}
describe('BidsService.create — pre-checks (cheap fails first)', () => {
    it('rejects network-mismatch when DTO network is not the backend deployment', async () => {
        const ord = createOrdMock();
        const electrs = createElectrsMock();
        const service = new bids_service_1.BidsService(createDrizzleMock(), ord, electrs);
        await expect(service.create(validDto({ network: 'testnet3', psbtBase64: NOT_A_PSBT }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'network-mismatch' }),
        });
        expect(ord.getCatsAtOutput).not.toHaveBeenCalled();
        expect(electrs.getOutpointStatus).not.toHaveBeenCalled();
    });
    it('picks up BACKEND_NETWORK from process.env at construction (regtest bypass)', async () => {
        const prev = process.env.BACKEND_NETWORK;
        process.env.BACKEND_NETWORK = 'regtest';
        try {
            const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
            await expect(service.create(validDto({ network: 'mainnet' }))).rejects.toMatchObject({
                response: expect.objectContaining({
                    code: 'network-mismatch',
                    detail: expect.stringContaining('serves regtest'),
                }),
            });
        }
        finally {
            if (prev === undefined)
                delete process.env.BACKEND_NETWORK;
            else
                process.env.BACKEND_NETWORK = prev;
        }
    });
    it('rejects headline-not-in-bundle when headlineCatNumber is missing from cats', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ headlineCatNumber: 999, cats: [42, 100], psbtBase64: NOT_A_PSBT }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'headline-not-in-bundle' }),
        });
    });
    it('rejects bid-below-marketplace-floor for bidSats below the spam gate', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ bidSats: 500, psbtBase64: NOT_A_PSBT }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'bid-below-marketplace-floor' }),
        });
    });
});
describe('BidsService.create — PSBT decode + shape', () => {
    it('rejects psbt-malformed when base64 decode fails', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: '@@@invalid base64@@@' }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-malformed' }),
        });
    });
    it('rejects psbt-malformed when the bytes do not parse as a PSBT', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: NOT_A_PSBT }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-malformed' }),
        });
    });
    it('rejects psbt-shape-invalid when PSBT has only 1 input (no buyer funding)', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: psbtWith({ buyerFunding: [] }) }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-shape-invalid' }),
        });
    });
    it('rejects psbt-shape-invalid when PSBT has 4 outputs (over the 3 max)', async () => {
        const outputs = [
            { address: BUYER_ORD_ADDR, amount: CAT_VALUE_SATS },
            { address: SELLER_PAY_ADDR, amount: BID_SATS + CAT_VALUE_SATS },
            { address: BUYER_PAY_ADDR, amount: 10_000 },
            { address: BUYER_PAY_ADDR, amount: 5_000 },
        ];
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: psbtWith({ outputs }) }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-shape-invalid' }),
        });
    });
});
describe('BidsService.create: SDK validator wiring (every DTO field reaches it)', () => {
    it.each([
        ['expectedSellerUtxo', 'missing-seller-input', () => validDto({ psbtBase64: psbtWith({ sellerUtxo: { txid: OTHER_TXID, vout: 0, value: CAT_VALUE_SATS } }) })],
        ['expectedSellerPaymentAddress', 'payment-output-wrong-address', () => validDto({ sellerPaymentAddress: testing_1.TEST_OFFER_STRANGER_ADDRESS })],
        ['expectedBuyerReceiveAddress', 'cat-output-wrong-address', () => validDto({ buyerOrdinalsAddress: testing_1.TEST_OFFER_STRANGER_ADDRESS })],
        ['expectedBuyerChangeAddress', 'change-output-wrong-address', () => validDto({ buyerPaymentAddress: testing_1.TEST_OFFER_STRANGER_ADDRESS })],
        ['expectedExactPrice', 'wrong-price-exact', () => validDto({ bidSats: BID_SATS + 1 })],
    ])('%s: a mismatch surfaces as psbt-%s', async (_field, reason, dto) => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(dto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: `psbt-${reason}` }),
        });
    });
    it('surfaces a cat output below its dust floor as psbt-wrong-postage', async () => {
        const outputs = [
            { address: BUYER_ORD_ADDR, amount: 200 },
            { address: SELLER_PAY_ADDR, amount: BID_SATS + CAT_VALUE_SATS },
            { address: BUYER_PAY_ADDR, amount: 10_000 },
        ];
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: psbtWith({ outputs }) }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-wrong-postage' }),
        });
    });
    it('surfaces a buyer input signed other than SIGHASH_ALL as psbt-sighash-not-all', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        await expect(service.create(validDto({ psbtBase64: psbtWith({ buyerSighash: btc.SigHash.NONE }) }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-sighash-not-all' }),
        });
    });
    it('a rejected PSBT costs no electrs or ord lookup', async () => {
        const ord = createOrdMock();
        const electrs = createElectrsMock();
        const service = new bids_service_1.BidsService(createDrizzleMock(), ord, electrs);
        await expect(service.create(validDto({ bidSats: BID_SATS + 1 }))).rejects.toBeInstanceOf(common_1.BadRequestException);
        expect(electrs.getOutpointStatus).not.toHaveBeenCalled();
        expect(ord.getCatsAtOutput).not.toHaveBeenCalled();
    });
});
describe('BidsService.create: electrs + ord', () => {
    it('checks every buyer funding input against electrs, by its real outpoint', async () => {
        const offer = (0, testing_1.buildSignedTestBuyOffer)({
            sellerUtxo: { txid: REAL_TXID, vout: 0, value: CAT_VALUE_SATS },
            priceSats: BID_SATS,
            buyerFunding: [
                { txid: (0, testing_1.testFundingTxid)(0xaa), vout: 1, value: 60_000 },
                { txid: (0, testing_1.testFundingTxid)(0xbb), vout: 3, value: 40_000 },
            ],
        });
        const electrs = createElectrsMock({ prevouts: offer.prevouts });
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([persistedRow()]) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), electrs);
        await service.create(validDto({ psbtBase64: offer.base64 }));
        expect(electrs.getOutpointStatus.mock.calls).toEqual([
            [(0, testing_1.testFundingTxid)(0xaa), 1],
            [(0, testing_1.testFundingTxid)(0xbb), 3],
        ]);
    });
    it('rejects psbt-prevout-amount-mismatch when electrs reports a different input value than the PSBT claims', async () => {
        const tampered = new Map(DEFAULT_OFFER.prevouts);
        const fundingKey = `${(0, testing_1.testFundingTxid)(0xaa)}:1`;
        const real = DEFAULT_OFFER.prevouts.get(fundingKey);
        tampered.set(fundingKey, { script: real.script, amountSats: real.amountSats + 1 });
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock({ prevouts: tampered }));
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: { code: 'psbt-prevout-amount-mismatch' },
        });
    });
    it('rejects psbt-buyer-input-unspendable when a buyer input has no chain prevout (phantom)', async () => {
        const electrs = {
            getOutpointStatus: jest.fn().mockResolvedValue('unspent'),
            isOutpointSpent: jest.fn().mockResolvedValue(false),
            getPrevout: jest.fn().mockResolvedValue('not-found'),
        };
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), electrs);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: { code: 'psbt-buyer-input-unspendable' },
        });
    });
    it('rejects prevout-fetch-failed (fail closed) when a prevout cannot be read from electrs', async () => {
        const electrs = {
            getOutpointStatus: jest.fn().mockResolvedValue('unspent'),
            isOutpointSpent: jest.fn().mockResolvedValue(false),
            getPrevout: jest.fn().mockResolvedValue('unknown'),
        };
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), electrs);
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: { code: 'prevout-fetch-failed' },
        });
    });
    it('rejects ord-lookup-failed when the /output call throws', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock({ throwOnCatsAtOutput: true }), createElectrsMock());
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'ord-lookup-failed' }),
        });
    });
    it('rejects cat-not-found when /output returns null', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock({ catsAtOutput: null }), createElectrsMock());
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects cat-not-found when /output returns empty cats', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock({ catsAtOutput: [] }), createElectrsMock());
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cat-not-found' }),
        });
    });
    it('rejects cats-bundle-drift when the live bundle differs from the signed one', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock({ catsAtOutput: [42, 99] }), createElectrsMock());
        await expect(service.create(validDto({ cats: [42] }))).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'cats-bundle-drift' }),
        });
    });
    it('rejects psbt-buyer-input-unspendable when electrs reports a buyer input as spent (phantom txid or double-spend)', async () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock({ status: 'spent' }));
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'psbt-buyer-input-unspendable' }),
        });
    });
    it('accepts a bid when electrs reports the buyer input as `unknown` (fail-safe on electrs blip)', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([persistedRow()]) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock({ status: 'unknown' }));
        await expect(service.create(validDto())).resolves.toMatchObject({ catTxid: REAL_TXID, bidSats: BID_SATS });
    });
});
describe('BidsService.create — happy path + upsert', () => {
    it('inserts on ok + on-chain match and reads back the DTO', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([persistedRow()]) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock());
        const result = await service.create(validDto());
        expect(result).toMatchObject({
            network: 'mainnet',
            catTxid: REAL_TXID,
            catVout: 0,
            cats: [42],
            bidSats: BID_SATS,
            buyerOrdinalsAddress: BUYER_ORD_ADDR,
            sellerPaymentAddress: SELLER_PAY_ADDR,
        });
        expect(result.psbtBase64).toBe(VALID_PSBT);
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(drizzle.db.values).toHaveBeenCalledWith(expect.objectContaining({ psbtBase64: VALID_PSBT, bidSats: BID_SATS }));
        expect(drizzle.db.onDuplicateKeyUpdate).toHaveBeenCalled();
    });
    it('accepts a cat that sits on a non-zero output, validating against that outpoint', async () => {
        const ord = createOrdMock();
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([persistedRow({ catVout: 1 })]) });
        const offer = (0, testing_1.buildSignedTestBuyOffer)({
            sellerUtxo: { txid: REAL_TXID, vout: 1, value: CAT_VALUE_SATS },
            priceSats: BID_SATS,
        });
        const service = new bids_service_1.BidsService(drizzle, ord, createElectrsMock({ prevouts: offer.prevouts }));
        await expect(service.create(validDto({ catVout: 1, psbtBase64: offer.base64 }))).resolves.toMatchObject({ catVout: 1 });
        expect(ord.getCatsAtOutput).toHaveBeenCalledWith(REAL_TXID, 1);
    });
    it('read-back returns the multi-cat bundle exactly as persisted', async () => {
        const drizzle = createDrizzleMock({
            limit: jest.fn().mockResolvedValue([persistedRow({ catsOnUtxo: [0, 42, 100], headlineCatNumber: 0 })]),
        });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock({ catsAtOutput: [0, 42, 100] }), createElectrsMock());
        const result = await service.create(validDto({ cats: [0, 42, 100], headlineCatNumber: 0 }));
        expect(result.cats).toEqual([0, 42, 100]);
    });
    it('throws persist-race when readback returns nothing (concurrent prune)', async () => {
        const drizzle = createDrizzleMock({ limit: jest.fn().mockResolvedValue([]) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock());
        await expect(service.create(validDto())).rejects.toMatchObject({
            response: expect.objectContaining({ code: 'persist-race' }),
        });
    });
});
describe('BidsService.findByOutpoint (seller view — bids on my cat)', () => {
    it('returns all bids for the UTXO', async () => {
        const rows = [
            persistedRow({ id: 'a', bidSats: 30_000, buyerOrdinalsAddress: 'bc1p-a' }),
            persistedRow({ id: 'b', bidSats: 21_000, buyerOrdinalsAddress: 'bc1p-b' }),
        ];
        const drizzle = createDrizzleMock({ orderBy: jest.fn().mockResolvedValue(rows) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock());
        const result = await service.findByOutpoint('mainnet', REAL_TXID, 0);
        expect(result).toHaveLength(2);
        expect(result[0].bidSats).toBe(30_000);
        expect(result[1].bidSats).toBe(21_000);
    });
    it('returns empty array when no bids exist on the UTXO', async () => {
        const drizzle = createDrizzleMock({ orderBy: jest.fn().mockResolvedValue([]) });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock());
        expect(await service.findByOutpoint('mainnet', OTHER_TXID, 0)).toEqual([]);
    });
});
describe('BidsService.findPaginated — bounds', () => {
    const service = () => new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
    it('rejects itemsPerPage=0', async () => {
        await expect(service().findPaginated(0, 1)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('rejects itemsPerPage>100', async () => {
        await expect(service().findPaginated(101, 1)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('rejects currentPage=0', async () => {
        await expect(service().findPaginated(25, 0)).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
});
describe('BidsService.deleteByOutpointAndBuyer', () => {
    it('runs the delete query with the unique-key fields', async () => {
        const where = jest.fn().mockResolvedValue(undefined);
        const drizzle = createDrizzleMock({
            delete: jest.fn().mockReturnValue({ where }),
        });
        const service = new bids_service_1.BidsService(drizzle, createOrdMock(), createElectrsMock());
        await service.deleteByOutpointAndBuyer('mainnet', REAL_TXID, 0, BUYER_ORD_ADDR);
        expect(drizzle.db.delete).toHaveBeenCalled();
        expect(where).toHaveBeenCalled();
    });
});
function paginatedDrizzle(rows, total) {
    const offset = jest.fn().mockResolvedValue(rows);
    const rowsChain = {
        from: jest.fn(() => rowsChain),
        orderBy: jest.fn(() => rowsChain),
        limit: jest.fn(() => rowsChain),
        offset,
    };
    const countChain = { from: jest.fn().mockResolvedValue([{ total }]) };
    return { db: { select: jest.fn((arg) => (arg === undefined ? rowsChain : countChain)) }, offset };
}
describe('BidsService.network', () => {
    it('exposes the backend deployment network (mainnet by default in tests)', () => {
        const service = new bids_service_1.BidsService(createDrizzleMock(), createOrdMock(), createElectrsMock());
        expect(service.network).toBe('mainnet');
    });
});
describe('BidsService.findPaginated — happy path', () => {
    it('maps rows to DTOs, passes through total, and applies the (page-1)*perPage offset', async () => {
        const rows = [
            persistedRow({ id: 'p1', bidSats: 25_000 }),
            persistedRow({ id: 'p2', bidSats: 21_000 }),
        ];
        const mock = paginatedDrizzle(rows, 42);
        const service = new bids_service_1.BidsService(mock, createOrdMock(), createElectrsMock());
        const res = await service.findPaginated(25, 2);
        expect(res).toMatchObject({ total: 42, currentPage: 2, itemsPerPage: 25 });
        expect(res.items).toHaveLength(2);
        expect(res.items[0]).toMatchObject({ id: 'p1', bidSats: 25_000, cats: [42] });
        expect(res.items[1]).toMatchObject({ id: 'p2', bidSats: 21_000 });
        expect(mock.offset).toHaveBeenCalledWith(25);
    });
    it('offset is 0 on page 1', async () => {
        const mock = paginatedDrizzle([persistedRow()], 1);
        const service = new bids_service_1.BidsService(mock, createOrdMock(), createElectrsMock());
        await service.findPaginated(10, 1);
        expect(mock.offset).toHaveBeenCalledWith(0);
    });
});
//# sourceMappingURL=bids.service.spec.js.map