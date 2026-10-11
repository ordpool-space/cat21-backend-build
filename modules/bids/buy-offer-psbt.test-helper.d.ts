export declare const BUYER_PAYMENT_ADDRESS: string;
export declare const BUYER_ORDINALS_ADDRESS: string;
export declare const SELLER_PAYMENT_ADDRESS: string;
export declare const STRANGER_ADDRESS: string;
export interface BuyOfferPsbtOptions {
    sellerUtxo: {
        txid: string;
        vout: number;
        value: number;
    };
    buyerFunding?: {
        txid: string;
        vout: number;
        value: number;
    }[];
    outputs?: {
        address: string;
        amount: number;
    }[];
    priceSats?: number;
    buyerSighash?: number;
}
export declare function fundingTxid(n: number): string;
export declare function buildBuyOfferPsbt(opts: BuyOfferPsbtOptions): {
    base64: string;
    bytes: Uint8Array;
};
