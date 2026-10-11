"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const testing_1 = require("@nestjs/testing");
const throttler_1 = require("@nestjs/throttler");
const no_store_on_error_filter_1 = require("../shared/no-store-on-error.filter");
const cat21_session_guard_1 = require("../shared/cat21-session.guard");
const listings_controller_1 = require("./listings.controller");
const listings_service_1 = require("./listings.service");
describe('ListingsController — error responses carry Cache-Control: no-store (integration)', () => {
    let app;
    let mockCreate;
    beforeEach(async () => {
        mockCreate = jest.fn();
        const module = await testing_1.Test.createTestingModule({
            imports: [
                throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
            ],
            controllers: [listings_controller_1.ListingsController],
            providers: [
                { provide: listings_service_1.ListingsService, useValue: { create: mockCreate, findByCatNumber: jest.fn(), findPaginated: jest.fn(), deleteByCatNumber: jest.fn(), deleteByCatNumberIfOwnedBy: jest.fn() } },
            ],
        })
            .overrideGuard(cat21_session_guard_1.Cat21SessionGuard)
            .useValue({
            canActivate: (ctx) => {
                const req = ctx.switchToHttp().getRequest();
                req.cat21SessionAddress = 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9';
                return true;
            },
        })
            .compile();
        app = module.createNestApplication(new platform_fastify_1.FastifyAdapter({ logger: false }));
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new no_store_on_error_filter_1.NoStoreOnErrorFilter(app.get(core_1.HttpAdapterHost)));
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });
    afterEach(async () => {
        await app?.close();
    });
    const validDtoBody = () => ({
        catNumber: 42,
        cats: [42],
        network: 'mainnet',
        askSats: 21_000,
        payTo: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm',
        catTxid: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df',
        catVout: 0,
        ordinalsAddress: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
    });
    it('400 from ValidationPipe (missing required field) carries no-store', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/listings',
            payload: { catNumber: 42 },
        });
        expect(res.statusCode).toBe(400);
        expect(res.headers['cache-control']).toBe('no-store');
    });
    it('400 from a service-thrown BadRequestException carries no-store', async () => {
        const { BadRequestException } = await Promise.resolve().then(() => require('@nestjs/common'));
        mockCreate.mockRejectedValue(new BadRequestException({ code: 'network-mismatch', detail: 'wrong network' }));
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/listings',
            payload: validDtoBody(),
        });
        expect(res.statusCode).toBe(400);
        expect(res.headers['cache-control']).toBe('no-store');
        expect(JSON.parse(res.body)).toMatchObject({ code: 'network-mismatch' });
    });
    it('429 from ThrottlerGuard (6th request within window) carries no-store', async () => {
        mockCreate.mockResolvedValue({ id: 'x', catNumber: 42, cats: [42], network: 'mainnet', askSats: 21_000, payTo: '', catTxid: '', catVout: 0, ordinalsAddress: '', signedAt: 0, signature: '', createdAt: '' });
        for (let i = 0; i < 5; i++) {
            const ok = await app.inject({ method: 'POST', url: '/api/v1/listings', payload: validDtoBody() });
            expect(ok.statusCode).toBe(201);
            expect(ok.headers['cache-control']).toBe('no-store');
        }
        const throttled = await app.inject({ method: 'POST', url: '/api/v1/listings', payload: validDtoBody() });
        expect(throttled.statusCode).toBe(429);
        expect(throttled.headers['cache-control']).toBe('no-store');
    });
    it('500 from an unexpected non-HttpException carries no-store', async () => {
        mockCreate.mockRejectedValue(new Error('boom'));
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/listings',
            payload: validDtoBody(),
        });
        expect(res.statusCode).toBe(500);
        expect(res.headers['cache-control']).toBe('no-store');
    });
});
describe('GET /api/v1/listings/cat/:catNumber over HTTP (integration)', () => {
    let app;
    let findByCatNumber;
    beforeEach(async () => {
        findByCatNumber = jest.fn();
        const module = await testing_1.Test.createTestingModule({
            imports: [throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])],
            controllers: [listings_controller_1.ListingsController],
            providers: [{ provide: listings_service_1.ListingsService, useValue: { findByCatNumber } }],
        }).compile();
        app = module.createNestApplication(new platform_fastify_1.FastifyAdapter({ logger: false }));
        app.useGlobalFilters(new no_store_on_error_filter_1.NoStoreOnErrorFilter(app.get(core_1.HttpAdapterHost)));
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });
    afterEach(async () => {
        await app?.close();
    });
    it('answers an unlisted cat with 200 and a JSON null body, never cached', async () => {
        findByCatNumber.mockResolvedValue(null);
        const res = await app.inject({ method: 'GET', url: '/api/v1/listings/cat/999' });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/^application\/json/);
        expect(res.body).toBe('null');
        expect(res.headers['cache-control']).toBe('no-store');
        expect(findByCatNumber).toHaveBeenCalledWith(999);
    });
    it('answers a listed cat with 200 and the listing, cached for 60 s', async () => {
        const listing = {
            id: '7f3c2a10-1b2c-4d5e-8f90-123456789abc',
            catNumber: 42,
            cats: [42],
            network: 'mainnet',
            askSats: 21_000,
            payTo: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm',
            catTxid: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df',
            catVout: 0,
            ordinalsAddress: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
            signedAt: 1_760_000_000,
            signature: 'AUBsignature',
            createdAt: '2026-10-11T00:00:00.000Z',
        };
        findByCatNumber.mockResolvedValue(listing);
        const res = await app.inject({ method: 'GET', url: '/api/v1/listings/cat/42' });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual(listing);
        expect(res.headers['cache-control']).toBe('public, max-age=60, s-maxage=60');
    });
});
//# sourceMappingURL=listings.controller.integration.spec.js.map