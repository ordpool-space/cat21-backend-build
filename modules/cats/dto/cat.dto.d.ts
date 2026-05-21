export declare class CatSearchQueryDto {
    eyes?: string;
    pose?: string;
    expression?: string;
    pattern?: string;
    background?: string;
    crown?: string;
    glasses?: string;
    category?: string;
    gender?: string;
    color?: string;
    genesis?: string;
    rarity?: string;
    sort?: string;
}
export declare class CatDto {
    id: string;
    catNumber: number;
    txHash: string;
    blockHash: string;
    blockHeight: number;
    mintedAt: string;
    mintedBy: string | null;
    fee: number;
    weight: number;
    size: number;
    feeRate: number;
    sat: number;
    value: number;
    category: string;
    genesis: boolean;
    catColors: string[];
    gender: string;
    designIndex: number;
    designPose: string;
    designExpression: string;
    designPattern: string;
    designFacing: string;
    laserEyes: string;
    background: string;
    backgroundColors: string[];
    crown: string;
    glasses: string;
    glassesColors: string[];
    rarityBits: number | null;
    rarityRank: number | null;
    rarityCategoryTotal: number | null;
}
export declare class CatsPaginatedResultDto {
    cats: CatDto[];
    total: number;
    currentPage: number;
    itemsPerPage: number;
}
export declare class CatNumbersPaginatedResultDto {
    catNumbers: number[];
    total: number;
    currentPage: number;
    itemsPerPage: number;
}
export type FacetCounts = Record<string, Record<string, number>>;
export declare class CatSearchResultDto extends CatNumbersPaginatedResultDto {
    facets: FacetCounts;
    categoryTotal: number | null;
}
export declare const CAT_SORT_VALUES: readonly ["newest", "rarity"];
export type CatSort = typeof CAT_SORT_VALUES[number];
export declare class StatusDto {
    totalCats: number;
    lastSyncedCatNumber: number;
    proofOfCatWork: number;
}
export declare class CacheStatsDto {
    cats: number;
    catsMax: number;
    txHashIndex: number;
    totalCatCount: number;
    lastSyncedCatNumber: number;
    proofOfCatWork: number;
    memoryLimitMB: number;
    memoryTargetMB: number;
    memoryHeadroomMB: number;
    memoryRssMB: number;
    memoryHeapUsedMB: number;
}
export declare class HealthDto {
    status: string;
    timestamp: string;
    uptimeSec: number;
    version: string;
    memoryMB: number;
    cache: CacheStatsDto;
}
export declare class DatabaseHealthDto {
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
}
export declare class SyncHealthDto {
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    lastError: string | null;
    secondsSinceLastSuccess: number | null;
    stalled: boolean;
}
export declare class ExtendedHealthDto {
    status: 'ok' | 'degraded' | 'down';
    timestamp: string;
    uptimeSec: number;
    version: string;
    memoryMB: number;
    database: DatabaseHealthDto;
    sync: SyncHealthDto;
    cache: CacheStatsDto;
}
