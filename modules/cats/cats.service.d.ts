import { type SQL } from 'drizzle-orm';
import { CacheService } from '../shared/cache/cache.service';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { SyncService } from '../sync/sync.service';
import { CatDto, CatNumbersPaginatedResultDto, CatsPaginatedResultDto, ExtendedHealthDto, HealthDto, StatusDto } from './dto/cat.dto';
export interface SearchFilters {
    eyes?: string[];
    pose?: string[];
    expression?: string[];
    pattern?: string[];
    background?: string[];
    crown?: string[];
    glasses?: string[];
    category?: string[];
    gender?: string[];
    color?: string[];
    genesis?: string[];
}
export declare class CatsService {
    private readonly drizzle;
    private readonly cache;
    private readonly sync;
    private readonly startedAt;
    constructor(drizzle: DrizzleService, cache: CacheService, sync: SyncService);
    getHealth(): HealthDto;
    getExtendedHealth(): Promise<ExtendedHealthDto>;
    getStatus(): Promise<StatusDto>;
    getCatByNumber(catNumber: number): Promise<CatDto | null>;
    getCatByTxHash(txHash: string): Promise<CatDto | null>;
    getCats(itemsPerPage: number, currentPage: number): Promise<CatsPaginatedResultDto>;
    getCatNumbers(itemsPerPage: number, currentPage: number): Promise<CatNumbersPaginatedResultDto>;
    searchCatNumbers(filters: SearchFilters, itemsPerPage: number, currentPage: number): Promise<CatNumbersPaginatedResultDto>;
    randomCatNumber(filters: SearchFilters): Promise<number | null>;
    private ensureTotalsPrimed;
    getCatSvg(catNumber: number): Promise<string | null>;
    private mapToDto;
}
export declare function buildSearchWhere(filters: SearchFilters): SQL | undefined;
