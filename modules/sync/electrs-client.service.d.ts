import { ConfigService } from '@nestjs/config';
export interface OutspendStatus {
    spent: boolean;
}
export type OutpointStatus = 'spent' | 'unspent' | 'unknown';
export declare class ElectrsClientService {
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    getOutpointStatus(txid: string, vout: number): Promise<OutpointStatus>;
    private txExists;
    isOutpointSpent(txid: string, vout: number): Promise<boolean>;
    getPrevout(txid: string, vout: number): Promise<{
        script: Uint8Array;
        amountSats: number;
    } | 'not-found' | 'unknown'>;
}
