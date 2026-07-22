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
exports.PaginatedListingsDto = exports.ListingDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class ListingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, catNumber: { required: true, type: () => Number }, cats: { required: true, type: () => [Number] }, network: { required: true, type: () => String }, askSats: { required: true, type: () => Number }, payTo: { required: true, type: () => String }, catTxid: { required: true, type: () => String }, catVout: { required: true, type: () => Number }, ordinalsAddress: { required: true, type: () => String }, signedAt: { required: true, type: () => Number }, signature: { required: true, type: () => String }, createdAt: { required: true, type: () => String } };
    }
}
exports.ListingDto = ListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Server-assigned UUID (v4).',
        example: 'b3c2c1d8-4e7f-4b8a-9c5d-6f7a8b9c0d1e',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Headline cat number (member of `cats`).', example: 42 }),
    __metadata("design:type", Number)
], ListingDto.prototype, "catNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Every cat currently on the UTXO the listing pins. Sorted ascending. Load-bearing: ' +
            'buyer pays for the whole bundle.',
        example: [42],
        type: [Number],
    }),
    __metadata("design:type", Array)
], ListingDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bitcoin network the seller signed against.',
        example: 'mainnet',
        enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'],
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Asking price in sats.', example: 21_000 }),
    __metadata("design:type", Number)
], ListingDto.prototype, "askSats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Seller's payment address.",
        example: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "payTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Cat UTXO txid the listing was pinned to at signing time.",
        example: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "catTxid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cat UTXO vout.', example: 0 }),
    __metadata("design:type", Number)
], ListingDto.prototype, "catVout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Seller's ordinals address at signing time.",
        example: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "ordinalsAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix seconds at signing time.', example: 1_700_000_000 }),
    __metadata("design:type", Number)
], ListingDto.prototype, "signedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Base64 BIP-322 signature — re-verifiable offline via ordpool-sdk `verifyListingSignature`.',
        example: 'AUHd69PrJQEv+oKTfZ8l+WROBHuy9HKrbFCJu7U1iK2iiEy1vMU5EfMtjc+VSHM7aU0SDbak5IUZRVno2P5mjSafAQ==',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO-8601 UTC timestamp when the row was inserted server-side.',
        example: '2026-07-19T10:15:30.123Z',
    }),
    __metadata("design:type", String)
], ListingDto.prototype, "createdAt", void 0);
class PaginatedListingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { total: { required: true, type: () => Number }, currentPage: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number }, items: { required: true, type: () => [require("./listing.dto").ListingDto] } };
    }
}
exports.PaginatedListingsDto = PaginatedListingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total active listings on the orderbook.', example: 137 }),
    __metadata("design:type", Number)
], PaginatedListingsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page (1-indexed).', example: 1 }),
    __metadata("design:type", Number)
], PaginatedListingsDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items per page.', example: 25 }),
    __metadata("design:type", Number)
], PaginatedListingsDto.prototype, "itemsPerPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ListingDto] }),
    __metadata("design:type", Array)
], PaginatedListingsDto.prototype, "items", void 0);
//# sourceMappingURL=listing.dto.js.map