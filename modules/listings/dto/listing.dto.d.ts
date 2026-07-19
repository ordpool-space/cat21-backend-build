export declare class ListingDto {
    id: string;
    catNumber: number;
    network: string;
    askSats: number;
    payTo: string;
    catTxid: string;
    catVout: number;
    ordinalsAddress: string;
    signedAt: number;
    signature: string;
    createdAt: string;
}
export declare class PaginatedListingsDto {
    total: number;
    currentPage: number;
    itemsPerPage: number;
    items: ListingDto[];
}
