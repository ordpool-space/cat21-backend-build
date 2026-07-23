import { Network } from "ordpool-sdk/core";
import { BackendNetworkString } from '../shared/backend-network';
import { DrizzleService } from '../shared/drizzle/drizzle.service';
import { OrdClientService } from '../sync/ord-client.service';
import { BidDto, PaginatedBidsDto } from './dto/bid.dto';
import { CreateBidDto } from './dto/create-bid.dto';
export declare function scriptToAddress(script: Uint8Array, network: Network): string | null;
export declare class BidsService {
    private readonly drizzle;
    private readonly ordClient;
    private readonly logger;
    private readonly backendNetwork;
    constructor(drizzle: DrizzleService, ordClient: OrdClientService);
    get network(): BackendNetworkString;
    create(dto: CreateBidDto): Promise<BidDto>;
    findByOutpoint(network: string, catTxid: string, catVout: number): Promise<BidDto[]>;
    findByOutpointAndBuyer(network: string, catTxid: string, catVout: number, buyerOrdinalsAddress: string): Promise<BidDto | null>;
    findPaginated(itemsPerPage: number, currentPage: number): Promise<PaginatedBidsDto>;
    deleteByOutpointAndBuyer(network: string, catTxid: string, catVout: number, buyerOrdinalsAddress: string): Promise<void>;
    private rowToDto;
}
