import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from '../sync/ord-client.service';
import { BidsService } from './bids.service';
export declare class BidsPruner implements OnModuleInit, OnModuleDestroy {
    private readonly drizzle;
    private readonly ordClient;
    private readonly bidsService;
    private readonly logger;
    private running;
    private bootTimer;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService, bidsService: BidsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runPrune(): Promise<void>;
    private runPruneInner;
    private dropRow;
}
