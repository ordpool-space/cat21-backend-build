"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electrs_client_service_1 = require("./electrs-client.service");
describe('ElectrsClientService', () => {
    const TXID = 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df';
    const BASE_URL = 'https://api.example.test/api';
    let originalFetch;
    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });
    function makeClient() {
        const cfg = { getOrThrow: jest.fn().mockReturnValue(BASE_URL) };
        return new electrs_client_service_1.ElectrsClientService(cfg);
    }
    function stubFetch(status, body, opts = {}) {
        globalThis.fetch = jest.fn().mockImplementation((url) => {
            if (opts.throw)
                return Promise.reject(opts.throw);
            const response = {
                status,
                ok: status >= 200 && status < 300,
                json: () => opts.badJson ? Promise.reject(new SyntaxError('bad json')) : Promise.resolve(body),
            };
            return Promise.resolve(response);
        });
    }
    function stubFetchRoutes(routes) {
        globalThis.fetch = jest.fn().mockImplementation((url) => {
            const isExistenceProbe = /\/tx\/[0-9a-f]+$/i.test(url);
            const r = isExistenceProbe ? routes.tx : routes.outspend;
            return Promise.resolve({
                status: r.status,
                ok: r.status >= 200 && r.status < 300,
                json: () => Promise.resolve(r.body ?? null),
            });
        });
    }
    it('returns `spent` when electrs responds {spent: true}', async () => {
        stubFetch(200, { spent: true });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('spent');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(true);
    });
    it('returns `unspent` when electrs responds {spent: false}', async () => {
        stubFetch(200, { spent: false });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unspent');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('reports a phantom outpoint `spent`: /outspend says {spent:false} but /tx 404s', async () => {
        stubFetchRoutes({ outspend: { status: 200, body: { spent: false } }, tx: { status: 404 } });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('spent');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(true);
    });
    it('reports a real unspent UTXO `unspent`: /outspend {spent:false} + /tx 200', async () => {
        stubFetchRoutes({ outspend: { status: 200, body: { spent: false } }, tx: { status: 200 } });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unspent');
    });
    it('returns `unknown` when /outspend {spent:false} but the /tx probe 5xxs (fail-safe)', async () => {
        stubFetchRoutes({ outspend: { status: 200, body: { spent: false } }, tx: { status: 503 } });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
    });
    it('collapses a 404 into `spent` (phantom txid → unbroadcastable → prune)', async () => {
        stubFetch(404, null);
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('spent');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(true);
    });
    it('returns `unknown` on a 500 (fail-safe: transient error must not cascade)', async () => {
        stubFetch(500, null);
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('returns `unknown` on a network error (fetch rejects)', async () => {
        stubFetch(0, null, { throw: new Error('ENOTFOUND') });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('returns `unknown` on malformed JSON', async () => {
        stubFetch(200, null, { badJson: true });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('returns `unknown` when the response body is missing the `spent` field', async () => {
        stubFetch(200, { status: 'confirmed' });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('returns `unknown` when the response body\'s `spent` is not a boolean', async () => {
        stubFetch(200, { spent: 'yes' });
        const client = makeClient();
        expect(await client.getOutpointStatus(TXID, 0)).toBe('unknown');
        expect(await client.isOutpointSpent(TXID, 0)).toBe(false);
    });
    it('builds the correct URL (/tx/{txid}/outspend/{vout})', async () => {
        const fetchSpy = jest.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ spent: false }),
        });
        globalThis.fetch = fetchSpy;
        const client = makeClient();
        await client.isOutpointSpent(TXID, 3);
        expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/tx/${TXID}/outspend/3`, expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }));
    });
});
//# sourceMappingURL=electrs-client.service.spec.js.map