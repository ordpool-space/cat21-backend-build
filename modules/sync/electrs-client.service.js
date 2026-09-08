"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ElectrsClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectrsClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const FETCH_TIMEOUT_MS = 15_000;
let ElectrsClientService = ElectrsClientService_1 = class ElectrsClientService {
    constructor(configService) {
        this.logger = new common_1.Logger(ElectrsClientService_1.name);
        this.baseUrl = configService.getOrThrow('ELECTRS_API_URL');
    }
    async getOutpointStatus(txid, vout) {
        const url = `${this.baseUrl}/tx/${txid}/outspend/${vout}`;
        let res;
        try {
            res = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });
        }
        catch (err) {
            this.logger.warn(`electrs outspend fetch failed for ${txid}:${vout}: ${err instanceof Error ? err.message : err}`);
            return 'unknown';
        }
        if (res.status === 404)
            return 'spent';
        if (!res.ok) {
            this.logger.warn(`electrs outspend returned ${res.status} for ${txid}:${vout}`);
            return 'unknown';
        }
        let body;
        try {
            body = await res.json();
        }
        catch (err) {
            this.logger.warn(`electrs outspend malformed JSON for ${txid}:${vout}: ${err instanceof Error ? err.message : err}`);
            return 'unknown';
        }
        if (typeof body === 'object' &&
            body !== null &&
            'spent' in body &&
            typeof body.spent === 'boolean') {
            if (body.spent)
                return 'spent';
            const exists = await this.txExists(txid);
            if (exists === 'missing')
                return 'spent';
            if (exists === 'unknown')
                return 'unknown';
            return 'unspent';
        }
        this.logger.warn(`electrs outspend unexpected shape for ${txid}:${vout}: ${JSON.stringify(body)}`);
        return 'unknown';
    }
    async txExists(txid) {
        let res;
        try {
            res = await fetch(`${this.baseUrl}/tx/${txid}`, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });
        }
        catch (err) {
            this.logger.warn(`electrs /tx fetch failed for ${txid}: ${err instanceof Error ? err.message : err}`);
            return 'unknown';
        }
        if (res.status === 404)
            return 'missing';
        if (!res.ok) {
            this.logger.warn(`electrs /tx returned ${res.status} for ${txid}`);
            return 'unknown';
        }
        return 'exists';
    }
    async isOutpointSpent(txid, vout) {
        return (await this.getOutpointStatus(txid, vout)) === 'spent';
    }
};
exports.ElectrsClientService = ElectrsClientService;
exports.ElectrsClientService = ElectrsClientService = ElectrsClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElectrsClientService);
//# sourceMappingURL=electrs-client.service.js.map