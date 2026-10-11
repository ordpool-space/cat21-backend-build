"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("ordpool-sdk/testing");
const ord_client_service_1 = require("./ord-client.service");
const BASE_URL = 'https://ord.test';
function createService() {
    const configService = {
        getOrThrow: jest.fn().mockReturnValue(BASE_URL),
    };
    return new ord_client_service_1.OrdClientService(configService);
}
describe('OrdClientService', () => {
    let service;
    beforeEach(() => {
        service = createService();
        jest.restoreAllMocks();
    });
    describe('getCat', () => {
        it('should return cat detail for a valid cat number', async () => {
            const mockCat = {
                id: 'abc123i0',
                number: 0,
                address: 'bc1p...',
                sat: 596964966600565,
                fee: 40834,
                height: 824205,
                timestamp: 1704315886,
                value: 546,
                weight: 705,
            };
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockCat),
            });
            const result = await service.getCat(0);
            expect(result).toEqual(mockCat);
            expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/cat/0`, expect.objectContaining({
                headers: { Accept: 'application/json' },
            }));
        });
        it('should return null for 404', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 404,
            });
            const result = await service.getCat(999999);
            expect(result).toBeNull();
        });
        it('should throw on non-404 errors', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            await expect(service.getCat(0)).rejects.toThrow('ord API error: 500');
        });
    });
    describe('getLatestCatNumber', () => {
        it('should return the number of the newest cat', async () => {
            const fetchSpy = jest.spyOn(global, 'fetch');
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ ids: ['abc123i0', 'def456i0'] }),
            });
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'abc123i0', number: 63731 }),
            });
            const result = await service.getLatestCatNumber();
            expect(result).toBe(63731);
        });
        it('should return -1 when no cats exist', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ ids: [] }),
            });
            const result = await service.getLatestCatNumber();
            expect(result).toBe(-1);
        });
        it('should throw on 404', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            await expect(service.getLatestCatNumber()).rejects.toThrow('ord API error: 404');
        });
    });
});
const TXID_A = 'a'.repeat(64);
const TXID_B = 'b'.repeat(64);
function routeFetch(routes) {
    jest.spyOn(global, 'fetch').mockImplementation((input) => {
        const url = String(input);
        for (const [needle, r] of routes) {
            if (url.includes(needle)) {
                const status = r.status ?? 200;
                return Promise.resolve({
                    ok: r.ok ?? (status >= 200 && status < 300),
                    status,
                    statusText: 'x',
                    json: () => Promise.resolve(r.body ?? null),
                });
            }
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
    });
}
describe('OrdClientService.getCatCurrentLocation', () => {
    beforeEach(() => jest.restoreAllMocks());
    it('resolves the current outpoint + owning address via /cat then /inscription', async () => {
        routeFetch([
            ['/cat/42', { body: { id: 'insc-42i0', number: 42 } }],
            ['/inscription/insc-42i0', { body: { satpoint: `${TXID_A}:2:0`, address: 'bc1p-owner' } }],
        ]);
        const res = await createService().getCatCurrentLocation(42);
        expect(res).toEqual({ txid: TXID_A, vout: 2, ordinalsAddress: 'bc1p-owner' });
    });
    it('returns null when the cat does not exist (getCat 404)', async () => {
        routeFetch([['/cat/999', { status: 404, ok: false }]]);
        expect(await createService().getCatCurrentLocation(999)).toBeNull();
    });
    it('returns null when the inscription lookup 404s', async () => {
        routeFetch([
            ['/cat/42', { body: { id: 'insc-42i0', number: 42 } }],
            ['/inscription/insc-42i0', { status: 404, ok: false }],
        ]);
        expect(await createService().getCatCurrentLocation(42)).toBeNull();
    });
    it('returns null when the satpoint has no owning address (cat at OP_RETURN / fee)', async () => {
        routeFetch([
            ['/cat/42', { body: { id: 'insc-42i0', number: 42 } }],
            ['/inscription/insc-42i0', { body: { satpoint: `${TXID_A}:0:0`, address: null } }],
        ]);
        expect(await createService().getCatCurrentLocation(42)).toBeNull();
    });
    it('returns null when the satpoint is malformed', async () => {
        routeFetch([
            ['/cat/42', { body: { id: 'insc-42i0', number: 42 } }],
            ['/inscription/insc-42i0', { body: { satpoint: 'not-a-satpoint', address: 'bc1p-owner' } }],
        ]);
        expect(await createService().getCatCurrentLocation(42)).toBeNull();
    });
});
const [CAT_TXID, CAT_VOUT_RAW] = testing_1.cat21OrdOutputWithCatFixture.outpoint.split(':');
const CAT_VOUT = Number(CAT_VOUT_RAW);
const CAT_ID = testing_1.cat21OrdOutputWithCatFixture.cats[0];
function answer(status, body) {
    const isText = typeof body === 'string';
    return new Response(isText ? body : JSON.stringify(body), {
        status,
        headers: { 'content-type': isText ? 'text/plain' : 'application/json' },
    });
}
function fakeCat21Ord(routes) {
    return jest.spyOn(global, 'fetch').mockImplementation((input) => {
        const url = String(input);
        const route = routes[url];
        return route ? Promise.resolve(route()) : Promise.reject(new Error(`unexpected url ${url}`));
    });
}
describe('OrdClientService.getCatsAtOutput (the SDK getCatsAtOutput over cat21-ord)', () => {
    beforeEach(() => jest.restoreAllMocks());
    it('resolves the inscription ids /output lists through /inscription to cat numbers', async () => {
        const fetchSpy = fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(200, testing_1.cat21OrdOutputWithCatFixture),
            [`${BASE_URL}/inscription/${CAT_ID}`]: () => answer(200, testing_1.cat21OrdCatInscriptionFixture),
        });
        expect(await createService().getCatsAtOutput(CAT_TXID, CAT_VOUT)).toEqual([testing_1.cat21OrdCatInscriptionFixture.number]);
        expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
            `${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`,
            `${BASE_URL}/inscription/${CAT_ID}`,
        ]);
    });
    it('asks for JSON and bounds every request with an abort signal', async () => {
        const fetchSpy = fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(200, testing_1.cat21OrdOutputWithCatFixture),
            [`${BASE_URL}/inscription/${CAT_ID}`]: () => answer(200, testing_1.cat21OrdCatInscriptionFixture),
        });
        await createService().getCatsAtOutput(CAT_TXID, CAT_VOUT);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        for (const [, init] of fetchSpy.mock.calls) {
            expect(init?.headers).toEqual({ Accept: 'application/json' });
            expect(init?.signal).toBeInstanceOf(AbortSignal);
        }
    });
    it('returns [] for an output that carries no cat', async () => {
        const [txid, vout] = testing_1.cat21OrdOutputWithoutCatsFixture.outpoint.split(':');
        fakeCat21Ord({
            [`${BASE_URL}/output/${txid}:${vout}`]: () => answer(200, testing_1.cat21OrdOutputWithoutCatsFixture),
        });
        expect(await createService().getCatsAtOutput(txid, Number(vout))).toEqual([]);
    });
    it('returns null when cat21-ord 404s the outpoint', async () => {
        fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(404, testing_1.cat21OrdOutputNotFoundBody),
        });
        expect(await createService().getCatsAtOutput(CAT_TXID, CAT_VOUT)).toBeNull();
    });
    it('throws on any other error status, so a caller reads it as a failed lookup', async () => {
        fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(500, 'internal error'),
        });
        await expect(createService().getCatsAtOutput(CAT_TXID, CAT_VOUT)).rejects.toThrow('answered 500');
    });
    it('throws when an entry is a number instead of an inscription id', async () => {
        fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(200, { ...testing_1.cat21OrdOutputWithCatFixture, cats: [42] }),
        });
        await expect(createService().getCatsAtOutput(CAT_TXID, CAT_VOUT)).rejects.toThrow('not an inscription id');
    });
    it('throws when the answer has no `cats` list', async () => {
        const { cats: _cats, ...withoutCats } = testing_1.cat21OrdOutputWithCatFixture;
        fakeCat21Ord({
            [`${BASE_URL}/output/${CAT_TXID}:${CAT_VOUT}`]: () => answer(200, withoutCats),
        });
        await expect(createService().getCatsAtOutput(CAT_TXID, CAT_VOUT)).rejects.toThrow('has no cats list');
    });
});
describe('parseSatpoint', () => {
    const { parseSatpoint } = jest.requireActual('./ord-client.service');
    it('parses TXID:VOUT:OFFSET, lowercasing the txid', () => {
        expect(parseSatpoint(`${TXID_A.toUpperCase()}:3:100`)).toEqual({ txid: TXID_A, vout: 3 });
    });
    it.each([
        ['too few parts', `${TXID_A}:3`],
        ['too many parts', `${TXID_A}:3:0:0`],
        ['non-hex txid', `zz${'a'.repeat(62)}:0:0`],
        ['short txid', `abc:0:0`],
        ['negative vout', `${TXID_A}:-1:0`],
        ['non-numeric vout', `${TXID_A}:x:0`],
    ])('returns null for %s', (_label, bad) => {
        expect(parseSatpoint(bad)).toBeNull();
    });
});
//# sourceMappingURL=ord-client.service.spec.js.map