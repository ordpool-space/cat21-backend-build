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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const bid_dto_1 = require("./dto/bid.dto");
const create_bid_dto_1 = require("./dto/create-bid.dto");
const bids_service_1 = require("./bids.service");
const SINGLE_BID_CACHE_CONTROL = 'public, max-age=60, s-maxage=60';
const NO_STORE = 'no-store';
let BidsController = class BidsController {
    constructor(bids) {
        this.bids = bids;
    }
    async create(dto, reply) {
        try {
            const created = await this.bids.create(dto);
            reply.header('Cache-Control', NO_STORE);
            return created;
        }
        catch (err) {
            reply.header('Cache-Control', NO_STORE);
            throw err;
        }
    }
    async findByOutpoint(catTxid, catVout, reply) {
        const rows = await this.bids.findByOutpoint(this.bids.network, catTxid, catVout);
        reply.header('Cache-Control', SINGLE_BID_CACHE_CONTROL);
        return rows;
    }
    async findPaginated(itemsPerPage, currentPage) {
        return this.bids.findPaginated(itemsPerPage, currentPage);
    }
    async delete(catTxid, catVout, buyerOrdinalsAddress, reply) {
        await this.bids.deleteByOutpointAndBuyer(this.bids.network, catTxid, catVout, buyerOrdinalsAddress);
        reply.header('Cache-Control', NO_STORE);
    }
};
exports.BidsController = BidsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Post (or overwrite) a bid on a cat UTXO',
        description: "Publishes a buyer's half-signed PSBT to the marketplace. The PSBT itself IS the auth — " +
            "the buyer's SIGHASH_ALL signatures on inputs 1..N commit their funds to exact outputs. " +
            "One bid per (network, cat_txid, cat_vout, buyer_ordinals_address); a buyer re-bidding at a " +
            'new price overwrites their previous row atomically. Different buyers coexist on the same ' +
            'UTXO — that\'s the FOMO channel where competing bids drive the price up.\n\n' +
            'Rate-limited to 5/min/IP.',
    }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Exceeded 5 bid posts per minute per IP.' }),
    (0, swagger_1.ApiCreatedResponse)({ type: bid_dto_1.BidDto }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Rejection with a code:\n' +
            '- `network-mismatch` — DTO network doesn\'t match this deployment\n' +
            '- `headline-not-in-bundle` — headlineCatNumber isn\'t a member of cats\n' +
            '- `bid-below-marketplace-floor` — bidSats below the spam floor\n' +
            '- `psbt-malformed` — base64 decode or PSBT parse failed\n' +
            '- `psbt-shape-invalid` — wrong input/output count, missing scripts, wrong postage\n' +
            '- `psbt-input0-mismatch` — PSBT input 0 outpoint doesn\'t match DTO cat_txid/cat_vout\n' +
            '- `psbt-output0-mismatch` — PSBT output 0 address doesn\'t match buyerOrdinalsAddress\n' +
            '- `psbt-output1-mismatch` — PSBT output 1 address doesn\'t match sellerPaymentAddress\n' +
            '- `psbt-output2-mismatch` — PSBT change output address doesn\'t match buyerPaymentAddress\n' +
            '- `psbt-price-mismatch` — PSBT output 1 amount ≠ bidSats + postage\n' +
            '- `psbt-*` — other SDK-layer offer-validator rejections\n' +
            '- `ord-lookup-failed` — upstream ord unreachable\n' +
            '- `cat-not-found` — UTXO empty of cats on ord (spent, unknown)\n' +
            '- `cats-bundle-drift` — UTXO carries a different cats set than signed for',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bid_dto_1.CreateBidDto, Object]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('outpoint/:catTxid/:catVout'),
    (0, swagger_1.ApiOperation)({
        summary: 'All active bids on a specific cat UTXO',
        description: 'Returns every bid pinning `catTxid:catVout`, sorted `bidSats` DESC then most-recent ' +
            'first. The seller\'s "who\'s offering what" view. Filtered by the backend\'s network ' +
            'automatically — a mainnet backend never returns testnet bids.',
    }),
    (0, swagger_1.ApiParam)({ name: 'catTxid', description: 'Cat UTXO txid, lowercase 64-hex.' }),
    (0, swagger_1.ApiParam)({ name: 'catVout', description: 'Cat UTXO vout.', example: 0, schema: { type: 'integer', minimum: 0 } }),
    (0, swagger_1.ApiOkResponse)({ type: [bid_dto_1.BidDto] }),
    __param(0, (0, common_1.Param)('catTxid')),
    __param(1, (0, common_1.Param)('catVout', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "findByOutpoint", null);
__decorate([
    (0, common_1.Get)(':itemsPerPage/:currentPage'),
    (0, swagger_1.ApiOperation)({
        summary: 'Browse the bid orderbook',
        description: 'Paginated feed of all active bids across the whole marketplace, most-recent first. ' +
            'Bounded at 100 items per page. No Cache-Control set — edge bypasses cache (bid feed ' +
            'changes per bid/prune).',
    }),
    (0, swagger_1.ApiParam)({ name: 'itemsPerPage', example: 25, schema: { type: 'integer', minimum: 1, maximum: 100 } }),
    (0, swagger_1.ApiParam)({ name: 'currentPage', example: 1, schema: { type: 'integer', minimum: 1 } }),
    (0, swagger_1.ApiOkResponse)({ type: bid_dto_1.PaginatedBidsDto }),
    __param(0, (0, common_1.Param)('itemsPerPage', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('currentPage', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "findPaginated", null);
__decorate([
    (0, common_1.Delete)('outpoint/:catTxid/:catVout'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a bid (server-side; used by the pruner + future buyer-side cancel flow)',
        description: 'Removes the bid uniquely identified by (catTxid, catVout, buyer_ordinals_address). ' +
            'No auth today — the pruner is the primary caller. A future buyer-side cancel flow will ' +
            "require a signature over a 'cancel' message.",
    }),
    (0, swagger_1.ApiParam)({ name: 'catTxid', description: 'Cat UTXO txid.' }),
    (0, swagger_1.ApiParam)({ name: 'catVout', example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'buyer', description: 'Buyer ordinals address (unique-key second half).' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Deleted (or already absent).' }),
    __param(0, (0, common_1.Param)('catTxid')),
    __param(1, (0, common_1.Param)('catVout', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('buyer')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Object]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "delete", null);
exports.BidsController = BidsController = __decorate([
    (0, swagger_1.ApiTags)('bids'),
    (0, common_1.Controller)('api/v1/bids'),
    __metadata("design:paramtypes", [bids_service_1.BidsService])
], BidsController);
//# sourceMappingURL=bids.controller.js.map