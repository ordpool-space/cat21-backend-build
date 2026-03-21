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
exports.HealthDto = exports.StatusDto = exports.CatsPaginatedResultDto = exports.CatDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class CatDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, catNumber: { required: true, type: () => Number }, txHash: { required: true, type: () => String }, blockHash: { required: true, type: () => String }, blockHeight: { required: true, type: () => Number }, mintedAt: { required: true, type: () => String }, mintedBy: { required: true, type: () => String, nullable: true }, fee: { required: true, type: () => Number }, weight: { required: true, type: () => Number }, size: { required: true, type: () => Number }, feeRate: { required: true, type: () => Number }, sat: { required: true, type: () => Number }, value: { required: true, type: () => Number }, category: { required: true, type: () => String }, genesis: { required: true, type: () => Boolean }, catColors: { required: true, type: () => [String] }, male: { required: true, type: () => Boolean }, female: { required: true, type: () => Boolean }, designIndex: { required: true, type: () => Number }, designPose: { required: true, type: () => String }, designExpression: { required: true, type: () => String }, designPattern: { required: true, type: () => String }, designFacing: { required: true, type: () => String }, laserEyes: { required: true, type: () => String }, background: { required: true, type: () => String }, backgroundColors: { required: true, type: () => [String] }, crown: { required: true, type: () => String }, glasses: { required: true, type: () => String }, glassesColors: { required: true, type: () => [String] } };
    }
}
exports.CatDto = CatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Internal database ID (UUID)', example: '9fe2d429-908c-4af9-9b11-4b5882b82ab9' }),
    __metadata("design:type", String)
], CatDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The incremented number of the cat. Cat #0 is the genesis cat.', example: 0 }),
    __metadata("design:type", Number)
], CatDto.prototype, "catNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction hash (hex) where the CAT-21 ordinal was minted', example: '98316dcb21daaa221865208fe0323616ee6dd84e6020b78bc6908e914ac03892' }),
    __metadata("design:type", String)
], CatDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Block hash (hex) of the block containing the mint transaction', example: '000000000000000000018e3ea447b11385e3330348010e1b2418d0d8ae4e0ac7' }),
    __metadata("design:type", String)
], CatDto.prototype, "blockHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Block height where the CAT-21 ordinal was minted', example: 824205 }),
    __metadata("design:type", Number)
], CatDto.prototype, "blockHeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the cat was minted (ISO 8601)', example: '2024-01-03T21:04:46.000Z' }),
    __metadata("design:type", String)
], CatDto.prototype, "mintedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Address that received the first output of the mint transaction. Null for OP_RETURN outputs (cat is free).', example: 'bc1p85ra9kv6a48yvk4mq4hx08wxk6t32tdjw9ylahergexkymsc3uwsdrx6sh' }),
    __metadata("design:type", Object)
], CatDto.prototype, "mintedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total fees paid to process the mint transaction (Unit: sats)', example: 40834 }),
    __metadata("design:type", Number)
], CatDto.prototype, "fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Weight of the mint transaction (Unit: WU — weight units)', example: 705 }),
    __metadata("design:type", Number)
], CatDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total size of the mint transaction (Unit: bytes)', example: 195 }),
    __metadata("design:type", Number)
], CatDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fee rate paid to mint this cat (Unit: sat/vB). Determines the color of the cat.', example: 231.68 }),
    __metadata("design:type", Number)
], CatDto.prototype, "feeRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ordinal satoshi number associated with this cat', example: 596964966600565 }),
    __metadata("design:type", Number)
], CatDto.prototype, "sat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Value of the first output of the mint transaction (Unit: sats)', example: 546 }),
    __metadata("design:type", Number)
], CatDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category based on cat number: sub1k, sub10k, sub50k, sub100k, sub250k, sub500k, sub1M, or empty', example: 'sub1k' }),
    __metadata("design:type", String)
], CatDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is a genesis cat (white or black, probability 0.4%)', example: true }),
    __metadata("design:type", Boolean)
], CatDto.prototype, "genesis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'All colors used to paint the cat (excluding laser eyes and other trait colors)', example: ['#555555', '#d3d3d3', '#ffffff'] }),
    __metadata("design:type", Array)
], CatDto.prototype, "catColors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the cat is male (50% chance)', example: false }),
    __metadata("design:type", Boolean)
], CatDto.prototype, "male", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the cat is female (50% chance)', example: true }),
    __metadata("design:type", Boolean)
], CatDto.prototype, "female", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Design index (0-127), combination of pose, expression, pattern, and facing', example: 24 }),
    __metadata("design:type", Number)
], CatDto.prototype, "designIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pose of the cat', enum: ['Standing', 'Sleeping', 'Pouncing', 'Stalking'], example: 'Standing' }),
    __metadata("design:type", String)
], CatDto.prototype, "designPose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expression of the cat', enum: ['Smile', 'Grumpy', 'Pouting', 'Shy'], example: 'Grumpy' }),
    __metadata("design:type", String)
], CatDto.prototype, "designExpression", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pattern of the cat', enum: ['Solid', 'Striped', 'Eyepatch', 'Half/Half'], example: 'Eyepatch' }),
    __metadata("design:type", String)
], CatDto.prototype, "designPattern", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Facing direction of the cat', enum: ['Left', 'Right'], example: 'Left' }),
    __metadata("design:type", String)
], CatDto.prototype, "designFacing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Laser eyes color (20% chance each), or None', enum: ['Orange', 'Red', 'Green', 'Blue', 'None'], example: 'Red' }),
    __metadata("design:type", String)
], CatDto.prototype, "laserEyes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Background type (25% chance each)', enum: ['Block9', 'Cyberpunk', 'Whitepaper', 'Orange'], example: 'Orange' }),
    __metadata("design:type", String)
], CatDto.prototype, "background", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Colors used to generate the background', example: ['#ff9900'] }),
    __metadata("design:type", Array)
], CatDto.prototype, "backgroundColors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Crown type (10% chance to have one)', enum: ['Gold', 'Diamond', 'None'], example: 'None' }),
    __metadata("design:type", String)
], CatDto.prototype, "crown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Glasses type (10% chance each, 3D and Nouns only without laser eyes)', enum: ['Black', 'Cool', '3D', 'Nouns', 'None'], example: 'None' }),
    __metadata("design:type", String)
], CatDto.prototype, "glasses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Colors used to paint the glasses (empty if no glasses)', example: [] }),
    __metadata("design:type", Array)
], CatDto.prototype, "glassesColors", void 0);
class CatsPaginatedResultDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { cats: { required: true, type: () => [require("./cat.dto").CatDto] }, total: { required: true, type: () => Number }, currentPage: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number } };
    }
}
exports.CatsPaginatedResultDto = CatsPaginatedResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CatDto], description: 'Array of cats for the current page' }),
    __metadata("design:type", Array)
], CatsPaginatedResultDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of cats across all pages', example: 63732 }),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number (1-based)', example: 1 }),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of cats per page', example: 48 }),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "itemsPerPage", void 0);
class StatusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { totalCats: { required: true, type: () => Number }, lastSyncedCatNumber: { required: true, type: () => Number } };
    }
}
exports.StatusDto = StatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of indexed cats', example: 63732 }),
    __metadata("design:type", Number)
], StatusDto.prototype, "totalCats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cat number of the last synced cat (-1 if none)', example: 63731 }),
    __metadata("design:type", Number)
], StatusDto.prototype, "lastSyncedCatNumber", void 0);
class HealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, timestamp: { required: true, type: () => String }, uptimeSec: { required: true, type: () => Number }, version: { required: true, type: () => String } };
    }
}
exports.HealthDto = HealthDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service status', example: 'ok' }),
    __metadata("design:type", String)
], HealthDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current server time (ISO 8601)', example: '2026-03-20T18:00:00.000Z' }),
    __metadata("design:type", String)
], HealthDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Server uptime in seconds', example: 3600 }),
    __metadata("design:type", Number)
], HealthDto.prototype, "uptimeSec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Backend version', example: '0.1.0' }),
    __metadata("design:type", String)
], HealthDto.prototype, "version", void 0);
//# sourceMappingURL=cat.dto.js.map