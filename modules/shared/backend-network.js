"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBackendNetworkFromEnv = readBackendNetworkFromEnv;
exports.toSdkNetwork = toSdkNetwork;
const core_1 = require("ordpool-sdk/core");
const ALLOWED = ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'];
function readBackendNetworkFromEnv() {
    const raw = process.env.BACKEND_NETWORK;
    if (raw && ALLOWED.includes(raw)) {
        return raw;
    }
    return 'mainnet';
}
function toSdkNetwork(name) {
    switch (name) {
        case 'mainnet': return core_1.Network.Mainnet;
        case 'testnet3': return core_1.Network.Testnet3;
        case 'testnet4': return core_1.Network.Testnet4;
        case 'signet': return core_1.Network.Signet;
        case 'regtest': return core_1.Network.Regtest;
    }
}
//# sourceMappingURL=backend-network.js.map