"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBackendNetworkFromEnv = readBackendNetworkFromEnv;
exports.toSdkNetwork = toSdkNetwork;
const network_1 = require("ordpool-sdk/network");
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
        case 'mainnet': return network_1.Network.Mainnet;
        case 'testnet3': return network_1.Network.Testnet3;
        case 'testnet4': return network_1.Network.Testnet4;
        case 'signet': return network_1.Network.Signet;
        case 'regtest': return network_1.Network.Regtest;
    }
}
//# sourceMappingURL=backend-network.js.map