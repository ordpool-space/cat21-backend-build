import { OnModuleInit } from '@nestjs/common';
import { CacheService } from '../shared/cache/cache.service';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from './ord-client.service';
export declare function deriveCategory(catNumber: number): string;
export declare class SyncService implements OnModuleInit {
    private readonly drizzle;
    private readonly ordClient;
    private readonly cache;
    private readonly logger;
    private syncing;
    private localMax;
    private readonly blockHashCache;
    private lastSuccessAt;
    private lastErrorAt;
    private lastError;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService, cache: CacheService);
    getSyncHealth(): {
        lastSuccessAt: Date | null;
        lastErrorAt: Date | null;
        lastError: string | null;
    };
    onModuleInit(): Promise<void>;
    private backfillDominantColorCategory;
    handleSync(): Promise<void>;
    private getBlockHashCached;
    sync(): Promise<void>;
    private recomputeRarityForAllCategories;
    private recomputeRarityForCategory;
}
