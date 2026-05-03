import type { FastifyReply } from 'fastify';
import { CatsService } from './cats.service';
import { CatDto, CatNumbersPaginatedResultDto, CatsPaginatedResultDto, ExtendedHealthDto, HealthDto, StatusDto } from './dto/cat.dto';
export declare class CatsController {
    private readonly catsService;
    constructor(catsService: CatsService);
    getHealth(): HealthDto;
    getExtendedHealth(reply: FastifyReply): Promise<ExtendedHealthDto>;
    getStatus(): Promise<StatusDto>;
    getCatByNumber(catNumber: number, reply: FastifyReply): Promise<CatDto>;
    getCatByTxHash(txHash: string, reply: FastifyReply): Promise<CatDto>;
    getCatSvg(catNumber: number, reply: FastifyReply): Promise<never>;
    getCatWebp(catNumber: number, reply: FastifyReply): Promise<never>;
    getCats(itemsPerPage: number, currentPage: number): Promise<CatsPaginatedResultDto>;
    getCatNumbers(itemsPerPage: number, currentPage: number): Promise<CatNumbersPaginatedResultDto>;
}
