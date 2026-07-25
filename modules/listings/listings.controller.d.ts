import type { FastifyReply } from 'fastify';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingDto, PaginatedListingsDto } from './dto/listing.dto';
import { ListingsService } from './listings.service';
export declare class ListingsController {
    private readonly listings;
    constructor(listings: ListingsService);
    create(dto: CreateListingDto, sessionAddress: string, reply: FastifyReply): Promise<ListingDto>;
    findByCatNumber(catNumber: number, reply: FastifyReply): Promise<ListingDto>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedListingsDto>;
    delete(catNumber: number, sessionAddress: string, reply: FastifyReply): Promise<void>;
}
