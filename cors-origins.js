"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CORS_ORIGINS = void 0;
exports.corsAllowedOrigins = corsAllowedOrigins;
exports.DEFAULT_CORS_ORIGINS = [
    'https://cat21.space',
    'https://ordpool.space',
    'http://localhost:4200',
    'http://localhost:4221',
];
function corsAllowedOrigins(extra) {
    const added = (extra ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o !== '');
    for (const origin of added) {
        let parsed;
        try {
            parsed = new URL(origin);
        }
        catch {
            throw new Error(`CORS_EXTRA_ORIGINS: "${origin}" is not an origin`);
        }
        if (parsed.origin !== origin) {
            throw new Error(`CORS_EXTRA_ORIGINS: "${origin}" is not a bare origin (expected "${parsed.origin}")`);
        }
    }
    return [...new Set([...exports.DEFAULT_CORS_ORIGINS, ...added])];
}
//# sourceMappingURL=cors-origins.js.map