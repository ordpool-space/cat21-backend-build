import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from '../sync/ord-client.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingDto, PaginatedListingsDto } from './dto/listing.dto';
export declare class ListingsService {
    private readonly drizzle;
    private readonly ordClient;
    private readonly logger;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService);
    create(dto: CreateListingDto): Promise<ListingDto>;
    findByCatNumber(catNumber: number): Promise<ListingDto | null>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedListingsDto>;
    deleteByCatNumber(catNumber: number): Promise<void>;
    deleteByIdIfUnchanged(id: string, signedAt: number): Promise<void>;
    private rowToDto;
}
