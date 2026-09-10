"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const listings_controller_1 = require("./listings.controller");
describe('ListingsController (unit)', () => {
    function make(overrides = {}) {
        const svc = {
            findByCatNumber: jest.fn(),
            findPaginated: jest.fn(),
            deleteByCatNumberIfOwnedBy: jest.fn(),
            ...overrides,
        };
        const controller = new listings_controller_1.ListingsController(svc);
        const reply = { header: jest.fn() };
        return { controller, svc, reply };
    }
    describe('findByCatNumber', () => {
        it('returns the listing and sets the 60s single-listing Cache-Control on a hit', async () => {
            const listing = { catNumber: 42, askSats: 21_000 };
            const { controller, svc, reply } = make({ findByCatNumber: jest.fn().mockResolvedValue(listing) });
            const out = await controller.findByCatNumber(42, reply);
            expect(out).toBe(listing);
            expect(svc.findByCatNumber).toHaveBeenCalledWith(42);
            expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60, s-maxage=60');
        });
        it('throws NotFoundException with no-store (cache-poisoning guard) when there is no listing', async () => {
            const { controller, reply } = make({ findByCatNumber: jest.fn().mockResolvedValue(null) });
            let thrown;
            try {
                await controller.findByCatNumber(999, reply);
            }
            catch (e) {
                thrown = e;
            }
            expect(thrown).toBeInstanceOf(common_1.NotFoundException);
            expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
        });
    });
    describe('findPaginated (orderbook browse)', () => {
        it('delegates to the service and returns its paginated result', async () => {
            const page = { total: 5, currentPage: 2, itemsPerPage: 25, items: [] };
            const { controller, svc } = make({ findPaginated: jest.fn().mockResolvedValue(page) });
            const out = await controller.findPaginated(25, 2);
            expect(out).toBe(page);
            expect(svc.findPaginated).toHaveBeenCalledWith(25, 2);
        });
    });
    describe('delete (seller unlists)', () => {
        it('runs the ownership-scoped delete with the session address and sets no-store', async () => {
            const { controller, svc, reply } = make({ deleteByCatNumberIfOwnedBy: jest.fn().mockResolvedValue(true) });
            await controller.delete(42, 'bc1p-session-owner', reply);
            expect(svc.deleteByCatNumberIfOwnedBy).toHaveBeenCalledWith(42, 'bc1p-session-owner');
            expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
        });
    });
});
//# sourceMappingURL=listings.controller.spec.js.map