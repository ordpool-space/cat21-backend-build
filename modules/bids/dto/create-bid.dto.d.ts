export declare class CreateBidDto {
    network: 'mainnet' | 'testnet3' | 'testnet4' | 'signet' | 'regtest';
    catTxid: string;
    catVout: number;
    cats: number[];
    headlineCatNumber: number;
    bidSats: number;
    buyerOrdinalsAddress: string;
    buyerPaymentAddress: string;
    sellerPaymentAddress: string;
    psbtBase64: string;
}
