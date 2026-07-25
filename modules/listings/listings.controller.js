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
exports.ListingsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const cat21_session_guard_1 = require("../shared/cat21-session.guard");
const create_listing_dto_1 = require("./dto/create-listing.dto");
const listing_dto_1 = require("./dto/listing.dto");
const listings_service_1 = require("./listings.service");
const SINGLE_LISTING_CACHE_CONTROL = 'public, max-age=60, s-maxage=60';
const NO_STORE = 'no-store';
let ListingsController = class ListingsController {
    constructor(listings) {
        this.listings = listings;
    }
    async create(dto, sessionAddress, reply) {
        try {
            const created = await this.listings.create(dto, sessionAddress);
            reply.header('Cache-Control', NO_STORE);
            return created;
        }
        catch (err) {
            reply.header('Cache-Control', NO_STORE);
            throw err;
        }
    }
    async findByCatNumber(catNumber, reply) {
        const listing = await this.listings.findByCatNumber(catNumber);
        if (!listing) {
            reply.header('Cache-Control', NO_STORE);
            throw new common_1.NotFoundException(`No active listing for cat #${catNumber}`);
        }
        reply.header('Cache-Control', SINGLE_LISTING_CACHE_CONTROL);
        return listing;
    }
    async findPaginated(itemsPerPage, currentPage) {
        return this.listings.findPaginated(itemsPerPage, currentPage);
    }
    async delete(catNumber, sessionAddress, reply) {
        await this.listings.deleteByCatNumberIfOwnedBy(catNumber, sessionAddress);
        reply.header('Cache-Control', NO_STORE);
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.UseGuards)(cat21_session_guard_1.Cat21SessionGuard, throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Create or overwrite a cat listing',
        description: "Publishes a sell intent to the CAT-21 orderbook. Authentication is header-based " +
            "via the Cat21SessionGuard (X-Cat21-Session-Address / -Valid-Until / -Signature). " +
            "The session address must match `dto.ordinalsAddress`. The server cross-checks " +
            "with ord that the address really owns cat #`catNumber` at outpoint `catTxid:catVout` " +
            "RIGHT NOW. Any tamper is rejected with a specific error code. cat_number is unique " +
            "— re-POSTing for a cat OVERWRITES the previous listing (price change flow). " +
            "Rate-limited to 5/min/IP.",
    }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Exceeded 5 listing publishes per minute per IP.' }),
    (0, swagger_1.ApiCreatedResponse)({ type: listing_dto_1.ListingDto }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Rejection with a code:\n' +
            '- `network-mismatch` — DTO network doesn\'t match this backend\'s deployment\n' +
            '- `session-address-mismatch` — session address ≠ dto.ordinalsAddress\n' +
            '- `headline-not-in-bundle` — catNumber not in cats[]\n' +
            '- `ord-lookup-failed` — upstream ord unreachable\n' +
            '- `cat-not-found` — ord does not know this cat (or it sits at an unspendable output)\n' +
            '- `cats-bundle-drift` — signed cats bundle no longer matches the UTXO\n' +
            '- `not-current-owner` — session address is not the current on-chain owner\n' +
            '- `outpoint-mismatch` — cat has moved; re-submit against the current UTXO',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, cat21_session_guard_1.Cat21SessionAddress)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_listing_dto_1.CreateListingDto, String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('cat/:catNumber'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the active listing for a cat',
        description: 'Returns the active seller-signed listing for cat #catNumber, or 404 if the cat is ' +
            'not currently listed. External clients can re-verify the returned signature offline ' +
            'via ordpool-sdk `verifyListingSignature` — no trust in cat21-indexer required.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'catNumber',
        description: 'Cat number (0 = Genesis Cat).',
        example: 42,
        schema: { type: 'integer', minimum: 0 },
    }),
    (0, swagger_1.ApiOkResponse)({ type: listing_dto_1.ListingDto }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No active listing for this cat.' }),
    __param(0, (0, common_1.Param)('catNumber', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findByCatNumber", null);
__decorate([
    (0, common_1.Get)(':itemsPerPage/:currentPage'),
    (0, swagger_1.ApiOperation)({
        summary: 'Browse the CAT-21 orderbook',
        description: 'Paginated feed of all active listings, most-recently-signed first. Bounded at ' +
            '100 items per page. No Cache-Control set — edge bypasses cache (orderbook changes ' +
            'per listing/prune).',
    }),
    (0, swagger_1.ApiParam)({
        name: 'itemsPerPage',
        description: 'Page size, 1..100.',
        example: 25,
        schema: { type: 'integer', minimum: 1, maximum: 100 },
    }),
    (0, swagger_1.ApiParam)({
        name: 'currentPage',
        description: 'Page number, 1-indexed.',
        example: 1,
        schema: { type: 'integer', minimum: 1 },
    }),
    (0, swagger_1.ApiOkResponse)({ type: listing_dto_1.PaginatedListingsDto }),
    __param(0, (0, common_1.Param)('itemsPerPage', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('currentPage', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findPaginated", null);
__decorate([
    (0, common_1.Delete)('cat/:catNumber'),
    (0, common_1.HttpCode)(204),
    (0, common_1.UseGuards)(cat21_session_guard_1.Cat21SessionGuard, throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a listing (seller unlists)',
        description: 'Removes the listing for cat #catNumber iff the session token proves control of ' +
            "the listing's `ordinalsAddress`. The pruner uses ListingsService directly and is " +
            "unaffected by this route's auth.",
    }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Deleted (or already absent — a wrong-owner request also 204s without leaking whether the row existed).' }),
    __param(0, (0, common_1.Param)('catNumber', common_1.ParseIntPipe)),
    __param(1, (0, cat21_session_guard_1.Cat21SessionAddress)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "delete", null);
exports.ListingsController = ListingsController = __decorate([
    (0, swagger_1.ApiTags)('listings'),
    (0, common_1.Controller)('api/v1/listings'),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], ListingsController);
//# sourceMappingURL=listings.controller.js.map