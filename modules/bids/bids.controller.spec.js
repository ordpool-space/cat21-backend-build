"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const bids_controller_1 = require("./bids.controller");
describe('BidsController (unit)', () => {
    const CAT_TXID = 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df';
    const BUYER = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9';
    function make(overrides = {}) {
        const svc = {
            network: 'mainnet',
            findByOutpoint: jest.fn(),
            findPaginated: jest.fn(),
            deleteByOutpointAndBuyer: jest.fn(),
            ...overrides,
        };
        const controller = new bids_controller_1.BidsController(svc);
        const reply = { header: jest.fn() };
        return { controller, svc, reply };
    }
    describe('findByOutpoint (seller view)', () => {
        it('returns the service rows and sets the 60s single-bid Cache-Control', async () => {
            const rows = [{ id: 'b1', bidSats: 21_000 }];
            const { controller, svc, reply } = make({ findByOutpoint: jest.fn().mockResolvedValue(rows) });
            const out = await controller.findByOutpoint(CAT_TXID, 0, reply);
            expect(out).toBe(rows);
            expect(svc.findByOutpoint).toHaveBeenCalledWith('mainnet', CAT_TXID, 0);
            expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60, s-maxage=60');
        });
    });
    describe('findPaginated (orderbook browse)', () => {
        it('delegates to the service and returns its paginated result (no Cache-Control set)', async () => {
            const page = { total: 3, currentPage: 1, itemsPerPage: 25, items: [] };
            const { controller, svc } = make({ findPaginated: jest.fn().mockResolvedValue(page) });
            const out = await controller.findPaginated(25, 1);
            expect(out).toBe(page);
            expect(svc.findPaginated).toHaveBeenCalledWith(25, 1);
        });
    });
    describe('delete (buyer cancels)', () => {
        it('rejects session-address-mismatch and does NOT delete when the session address != ?buyer=', async () => {
            const { controller, svc, reply } = make();
            let thrown;
            try {
                await controller.delete(CAT_TXID, 0, BUYER, 'bc1p-a-different-session-address', reply);
            }
            catch (e) {
                thrown = e;
            }
            expect(thrown).toBeInstanceOf(common_1.UnauthorizedException);
            expect(thrown.getResponse()).toMatchObject({ code: 'session-address-mismatch' });
            expect(svc.deleteByOutpointAndBuyer).not.toHaveBeenCalled();
        });
        it('deletes with the unique-key fields and sets no-store when the session address matches ?buyer=', async () => {
            const { controller, svc, reply } = make();
            await controller.delete(CAT_TXID, 0, BUYER, BUYER, reply);
            expect(svc.deleteByOutpointAndBuyer).toHaveBeenCalledWith('mainnet', CAT_TXID, 0, BUYER);
            expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
        });
    });
});
//# sourceMappingURL=bids.controller.spec.js.map