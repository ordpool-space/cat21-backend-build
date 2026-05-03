import { ConfigService } from '@nestjs/config';
export interface OrdCatDetail {
    id: string;
    number: number;
    minted_by: string | null;
    sat: number;
    fee: number;
    height: number;
    timestamp: number;
    value: number;
    weight: number;
    size: number;
}
export declare class OrdClientService {
    private readonly baseUrl;
    constructor(configService: ConfigService);
    getLatestCatNumber(): Promise<number>;
    getCat(catNumberOrId: number | string): Promise<OrdCatDetail | null>;
    getBlockHash(height: number): Promise<string>;
    private fetchJson;
}
