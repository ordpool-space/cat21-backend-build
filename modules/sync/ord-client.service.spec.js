"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    describe('getCatsAtOutput', () => {
        it('maps cat21-ord `/output` inscription-id strings to cat numbers', async () => {
            jest.spyOn(global, 'fetch').mockImplementation((input) => {
                const url = String(input);
                if (url.includes('/output/')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ cats: ['bbb222i0', 'aaa111i0'] }),
                    });
                }
                if (url.endsWith('/cat/aaa111i0')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ id: 'aaa111i0', number: 7 }),
                    });
                }
                if (url.endsWith('/cat/bbb222i0')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ id: 'bbb222i0', number: 42 }),
                    });
                }
                return Promise.reject(new Error(`unexpected url ${url}`));
            });
            expect(await service.getCatsAtOutput('deadbeef', 0)).toEqual([7, 42]);
        });
        it('returns [] when the output carries no cats', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ cats: [] }),
            });
            expect(await service.getCatsAtOutput('deadbeef', 0)).toEqual([]);
        });
        it('returns null when ord 404s the outpoint', async () => {
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            expect(await service.getCatsAtOutput('deadbeef', 0)).toBeNull();
        });
    });
});
//# sourceMappingURL=ord-client.service.spec.js.map