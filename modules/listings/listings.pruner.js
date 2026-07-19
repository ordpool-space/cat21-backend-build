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
var ListingsPruner_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsPruner = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const listings_1 = require("../shared/drizzle/schema/listings");
const ord_client_service_1 = require("../sync/ord-client.service");
const listings_service_1 = require("./listings.service");
let ListingsPruner = ListingsPruner_1 = class ListingsPruner {
    constructor(drizzle, ordClient, listingsService) {
        this.drizzle = drizzle;
        this.ordClient = ordClient;
        this.listingsService = listingsService;
        this.logger = new common_1.Logger(ListingsPruner_1.name);
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
        const allListings = await this.drizzle.db.select().from(listings_1.listings);
        if (allListings.length === 0) {
            this.logger.debug('Prune: nothing to check');
            return;
        }
        let checked = 0;
        let dropped = 0;
        let ordErrors = 0;
        for (const row of allListings) {
            checked++;
            let current;
            try {
                current = await this.ordClient.getCatCurrentLocation(row.catNumber);
            }
            catch (err) {
                ordErrors++;
                this.logger.warn(`Prune: ord lookup failed for cat #${row.catNumber}: ${err instanceof Error ? err.message : err}`);
                continue;
            }
            if (!current) {
                await this.dropIfUnchanged(row, 'no current location on ord');
                dropped++;
                continue;
            }
            if (current.txid !== row.catTxid || current.vout !== row.catVout) {
                await this.dropIfUnchanged(row, `outpoint drifted ${row.catTxid}:${row.catVout} → ${current.txid}:${current.vout}`);
                dropped++;
            }
        }
        this.logger.log(`Prune: checked=${checked} dropped=${dropped} ordErrors=${ordErrors} in ${Date.now() - started}ms`);
    }
    async dropIfUnchanged(row, reason) {
        await this.listingsService.deleteByIdIfUnchanged(row.id, row.signedAt);
        this.logger.log(`Prune: dropped cat #${row.catNumber} — ${reason}`);
    }
};
exports.ListingsPruner = ListingsPruner;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ListingsPruner.prototype, "runPrune", null);
exports.ListingsPruner = ListingsPruner = ListingsPruner_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        ord_client_service_1.OrdClientService,
        listings_service_1.ListingsService])
], ListingsPruner);
//# sourceMappingURL=listings.pruner.js.map