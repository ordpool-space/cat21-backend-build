import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';
export declare class DrizzleService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly pool;
    readonly db: MySql2Database<typeof schema>;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
