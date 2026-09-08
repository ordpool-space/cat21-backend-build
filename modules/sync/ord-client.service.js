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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdClientService = void 0;
exports.parseSatpoint = parseSatpoint;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const FETCH_TIMEOUT_MS = 30_000;
let OrdClientService = class OrdClientService {
    constructor(configService) {
        this.baseUrl = configService.getOrThrow('ORD_API_URL');
    }
    async getLatestCatNumber() {
        const data = await this.fetchJson(`${this.baseUrl}/cats`);
        if (data.ids.length === 0)
            return -1;
        const newest = await this.getCat(data.ids[0]);
        return newest?.number ?? -1;
    }
    async getCat(catNumberOrId) {
        return this.fetchJson(`${this.baseUrl}/cat/${catNumberOrId}`, true);
    }
    async getCatCurrentLocation(catNumber) {
        const cat = await this.getCat(catNumber);
        if (!cat)
            return null;
        const insc = await this.fetchJson(`${this.baseUrl}/inscription/${cat.id}`, true);
        if (!insc || !insc.address)
            return null;
        const parsed = parseSatpoint(insc.satpoint);
        if (!parsed)
            return null;
        return {
            txid: parsed.txid,
            vout: parsed.vout,
            ordinalsAddress: insc.address,
        };
    }
    async getCatsAtOutput(txid, vout) {
        const out = await this.fetchJson(`${this.baseUrl}/output/${txid}:${vout}`, true);
        if (!out)
            return null;
        if (!Array.isArray(out.cats))
            return [];
        const numbers = await Promise.all(out.cats.map(async (entry) => {
            if (typeof entry === 'number')
                return Number.isInteger(entry) && entry >= 0 ? entry : null;
            const cat = await this.getCat(entry);
            return cat?.number ?? null;
        }));
        const resolved = numbers.filter((n) => n !== null && n >= 0);
        return Array.from(new Set(resolved)).sort((a, b) => a - b);
    }
    async fetchJson(url, allow404 = false) {
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (allow404 && res.status === 404) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`ord API error: ${res.status} ${res.statusText} for ${url}`);
        }
        return res.json();
    }
};
exports.OrdClientService = OrdClientService;
exports.OrdClientService = OrdClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OrdClientService);
function parseSatpoint(satpoint) {
    const parts = satpoint.split(':');
    if (parts.length !== 3)
        return null;
    const [txid, voutRaw] = parts;
    if (!/^[0-9a-f]{64}$/i.test(txid))
        return null;
    const vout = Number.parseInt(voutRaw, 10);
    if (!Number.isInteger(vout) || vout < 0)
        return null;
    return { txid: txid.toLowerCase(), vout };
}
//# sourceMappingURL=ord-client.service.js.map