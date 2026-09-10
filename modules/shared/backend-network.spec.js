"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("ordpool-sdk/core");
const backend_network_1 = require("./backend-network");
describe('backend-network', () => {
    describe('readBackendNetworkFromEnv', () => {
        const original = process.env.BACKEND_NETWORK;
        afterEach(() => {
            if (original === undefined)
                delete process.env.BACKEND_NETWORK;
            else
                process.env.BACKEND_NETWORK = original;
        });
        it('defaults to mainnet when BACKEND_NETWORK is unset', () => {
            delete process.env.BACKEND_NETWORK;
            expect((0, backend_network_1.readBackendNetworkFromEnv)()).toBe('mainnet');
        });
        it.each(['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'])('returns %s verbatim when it is an allowed value', (net) => {
            process.env.BACKEND_NETWORK = net;
            expect((0, backend_network_1.readBackendNetworkFromEnv)()).toBe(net);
        });
        it.each(['', 'Mainnet', 'testnet', 'liquid', 'nonsense'])('falls back to mainnet for the disallowed value %p (never passes it through)', (bad) => {
            process.env.BACKEND_NETWORK = bad;
            expect((0, backend_network_1.readBackendNetworkFromEnv)()).toBe('mainnet');
        });
    });
    describe('toSdkNetwork', () => {
        it.each([
            ['mainnet', core_1.Network.Mainnet],
            ['testnet3', core_1.Network.Testnet3],
            ['testnet4', core_1.Network.Testnet4],
            ['signet', core_1.Network.Signet],
            ['regtest', core_1.Network.Regtest],
        ])('maps %s to the matching SDK Network enum', (name, expected) => {
            expect((0, backend_network_1.toSdkNetwork)(name)).toBe(expected);
        });
        it('maps each distinct backend string to a DISTINCT enum value (no two collapse together)', () => {
            const all = ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'];
            const mapped = all.map(backend_network_1.toSdkNetwork);
            expect(new Set(mapped).size).toBe(all.length);
        });
    });
});
//# sourceMappingURL=backend-network.spec.js.map