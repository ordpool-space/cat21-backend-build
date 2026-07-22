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
var BidsPruner_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsPruner = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const base_1 = require("@scure/base");
const btc = require("@scure/btc-signer");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const bids_1 = require("../shared/drizzle/schema/bids");
const electrs_client_service_1 = require("../sync/electrs-client.service");
const ord_client_service_1 = require("../sync/ord-client.service");
const bids_service_1 = require("./bids.service");
let BidsPruner = BidsPruner_1 = class BidsPruner {
    constructor(drizzle, ordClient, electrsClient, bidsService) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.electrsClient = electrsClient;
        this.bidsService = bidsService;
        this.logger = new common_1.Logger(BidsPruner_1.name);
        this.running = false;
        this.bootTimer = null;
    }
    onModuleInit() {
        this.bootTimer = setTimeout(() => {
            this.bootTimer = null;
            this.runPrune().catch((err) => {
                this.logger.error('Initial prune failed', err instanceof Error ? err.stack : err);
            });
        }, 60_000);
    }
    onModuleDestroy() {
        if (this.bootTimer !== null) {
            clearTimeout(this.bootTimer);
            this.bootTimer = null;
        }
    }
    async runPrune() {
        if (this.running) {
            this.logger.debug('Prune: previous run still active, skipping this tick');
            return;
        }
        this.running = true;
        try {
            await this.runPruneInner();
        }
        finally {
            this.running = false;
        }
    }
    async runPruneInner() {
        const started = Date.now();
        const allBids = await this.drizzle.db.select().from(bids_1.bids);
        if (allBids.length === 0) {
            this.logger.debug('Prune: nothing to check');
            return;
        }
        const grouped = new Map();
        for (const row of allBids) {
            const key = `${row.catTxid}:${row.catVout}`;
            const arr = grouped.get(key) ?? [];
            arr.push(row);
            grouped.set(key, arr);
        }
        let checked = 0;
        let droppedSellerSide = 0;
        let droppedBuyerSide = 0;
        let ordErrors = 0;
        for (const [outpoint, group] of grouped) {
            const [txid, voutStr] = outpoint.split(':');
            const vout = Number(voutStr);
            let live;
            try {
                live = await this.ordClient.getCatsAtOutput(txid, vout);
            }
            catch (err) {
                ordErrors++;
                this.logger.warn(`Prune: ord /output lookup failed for ${outpoint}: ${err instanceof Error ? err.message : err}`);
                continue;
            }
            const sellerSideStale = live === null || live.length === 0;
            for (const row of group) {
                checked++;
                if (sellerSideStale || !bidCatsMatchLive(row.catsOnUtxo, live)) {
                    await this.dropRow(row, `seller-side stale: signed=[${row.catsOnUtxo.join(',')}], live=[${(live ?? []).join(',')}]`);
                    droppedSellerSide++;
                    continue;
                }
                let buyerInputsAllLive;
                try {
                    buyerInputsAllLive = await this.checkBuyerInputsLive(row.psbtBase64);
                }
                catch (err) {
                    this.logger.warn(`Prune: failed to parse PSBT for bid ${row.id}: ${err instanceof Error ? err.message : err}`);
                    await this.dropRow(row, 'PSBT parse failed on prune');
                    droppedBuyerSide++;
                    continue;
                }
                if (buyerInputsAllLive === false) {
                    await this.dropRow(row, 'buyer-side stale: at least one funding UTXO spent');
                    droppedBuyerSide++;
                }
            }
        }
        this.logger.log(`Prune: checked=${checked} droppedSellerSide=${droppedSellerSide} ` +
            `droppedBuyerSide=${droppedBuyerSide} ordErrors=${ordErrors} in ${Date.now() - started}ms`);
    }
    async checkBuyerInputsLive(psbtBase64) {
        const bytes = base_1.base64.decode(psbtBase64);
        const tx = btc.Transaction.fromPSBT(bytes, {
            allowUnknowInput: true,
            allowUnknowOutput: true,
        });
        if (tx.inputsLength < 2)
            return null;
        for (let i = 1; i < tx.inputsLength; i++) {
            const inp = tx.getInput(i);
            if (!inp.txid)
                continue;
            const txid = base_1.hex.encode(inp.txid);
            const vout = inp.index ?? 0;
            const spent = await this.electrsClient.isOutpointSpent(txid, vout);
            if (spent)
                return false;
        }
        return true;
    }
    async dropRow(row, reason) {
        await this.bidsService.deleteByOutpointAndBuyer(row.network, row.catTxid, row.catVout, row.buyerOrdinalsAddress);
        this.logger.log(`Prune: dropped bid on ${row.catTxid}:${row.catVout} from buyer ${row.buyerOrdinalsAddress} — ${reason}`);
    }
};
exports.BidsPruner = BidsPruner;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BidsPruner.prototype, "runPrune", null);
exports.BidsPruner = BidsPruner = BidsPruner_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        ord_client_service_1.OrdClientService,
        electrs_client_service_1.ElectrsClientService,
        bids_service_1.BidsService])
], BidsPruner);
function bidCatsMatchLive(signed, live) {
    if (signed.length !== live.length)
        return false;
    const sa = [...signed].sort((a, b) => a - b);
    const sb = [...live].sort((a, b) => a - b);
    return sa.every((v, i) => v === sb[i]);
}
//# sourceMappingURL=bids.pruner.js.map