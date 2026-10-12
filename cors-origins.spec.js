"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors_origins_1 = require("./cors-origins");
describe('corsAllowedOrigins', () => {
    it('with no extra origins answers exactly the production and dev-server origins', () => {
        expect((0, cors_origins_1.corsAllowedOrigins)(undefined)).toEqual([
            'https://cat21.space',
            'https://ordpool.space',
            'http://localhost:4200',
            'http://localhost:4221',
        ]);
        expect((0, cors_origins_1.corsAllowedOrigins)('')).toEqual([...cors_origins_1.DEFAULT_CORS_ORIGINS]);
    });
    it('adds each comma-separated extra origin, trimmed', () => {
        expect((0, cors_origins_1.corsAllowedOrigins)(' http://localhost:4210 ,http://127.0.0.1:4210')).toEqual([
            ...cors_origins_1.DEFAULT_CORS_ORIGINS,
            'http://localhost:4210',
            'http://127.0.0.1:4210',
        ]);
    });
    it('lists an extra origin that is already a default once', () => {
        expect((0, cors_origins_1.corsAllowedOrigins)('http://localhost:4200')).toEqual([...cors_origins_1.DEFAULT_CORS_ORIGINS]);
    });
    it.each([
        ['a trailing slash', 'http://localhost:4210/'],
        ['a path', 'http://localhost:4210/app'],
        ['no scheme', 'localhost:4210'],
        ['not a URL', 'not an origin'],
    ])('refuses an extra entry with %s', (_label, entry) => {
        expect(() => (0, cors_origins_1.corsAllowedOrigins)(entry)).toThrow(/CORS_EXTRA_ORIGINS/);
    });
});
//# sourceMappingURL=cors-origins.spec.js.map