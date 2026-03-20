export declare class EnvironmentVariables {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    ORD_API_URL: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
