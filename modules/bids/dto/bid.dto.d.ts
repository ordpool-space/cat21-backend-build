export declare class BidDto {
    id: string;
    network: string;
    catTxid: string;
    catVout: number;
    cats: number[];
    headlineCatNumber: number;
    bidSats: number;
    buyerOrdinalsAddress: string;
    buyerPaymentAddress: string;
    sellerPaymentAddress: string;
    psbtBase64: string;
    createdAt: string;
}
export declare class PaginatedBidsDto {
    total: number;
    currentPage: number;
    itemsPerPage: number;
    items: BidDto[];
}
