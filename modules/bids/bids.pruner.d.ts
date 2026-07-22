import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { ElectrsClientService } from '../sync/electrs-client.service';
import { OrdClientService } from '../sync/ord-client.service';
import { BidsService } from './bids.service';
export declare class BidsPruner implements OnModuleInit, OnModuleDestroy {
    private readonly drizzle;
    private readonly ordClient;
    private readonly electrsClient;
    private readonly bidsService;
    private readonly logger;
    private running;
    private bootTimer;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService, electrsClient: ElectrsClientService, bidsService: BidsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runPrune(): Promise<void>;
    private runPruneInner;
    private checkBuyerInputsLive;
    private dropRow;
}
