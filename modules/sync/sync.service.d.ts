import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from './ord-client.service';
export declare function deriveCategory(catNumber: number): string;
export declare class SyncService {
    private readonly drizzle;
    private readonly ordClient;
    private readonly logger;
    private syncing;
    private readonly blockHashCache;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService);
    handleSync(): Promise<void>;
    private getBlockHashCached;
    sync(): Promise<void>;
}
