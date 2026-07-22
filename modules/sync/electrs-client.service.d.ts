import { ConfigService } from '@nestjs/config';
export interface OutspendStatus {
    spent: boolean;
}
export declare class ElectrsClientService {
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    isOutpointSpent(txid: string, vout: number): Promise<boolean>;
}
