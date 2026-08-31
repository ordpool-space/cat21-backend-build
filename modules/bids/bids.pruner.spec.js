"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bids_pruner_1 = require("./bids.pruner");
let mockFromPSBT;
jest.mock('@scure/btc-signer', () => ({
    Transaction: {
        fromPSBT: (...args) => mockFromPSBT(...args),
    },
}));
const REAL_TXID = 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df';
const BUYER_A = 'bc1p-buyer-a';
const BUYER_B = 'bc1p-buyer-b';
const FUND_TXID_LIVE = 'aa'.repeat(32);
const FUND_TXID_SPENT = 'bb'.repeat(32);
const row = (over = {}) => ({
    id: 'uuid-x',
    network: 'mainnet',
    catTxid: REAL_TXID,
    catVout: 0,
    catsOnUtxo: [42],
    headlineCatNumber: 42,
    bidSats: 21_000,
    buyerOrdinalsAddress: BUYER_A,
    buyerPaymentAddress: 'bc1q-pay',
    sellerPaymentAddress: 'bc1q-seller-pay',
    psbtBase64: 'AAECAw==',
    createdAt: new Date(),
    ...over,
});
function drizzleWithRows(rows) {
    return {
        db: {
            select: jest.fn().mockReturnValue({ from: jest.fn().mockResolvedValue(rows) }),
        },
    };
}
function stubPsbt(buyerFundingTxids) {
    mockFromPSBT.mockReturnValue({
        inputsLength: buyerFundingTxids.length + 1,
        getInput(i) {
            if (i === 0)
                return { txid: new Uint8Array(32), index: 0 };
            const txid = buyerFundingTxids[i - 1];
            const bytes = new Uint8Array(txid.match(/../g).map((h) => parseInt(h, 16)));
            return { txid: bytes, index: 0 };
        },
    });
}
function createElectrsMock(status = {}) {
    const resolve = (txid) => status[txid] ?? 'unspent';
    return {
        getOutpointStatus: jest.fn().mockImplementation((txid, _vout) => {
            return Promise.resolve(resolve(txid));
        }),
        isOutpointSpent: jest.fn().mockImplementation((txid, _vout) => {
            return Promise.resolve(resolve(txid) === 'spent');
        }),
    };
}
describe('BidsPruner.runPrune — seller-side (cat UTXO drift)', () => {
    beforeEach(() => {
        mockFromPSBT = jest.fn();
        stubPsbt([FUND_TXID_LIVE]);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('is a no-op when the table is empty', async () => {
        const drizzle = drizzleWithRows([]);
        const ord = { getCatsAtOutput: jest.fn() };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(ord.getCatsAtOutput).not.toHaveBeenCalled();
        expect(electrs.getOutpointStatus).not.toHaveBeenCalled();
        expect(bidsSvc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
    });
    it('keeps a bid whose UTXO still carries the signed cats bundle AND all buyer inputs are live', async () => {
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
        expect(ord.getCatsAtOutput).toHaveBeenCalledTimes(1);
        expect(electrs.getOutpointStatus).toHaveBeenCalledTimes(1);
    });
    it('drops on seller-side when the UTXO no longer holds cats (skips buyer-side check)', async () => {
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue(null) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledWith('mainnet', REAL_TXID, 0, BUYER_A);
        expect(electrs.getOutpointStatus).not.toHaveBeenCalled();
    });
    it('drops on seller-side when the live cats bundle differs from the signed one', async () => {
        const drizzle = drizzleWithRows([row({ catsOnUtxo: [42] })]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42, 99]) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledTimes(1);
        expect(electrs.getOutpointStatus).not.toHaveBeenCalled();
    });
    it('does NOT drop a bid when the ord lookup errors (transient — retry next tick)', async () => {
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockRejectedValue(new Error('ord flake')) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
    });
});
describe('BidsPruner.runPrune — buyer-side (funding UTXO liveness)', () => {
    beforeEach(() => {
        mockFromPSBT = jest.fn();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('drops a bid whose buyer funding UTXO has been spent elsewhere', async () => {
        stubPsbt([FUND_TXID_SPENT]);
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock({ [FUND_TXID_SPENT]: 'spent' });
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledWith('mainnet', REAL_TXID, 0, BUYER_A);
    });
    it('drops a bid where ANY of multiple buyer funding UTXOs is spent (all-live gate)', async () => {
        stubPsbt([FUND_TXID_LIVE, FUND_TXID_SPENT, FUND_TXID_LIVE]);
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock({ [FUND_TXID_SPENT]: 'spent' });
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledTimes(1);
    });
    it('keeps a bid when all buyer funding UTXOs are still live', async () => {
        stubPsbt([FUND_TXID_LIVE, FUND_TXID_LIVE]);
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
    });
    it('drops a bid whose PSBT no longer parses (corrupt row)', async () => {
        mockFromPSBT.mockImplementation(() => { throw new Error('PSBT magic bytes wrong'); });
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledTimes(1);
    });
    it('electrs flake keeps the bid (fail-safe: unknown → live, no destructive drop on transient error)', async () => {
        stubPsbt([FUND_TXID_LIVE]);
        const drizzle = drizzleWithRows([row()]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue([42]) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
    });
});
describe('BidsPruner.runPrune — batching + re-entrancy', () => {
    beforeEach(() => {
        mockFromPSBT = jest.fn();
        stubPsbt([FUND_TXID_LIVE]);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('shares ONE ord lookup across multiple bids on the same UTXO', async () => {
        const drizzle = drizzleWithRows([
            row({ id: 'a', buyerOrdinalsAddress: BUYER_A }),
            row({ id: 'b', buyerOrdinalsAddress: BUYER_B }),
        ]);
        const ord = { getCatsAtOutput: jest.fn().mockResolvedValue(null) };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(ord.getCatsAtOutput).toHaveBeenCalledTimes(1);
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledTimes(2);
    });
    it('processes multiple UTXOs independently — a stale one is dropped without hurting the live one', async () => {
        const OTHER_TXID = 'cc'.repeat(32);
        const drizzle = drizzleWithRows([
            row({ id: 'a', catTxid: REAL_TXID }),
            row({ id: 'b', catTxid: OTHER_TXID }),
        ]);
        const ord = {
            getCatsAtOutput: jest.fn()
                .mockResolvedValueOnce([42])
                .mockResolvedValueOnce(null),
        };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn().mockResolvedValue(undefined) };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        await pruner.runPrune();
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledTimes(1);
        expect(bidsSvc.deleteByOutpointAndBuyer).toHaveBeenCalledWith('mainnet', OTHER_TXID, 0, BUYER_A);
    });
    it('is re-entrancy safe — a second runPrune call while the first is still active is a no-op', async () => {
        let releaseFirst;
        const firstFromPromise = new Promise((resolve) => { releaseFirst = resolve; });
        const fromMock = jest.fn()
            .mockReturnValueOnce(firstFromPromise)
            .mockReturnValueOnce(Promise.resolve([]));
        const drizzle = { db: { select: jest.fn().mockReturnValue({ from: fromMock }) } };
        const ord = { getCatsAtOutput: jest.fn() };
        const electrs = createElectrsMock();
        const bidsSvc = { deleteByOutpointAndBuyer: jest.fn() };
        const pruner = new bids_pruner_1.BidsPruner(drizzle, ord, electrs, bidsSvc);
        const inflight = pruner.runPrune();
        await pruner.runPrune();
        expect(fromMock).toHaveBeenCalledTimes(1);
        releaseFirst([]);
        await inflight;
        await pruner.runPrune();
        expect(fromMock).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=bids.pruner.spec.js.map