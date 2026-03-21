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
const sharp = require("sharp");
const cats_service_1 = require("./cats.service");
const cat_dto_1 = require("./dto/cat.dto");
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=31536000, immutable';
let CatsController = class CatsController {
    constructor(catsService) {
        this.catsService = catsService;
    }
    getHealth() {
        return this.catsService.getHealth();
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
        reply.header('Cache-Control', CACHE_CONTROL);
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
        reply.header('Cache-Control', CACHE_CONTROL);
        return cat;
    }
    async getCatSvg(catNumber, reply) {
        const svg = await this.catsService.getCatSvg(catNumber);
        if (!svg) {
            reply.header('Cache-Control', 'no-store');
            throw new common_1.NotFoundException(`Cat #${catNumber} not found`);
        }
        return reply
            .header('Cache-Control', CACHE_CONTROL)
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
                .header('Cache-Control', CACHE_CONTROL)
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
};
exports.CatsController = CatsController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check', description: 'Returns service health info including uptime and version.' }),
    (0, swagger_1.ApiOkResponse)({ type: cat_dto_1.HealthDto }),
    openapi.ApiResponse({ status: 200, type: require("./dto/cat.dto").HealthDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", cat_dto_1.HealthDto)
], CatsController.prototype, "getHealth", null);
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
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated cat list', description: 'Returns a paginated list of cats, sorted by newest first. Max 100 items per page.' }),
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
exports.CatsController = CatsController = __decorate([
    (0, swagger_1.ApiTags)('api'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [cats_service_1.CatsService])
], CatsController);
//# sourceMappingURL=cats.controller.js.map