import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
export declare class DrizzleService implements OnModuleDestroy {
    private readonly logger;
    private readonly pool;
    readonly db: NodePgDatabase<typeof schema>;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
}
