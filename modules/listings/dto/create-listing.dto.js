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
exports.CreateListingDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const core_1 = require("ordpool-sdk/core");
class CreateListingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { catNumber: { required: true, type: () => Number, minimum: 0 }, cats: { required: true, type: () => [Number], minimum: 0, uniqueItems: true, minItems: 1 }, network: { required: true, enum: ["mainnet", "testnet3", "testnet4", "signet", "regtest"], enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'] }, askSats: { required: true, type: () => Number, minimum: 1, maximum: core_1.MAX_ASK_SATS }, payTo: { required: true, type: () => String, maxLength: 128 }, catTxid: { required: true, type: () => String, pattern: "^[0-9a-f]{64}$" }, catVout: { required: true, type: () => Number, minimum: 0 }, ordinalsAddress: { required: true, type: () => String, maxLength: 128 } };
    }
}
exports.CreateListingDto = CreateListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Headline cat number for display. Must be a member of `cats`. 0 = Genesis Cat.',
        example: 42,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "catNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Every cat currently riding on the UTXO (`catTxid:catVout`). Sorted ascending, ' +
            'deduped. Backend cross-checks against ord\'s `/output/<outpoint>` at insert time ' +
            'and rejects on drift with code `cats-bundle-drift`.',
        example: [42],
        type: [Number],
        minItems: 1,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(0, { each: true }),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bitcoin network. Backend rejects mismatched network via `network-mismatch`.',
        example: 'mainnet',
        enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest']),
    __metadata("design:type", String)
], CreateListingDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `Asking price in sats. Positive integer, capped at MAX_ASK_SATS (${core_1.MAX_ASK_SATS} = 21M BTC).`,
        example: 21_000,
        minimum: 1,
        maximum: core_1.MAX_ASK_SATS,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(core_1.MAX_ASK_SATS),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "askSats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Seller's PAYMENT address (where sale proceeds land). Never populated from " +
            'an on-chain owner lookup — that returns the ordinals address, wrong context.',
        example: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateListingDto.prototype, "payTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The cat UTXO's txid, lowercase 64-hex.",
        example: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df',
        pattern: '^[0-9a-f]{64}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{64}$/, { message: 'catTxid must be 64-char lowercase hex' }),
    __metadata("design:type", String)
], CreateListingDto.prototype, "catTxid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "vout of the cat UTXO. Almost always 0 (FIFO), non-zero permitted.",
        example: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "catVout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Seller's ORDINALS address (where the cat sits, per ordinal theory FIFO). MUST " +
            "match the on-chain owner AND the session-token X-Cat21-Session-Address header.",
        example: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateListingDto.prototype, "ordinalsAddress", void 0);
//# sourceMappingURL=create-listing.dto.js.map