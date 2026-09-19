import { Network } from "ordpool-sdk/network";
export type BackendNetworkString = 'mainnet' | 'testnet3' | 'testnet4' | 'signet' | 'regtest';
export declare function readBackendNetworkFromEnv(): BackendNetworkString;
export declare function toSdkNetwork(name: BackendNetworkString): Network;
