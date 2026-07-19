import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from '../sync/ord-client.service';
import { ListingsService } from './listings.service';
export declare class ListingsPruner implements OnModuleInit, OnModuleDestroy {
    private readonly drizzle;
    private readonly ordClient;
    private readonly listingsService;
    private readonly logger;
    private running;
    private bootTimer;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService, listingsService: ListingsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runPrune(): Promise<void>;
    private runPruneInner;
    private dropIfUnchanged;
}
