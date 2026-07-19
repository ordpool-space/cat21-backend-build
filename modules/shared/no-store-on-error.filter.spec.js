"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const no_store_on_error_filter_1 = require("./no-store-on-error.filter");
function createHostAndAdapter() {
    const response = {};
    const host = {
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => ({}),
            getNext: () => ({}),
        }),
    };
    const setHeader = jest.fn();
    const reply = jest.fn();
    const adapterHost = { httpAdapter: { setHeader, reply } };
    return { host, adapterHost, setHeader, reply, response };
}
describe('NoStoreOnErrorFilter', () => {
    it('attaches Cache-Control: no-store on a ThrottlerException (429 from a guard, before the controller runs)', () => {
        const { host, adapterHost, setHeader, reply, response } = createHostAndAdapter();
        const filter = new no_store_on_error_filter_1.NoStoreOnErrorFilter(adapterHost);
        const err = new throttler_1.ThrottlerException('Too Many Requests');
        filter.catch(err, host);
        expect(setHeader).toHaveBeenCalledWith(response, 'Cache-Control', 'no-store');
        expect(reply).toHaveBeenCalledWith(response, expect.anything(), 429);
    });
    it('attaches Cache-Control: no-store on a BadRequestException (400 from validation)', () => {
        const { host, adapterHost, setHeader, reply, response } = createHostAndAdapter();
        const filter = new no_store_on_error_filter_1.NoStoreOnErrorFilter(adapterHost);
        const err = new common_1.BadRequestException({ code: 'network-mismatch', detail: 'wrong network' });
        filter.catch(err, host);
        expect(setHeader).toHaveBeenCalledWith(response, 'Cache-Control', 'no-store');
        expect(reply).toHaveBeenCalledWith(response, expect.objectContaining({ code: 'network-mismatch' }), 400);
    });
    it('attaches Cache-Control: no-store on a generic HttpException with a custom status', () => {
        const { host, adapterHost, setHeader, reply, response } = createHostAndAdapter();
        const filter = new no_store_on_error_filter_1.NoStoreOnErrorFilter(adapterHost);
        filter.catch(new common_1.HttpException('teapot', 418), host);
        expect(setHeader).toHaveBeenCalledWith(response, 'Cache-Control', 'no-store');
        expect(reply).toHaveBeenCalledWith(response, 'teapot', 418);
    });
    it('falls back to 500 + a generic body on an unexpected non-HttpException', () => {
        const { host, adapterHost, setHeader, reply, response } = createHostAndAdapter();
        const filter = new no_store_on_error_filter_1.NoStoreOnErrorFilter(adapterHost);
        filter.catch(new Error('boom'), host);
        expect(setHeader).toHaveBeenCalledWith(response, 'Cache-Control', 'no-store');
        expect(reply).toHaveBeenCalledWith(response, expect.objectContaining({ statusCode: 500 }), 500);
    });
});
//# sourceMappingURL=no-store-on-error.filter.spec.js.map