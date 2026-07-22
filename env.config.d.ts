export declare class EnvironmentVariables {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    DATABASE_URL: string;
    ORD_API_URL: string;
    ELECTRS_API_URL: string;
    BACKEND_NETWORK: 'mainnet' | 'testnet3' | 'testnet4' | 'signet' | 'regtest';
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
