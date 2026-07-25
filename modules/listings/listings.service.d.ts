import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from '../sync/ord-client.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingDto, PaginatedListingsDto } from './dto/listing.dto';
export declare class ListingsService {
    private readonly drizzle;
    private readonly ordClient;
    private readonly logger;
    private readonly backendNetwork;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService);
    create(dto: CreateListingDto, sellerOrdinalsAddress: string): Promise<ListingDto>;
    findByCatNumber(catNumber: number): Promise<ListingDto | null>;
    findByOutpoint(network: string, catTxid: string, catVout: number): Promise<ListingDto | null>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedListingsDto>;
    deleteByCatNumber(catNumber: number): Promise<void>;
    deleteByCatNumberIfOwnedBy(catNumber: number, ordinalsAddress: string): Promise<boolean>;
    deleteByIdIfUnchanged(id: string, signedAt: number): Promise<void>;
    private rowToDto;
}
