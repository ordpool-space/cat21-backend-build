"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYNC_INTERVAL_MS = void 0;
exports.readSyncIntervalMsFromEnv = readSyncIntervalMsFromEnv;
exports.DEFAULT_SYNC_INTERVAL_MS = 60_000;
function readSyncIntervalMsFromEnv(env = process.env) {
    const raw = env.SYNC_INTERVAL_MS;
    if (raw === undefined || raw === '')
        return exports.DEFAULT_SYNC_INTERVAL_MS;
    const ms = Number(raw);
    if (!Number.isInteger(ms) || ms <= 0) {
        throw new Error(`SYNC_INTERVAL_MS is "${raw}", expected a positive integer of milliseconds`);
    }
    return ms;
}
//# sourceMappingURL=sync-interval.js.map