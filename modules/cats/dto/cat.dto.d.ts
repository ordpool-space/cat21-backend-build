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
    male: boolean;
    female: boolean;
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
}
export declare class CatsPaginatedResultDto {
    cats: CatDto[];
    total: number;
    currentPage: number;
    itemsPerPage: number;
}
export declare class StatusDto {
    totalCats: number;
    lastSyncedCatNumber: number;
}
export declare class HealthDto {
    status: string;
    timestamp: string;
    uptimeSec: number;
    version: string;
}
