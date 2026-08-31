import { BackendNetworkString } from '../shared/backend-network';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { ElectrsClientService } from '../sync/electrs-client.service';
import { OrdClientService } from '../sync/ord-client.service';
import { BidDto, PaginatedBidsDto } from './dto/bid.dto';
import { CreateBidDto } from './dto/create-bid.dto';
export declare class BidsService {
    private readonly drizzle;
    private readonly ordClient;
    private readonly electrsClient;
    private readonly logger;
    private readonly backendNetwork;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService, electrsClient: ElectrsClientService);
    get network(): BackendNetworkString;
    create(dto: CreateBidDto): Promise<BidDto>;
    findByOutpoint(network: string, catTxid: string, catVout: number): Promise<BidDto[]>;
    findByOutpointAndBuyer(network: string, catTxid: string, catVout: number, buyerOrdinalsAddress: string): Promise<BidDto | null>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedBidsDto>;
    deleteByOutpointAndBuyer(network: string, catTxid: string, catVout: number, buyerOrdinalsAddress: string): Promise<void>;
    private rowToDto;
}
