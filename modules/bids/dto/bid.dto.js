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
exports.PaginatedBidsDto = exports.BidDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class BidDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, network: { required: true, type: () => String }, catTxid: { required: true, type: () => String }, catVout: { required: true, type: () => Number }, cats: { required: true, type: () => [Number] }, headlineCatNumber: { required: true, type: () => Number }, bidSats: { required: true, type: () => Number }, buyerOrdinalsAddress: { required: true, type: () => String }, buyerPaymentAddress: { required: true, type: () => String }, sellerPaymentAddress: { required: true, type: () => String }, psbtBase64: { required: true, type: () => String }, createdAt: { required: true, type: () => String } };
    }
}
exports.BidDto = BidDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Server-assigned UUID (v4).', example: 'a1b2c3d4-...' }),
    __metadata("design:type", String)
], BidDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bitcoin network.',
        example: 'mainnet',
        enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'],
    }),
    __metadata("design:type", String)
], BidDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df' }),
    __metadata("design:type", String)
], BidDto.prototype, "catTxid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], BidDto.prototype, "catVout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cats on the UTXO at bid time.', example: [42], type: [Number] }),
    __metadata("design:type", Array)
], BidDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Headline cat number for display.', example: 42 }),
    __metadata("design:type", Number)
], BidDto.prototype, "headlineCatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bid price in sats.', example: 21_000 }),
    __metadata("design:type", Number)
], BidDto.prototype, "bidSats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9' }),
    __metadata("design:type", String)
], BidDto.prototype, "buyerOrdinalsAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx' }),
    __metadata("design:type", String)
], BidDto.prototype, "buyerPaymentAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm' }),
    __metadata("design:type", String)
], BidDto.prototype, "sellerPaymentAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The half-signed PSBT (base64). Any accepter (current seller of the cat UTXO) can ' +
            'signature-input-0 + broadcast to close the trade.',
        example: 'cHNidP8BAP0Y...',
    }),
    __metadata("design:type", String)
], BidDto.prototype, "psbtBase64", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 UTC timestamp when the bid was posted.', example: '2026-07-22T10:15:30.123Z' }),
    __metadata("design:type", String)
], BidDto.prototype, "createdAt", void 0);
class PaginatedBidsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { total: { required: true, type: () => Number }, currentPage: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number }, items: { required: true, type: () => [require("./bid.dto").BidDto] } };
    }
}
exports.PaginatedBidsDto = PaginatedBidsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total active bids on the orderbook.', example: 137 }),
    __metadata("design:type", Number)
], PaginatedBidsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page (1-indexed).', example: 1 }),
    __metadata("design:type", Number)
], PaginatedBidsDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items per page.', example: 25 }),
    __metadata("design:type", Number)
], PaginatedBidsDto.prototype, "itemsPerPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BidDto] }),
    __metadata("design:type", Array)
], PaginatedBidsDto.prototype, "items", void 0);
//# sourceMappingURL=bid.dto.js.map