import type { FastifyReply } from 'fastify';
import { BidDto, PaginatedBidsDto } from './dto/bid.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidsService } from './bids.service';
export declare class BidsController {
    private readonly bids;
    constructor(bids: BidsService);
    create(dto: CreateBidDto, reply: FastifyReply): Promise<BidDto>;
    findByOutpoint(catTxid: string, catVout: number, reply: FastifyReply): Promise<BidDto[]>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedBidsDto>;
    delete(catTxid: string, catVout: number, buyerOrdinalsAddress: string, reply: FastifyReply): Promise<void>;
}
