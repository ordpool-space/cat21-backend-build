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
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "catNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "blockHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "blockHeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "mintedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], CatDto.prototype, "mintedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "feeRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "sat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CatDto.prototype, "genesis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CatDto.prototype, "catColors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CatDto.prototype, "male", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CatDto.prototype, "female", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatDto.prototype, "designIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "designPose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "designExpression", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "designPattern", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "designFacing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "laserEyes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "background", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CatDto.prototype, "backgroundColors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "crown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CatDto.prototype, "glasses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CatDto.prototype, "glassesColors", void 0);
class CatsPaginatedResultDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { cats: { required: true, type: () => [require("./cat.dto").CatDto] }, total: { required: true, type: () => Number }, currentPage: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number } };
    }
}
exports.CatsPaginatedResultDto = CatsPaginatedResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CatDto] }),
    __metadata("design:type", Array)
], CatsPaginatedResultDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CatsPaginatedResultDto.prototype, "itemsPerPage", void 0);
class StatusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { totalCats: { required: true, type: () => Number }, lastSyncedCatNumber: { required: true, type: () => Number } };
    }
}
exports.StatusDto = StatusDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], StatusDto.prototype, "totalCats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], StatusDto.prototype, "lastSyncedCatNumber", void 0);
class HealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, timestamp: { required: true, type: () => String }, uptimeSec: { required: true, type: () => Number }, version: { required: true, type: () => String } };
    }
}
exports.HealthDto = HealthDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HealthDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HealthDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HealthDto.prototype, "uptimeSec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HealthDto.prototype, "version", void 0);
//# sourceMappingURL=cat.dto.js.map