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
exports.CatsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const sharp = require("sharp");
const categories_1 = require("../shared/categories");
const cats_service_1 = require("./cats.service");
const cat_dto_1 = require("./dto/cat.dto");
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=86400, s-maxage=31536000, immutable';
const CAT_DETAIL_CACHE_CONTROL = 'public, max-age=60, s-maxage=300';
function cacheControlFor(cat) {
    const range = categories_1.CATEGORY_RANGES[cat.category];
    const closed = cat.rarityRank !== null &&
        cat.rarityCategoryTotal !== null &&
        range !== undefined &&
        cat.rarityCategoryTotal >= range[2];
    return closed ? IMMUTABLE_CACHE_CONTROL : CAT_DETAIL_CACHE_CONTROL;
}
let CatsController = class CatsController {
    constructor(catsService) {
        this.catsService = catsService;
    }
    getHealth() {
        return this.catsService.getHealth();
    }
    async getExtendedHealth(reply) {
        reply.header('Cache-Control', 'no-store');
        const health = await this.catsService.getExtendedHealth();
        if (health.status === 'down') {
            throw new common_1.ServiceUnavailableException(health);
        }
        return health;
    }
    async getStatus() {
        return this.catsService.getStatus();
    }
    async getCatByNumber(catNumber, reply) {
        const cat = await this.catsService.getCatByNumber(catNumber);
        if (!cat) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Cat #${catNumber} not found`);
        }
        reply.header('Cache-Control', cacheControlFor(cat));
        return cat;
    }
    async getCatByTxHash(txHash, reply) {
        if (!/^[a-f0-9]{64}$/.test(txHash)) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Invalid tx hash`);
        }
        const cat = await this.catsService.getCatByTxHash(txHash);
        if (!cat) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Cat with tx ${txHash} not found`);
        }
        reply.header('Cache-Control', cacheControlFor(cat));
        return cat;
    }
    async getCatSvg(catNumber, reply) {
        const svg = await this.catsService.getCatSvg(catNumber);
        if (!svg) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Cat #${catNumber} not found`);
        }
        return reply
            .header('Cache-Control', IMMUTABLE_CACHE_CONTROL)
            .header('Content-Type', 'image/svg+xml')
            .header('Content-Disposition', `inline; filename="cat21-${catNumber}.svg"`)
            .send(svg);
    }
    async getCatWebp(catNumber, reply) {
        const svg = await this.catsService.getCatSvg(catNumber);
        if (!svg) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Cat #${catNumber} not found`);
        }
        try {
            const webp = await sharp(Buffer.from(svg))
                .resize(440, 440)
                .webp({ lossless: true })
                .toBuffer();
            return reply
                .header('Cache-Control', IMMUTABLE_CACHE_CONTROL)
                .header('Content-Type', 'image/webp')
                .header('Content-Disposition', `inline; filename="cat21-${catNumber}.webp"`)
                .send(webp);
        }
        catch {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.InternalServerErrorException(`Failed to render image for cat #${catNumber}`);
        }
    }
    async getCats(itemsPerPage, currentPage) {
        return this.catsService.getCats(Math.max(1, Math.min(itemsPerPage, 100)), Math.max(1, currentPage));
    }
    async getCatNumbers(itemsPerPage, currentPage) {
        return this.catsService.getCatNumbers(Math.max(1, Math.min(itemsPerPage, 100)), Math.max(1, currentPage));
    }
    async randomCat(query, reply) {
        reply.header('Cache-Control', 'no-store');
        const catNumber = await this.catsService.randomCatNumber(toSearchFilters(query));
        if (catNumber === null) {
            throw new common_1.NotFoundException('No cat matches the supplied filters');
        }
        return { catNumber };
    }
    async searchCats(itemsPerPage, currentPage, query) {
        return this.catsService.searchCatNumbers(toSearchFilters(query), Math.max(1, Math.min(itemsPerPage, 100)), Math.max(1, currentPage));
    }
};
exports.CatsController = CatsController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check', description: 'Lean liveness probe — confirms the Node process is alive. Used by Koyeb container health checks; does NOT query the database. For truthful service health (DB reachability, sync freshness), use /api/extendedHealth.' }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.HealthDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").HealthDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", cat_dto_1.HealthDto)
], CatsController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('extendedHealth'),
    (0, swagger_1.ApiOperation)({ summary: 'Extended health check', description: 'Truthful service health: runs a live SELECT 1 against the database and reports sync freshness. Returns 200 when the DB is reachable (even if sync is stalled — status is "degraded"), or 503 when the DB ping fails ("down"). Intended for external monitors and humans, not for container liveness probes.' }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.ExtendedHealthDto, description: 'DB reachable. status is "ok" when sync is fresh or "degraded" when stalled.' }),
    (0, swagger_1.ApiServiceUnavailableResponse)({ type: cat_dto_1.ExtendedHealthDto, description: 'DB unreachable. The response body is an ExtendedHealthDto with status: "down" and database.error set.' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").ExtendedHealthDto }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getExtendedHealth", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync status', description: 'Returns the total number of indexed cats and the last synced cat number.' }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.StatusDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").StatusDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('cat/:catNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cat by number', description: 'Returns a single CAT-21 cat with all traits by its cat number (0-based).' }),
    (0, swagger_1.ApiParam)({ name: 'catNumber', description: 'Cat number (0-based)', example: 0 }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.CatDto, description: 'The cat with all computed traits' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No cat found with this number' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").CatDto }),
    __param(0, (0, common_1.Param)('catNumber', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCatByNumber", null);
__decorate([
    (0, common_1.Get)('tx/:txHash'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cat by transaction hash', description: 'Returns a single CAT-21 cat by the mint transaction hash (64-char hex).' }),
    (0, swagger_1.ApiParam)({ name: 'txHash', description: 'Transaction hash (64-char hex)', example: '98316dcb21daaa221865208fe0323616ee6dd84e6020b78bc6908e914ac03892' }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.CatDto, description: 'The cat with all computed traits' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No cat found with this transaction hash' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").CatDto }),
    __param(0, (0, common_1.Param)('txHash')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCatByTxHash", null);
__decorate([
    (0, common_1.Get)('cat/:catNumber/image.svg'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cat SVG image', description: 'Returns the cat as an SVG image. The image is deterministically generated from the transaction and block hash.' }),
    (0, swagger_1.ApiParam)({ name: 'catNumber', description: 'Cat number (0-based)', example: 0 }),
    (0, swagger_1.ApiProduces)('image/svg+xml'),
    (0, swagger_1.ApiOkResponse)({ description: 'SVG image of the cat' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No cat found with this number' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('catNumber', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCatSvg", null);
__decorate([
    (0, common_1.Get)('cat/:catNumber/image.webp'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cat WebP image', description: 'Returns the cat as a lossless WebP image (440x440). Optimized for gallery thumbnails.' }),
    (0, swagger_1.ApiParam)({ name: 'catNumber', description: 'Cat number (0-based)', example: 0 }),
    (0, swagger_1.ApiProduces)('image/webp'),
    (0, swagger_1.ApiOkResponse)({ description: 'WebP image of the cat' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No cat found with this number' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('catNumber', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCatWebp", null);
__decorate([
    (0, common_1.Get)('cats/:itemsPerPage/:currentPage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated cat list', description: 'Returns a paginated list of cats with all traits, sorted by newest first. Max 100 items per page. Use /api/cats/numbers/ for a lightweight alternative.' }),
    (0, swagger_1.ApiParam)({ name: 'itemsPerPage', description: 'Number of cats per page (max 100)', example: 48 }),
    (0, swagger_1.ApiParam)({ name: 'currentPage', description: 'Page number (1-based)', example: 1 }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.CatsPaginatedResultDto, description: 'Paginated list of cats with total count' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").CatsPaginatedResultDto }),
    __param(0, (0, common_1.Param)('itemsPerPage', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('currentPage', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCats", null);
__decorate([
    (0, common_1.Get)('cats/numbers/:itemsPerPage/:currentPage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated cat numbers', description: 'Returns only cat numbers (no traits), sorted by newest first. Max 100 items per page. Ideal for gallery views where only thumbnails are needed.' }),
    (0, swagger_1.ApiParam)({ name: 'itemsPerPage', description: 'Number of cats per page (max 100)', example: 48 }),
    (0, swagger_1.ApiParam)({ name: 'currentPage', description: 'Page number (1-based)', example: 1 }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.CatNumbersPaginatedResultDto, description: 'Paginated list of cat numbers with total count' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").CatNumbersPaginatedResultDto }),
    __param(0, (0, common_1.Param)('itemsPerPage', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('currentPage', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "getCatNumbers", null);
__decorate([
    (0, common_1.Get)('cats/search/random'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 30 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Pick one random cat matching the supplied trait filters',
        description: 'Returns a single random cat number from the set that matches the same ' +
            'filter parameters as /cats/search. With no filters it picks a random ' +
            'cat from the entire collection. Returns 404 if no cat matches. ' +
            'Rate-limited to 30 requests per minute per IP.',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'A single random matching cat number',
        schema: { type: 'object', properties: { catNumber: { type: 'number', example: 42 } } },
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'No cat matches the supplied filters' }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Rate limit exceeded — wait a minute and try again' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cat_dto_1.CatSearchQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "randomCat", null);
__decorate([
    (0, common_1.Get)('cats/search/:itemsPerPage/:currentPage'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search cats by traits',
        description: 'Returns paginated cat numbers matching the supplied trait filters. ' +
            'Each filter accepts a comma-separated list of values (OR within a filter). ' +
            'Multiple filters are AND-combined. An empty filter (no query params) ' +
            'returns the full result set, equivalent to /cats/numbers/.',
    }),
    (0, swagger_1.ApiParam)({ name: 'itemsPerPage', description: 'Number of cats per page (max 100)', example: 48 }),
    (0, swagger_1.ApiParam)({ name: 'currentPage', description: 'Page number (1-based)', example: 1 }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.CatNumbersPaginatedResultDto, description: 'Paginated list of matching cat numbers with total count' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").CatNumbersPaginatedResultDto }),
    __param(0, (0, common_1.Param)('itemsPerPage', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('currentPage', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, cat_dto_1.CatSearchQueryDto]),
    __metadata("design:returntype", Promise)
], CatsController.prototype, "searchCats", null);
exports.CatsController = CatsController = __decorate([
    (0, swagger_1.ApiTags)('api'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [cats_service_1.CatsService])
], CatsController);
function toSearchFilters(q) {
    return {
        eyes: splitCsv(q.eyes),
        pose: splitCsv(q.pose),
        expression: splitCsv(q.expression),
        pattern: splitCsv(q.pattern),
        background: splitCsv(q.background),
        crown: splitCsv(q.crown),
        glasses: splitCsv(q.glasses),
        category: splitCsv(q.category),
        gender: splitCsv(q.gender),
        color: splitCsv(q.color),
        genesis: splitCsv(q.genesis),
        rarity: splitCsv(q.rarity),
    };
}
function splitCsv(value) {
    if (!value)
        return undefined;
    const parts = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 32);
    return parts.length > 0 ? parts : undefined;
}
//# sourceMappingURL=cats.controller.js.map