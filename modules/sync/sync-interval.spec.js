"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schedule_constants_1 = require("@nestjs/schedule/dist/schedule.constants");
const sync_interval_1 = require("./sync-interval");
describe('readSyncIntervalMsFromEnv', () => {
    it('ticks once a minute when SYNC_INTERVAL_MS is unset or empty', () => {
        expect(sync_interval_1.DEFAULT_SYNC_INTERVAL_MS).toBe(60_000);
        expect((0, sync_interval_1.readSyncIntervalMsFromEnv)({})).toBe(60_000);
        expect((0, sync_interval_1.readSyncIntervalMsFromEnv)({ SYNC_INTERVAL_MS: '' })).toBe(60_000);
    });
    it('takes SYNC_INTERVAL_MS in milliseconds', () => {
        expect((0, sync_interval_1.readSyncIntervalMsFromEnv)({ SYNC_INTERVAL_MS: '2000' })).toBe(2000);
    });
    it.each(['0', '-5', '1.5', '2s', 'abc'])('refuses SYNC_INTERVAL_MS=%s', (raw) => {
        expect(() => (0, sync_interval_1.readSyncIntervalMsFromEnv)({ SYNC_INTERVAL_MS: raw })).toThrow(`SYNC_INTERVAL_MS is "${raw}", expected a positive integer of milliseconds`);
    });
});
describe('SyncService tick', () => {
    const saved = process.env.SYNC_INTERVAL_MS;
    afterEach(() => {
        if (saved === undefined)
            delete process.env.SYNC_INTERVAL_MS;
        else
            process.env.SYNC_INTERVAL_MS = saved;
    });
    function registeredTimeout() {
        let timeout;
        jest.isolateModules(() => {
            const { SyncService } = require('./sync.service');
            timeout = Reflect.getMetadata(schedule_constants_1.SCHEDULE_INTERVAL_OPTIONS, SyncService.prototype.handleSync).timeout;
        });
        return timeout;
    }
    it('registers handleSync at SYNC_INTERVAL_MS', () => {
        process.env.SYNC_INTERVAL_MS = '1500';
        expect(registeredTimeout()).toBe(1500);
    });
    it('registers handleSync at the default without SYNC_INTERVAL_MS', () => {
        delete process.env.SYNC_INTERVAL_MS;
        expect(registeredTimeout()).toBe(60_000);
    });
});
//# sourceMappingURL=sync-interval.spec.js.map