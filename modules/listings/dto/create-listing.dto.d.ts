export declare class CreateListingDto {
    catNumber: number;
    cats: number[];
    network: 'mainnet' | 'testnet3' | 'testnet4' | 'signet' | 'regtest';
    askSats: number;
    payTo: string;
    catTxid: string;
    catVout: number;
    ordinalsAddress: string;
    signedAt: number;
    signature: string;
}
