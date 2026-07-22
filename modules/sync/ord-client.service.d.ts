import { ConfigService } from '@nestjs/config';
export interface OrdCatDetail {
    id: string;
    number: number;
    minted_by: string | null;
    sat: number;
    fee: number;
    height: number;
    block_hash: string | null;
    timestamp: number;
    value: number;
    weight: number;
    size: number;
}
export interface OrdInscriptionDetail {
    satpoint: string;
    address: string | null;
}
export interface CatCurrentLocation {
    txid: string;
    vout: number;
    ordinalsAddress: string;
}
export interface OrdOutputDetail {
    cats: number[];
    inscriptions: string[];
    runes: Record<string, unknown>;
}
export declare class OrdClientService {
    private readonly baseUrl;
    constructor(configService: ConfigService);
    getLatestCatNumber(): Promise<number>;
    getCat(catNumberOrId: number | string): Promise<OrdCatDetail | null>;
    getCatCurrentLocation(catNumber: number): Promise<CatCurrentLocation | null>;
    getCatsAtOutput(txid: string, vout: number): Promise<number[] | null>;
    private fetchJson;
}
export declare function parseSatpoint(satpoint: string): {
    txid: string;
    vout: number;
} | null;
