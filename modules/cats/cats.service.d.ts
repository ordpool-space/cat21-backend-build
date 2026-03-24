import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { CatDto, CatNumbersPaginatedResultDto, CatsPaginatedResultDto, HealthDto, StatusDto } from './dto/cat.dto';
export declare class CatsService {
    private readonly drizzle;
    private readonly startedAt;
    constructor(drizzle: DrizzleService);
    getHealth(): HealthDto;
    getStatus(): Promise<StatusDto>;
    getCatByNumber(catNumber: number): Promise<CatDto | null>;
    getCatByTxHash(txHash: string): Promise<CatDto | null>;
    getCats(itemsPerPage: number, currentPage: number): Promise<CatsPaginatedResultDto>;
    getCatNumbers(itemsPerPage: number, currentPage: number): Promise<CatNumbersPaginatedResultDto>;
    getCatSvg(catNumber: number): Promise<string | null>;
    private mapToDto;
}
