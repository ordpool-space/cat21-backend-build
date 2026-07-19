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
        return { catNumber: { required: true, type: () => Number, minimum: 0 }, network: { required: true, enum: ["mainnet", "testnet3", "testnet4", "signet", "regtest"], enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'] }, askSats: { required: true, type: () => Number, minimum: 1, maximum: core_1.MAX_ASK_SATS }, payTo: { required: true, type: () => String, maxLength: 128 }, catTxid: { required: true, type: () => String, pattern: "^[0-9a-f]{64}$" }, catVout: { required: true, type: () => Number, minimum: 0 }, ordinalsAddress: { required: true, type: () => String, maxLength: 128 }, signedAt: { required: true, type: () => Number, minimum: 1 }, signature: { required: true, type: () => String, maxLength: 512 } };
    }
}
exports.CreateListingDto = CreateListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cat number the listing covers. 0 = Genesis Cat.',
        example: 42,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "catNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bitcoin network the seller signed against. Binds the signature to a specific network — a testnet-signed listing bytes replayed against mainnet is rejected as `signature-does-not-verify`. Full enum matches ordpool-sdk `Network`; per-deployment the backend only accepts one of these via `network-mismatch`.',
        example: 'mainnet',
        enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest']),
    __metadata("design:type", String)
], CreateListingDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `Asking price in sats. Positive integer, capped at MAX_ASK_SATS (${core_1.MAX_ASK_SATS} = 21 M BTC — total supply). Any value above is rejected as nonsense.`,
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
        description: "Seller's PAYMENT address (where sale proceeds land). Must be a valid Bitcoin address; " +
            "the signature commits to this exact string. Never populated from an on-chain owner " +
            'lookup — that returns the ordinals address, wrong context.',
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
        description: "vout of the cat UTXO. Almost always 0 (cat sits on output 0 per FIFO), but non-zero permitted.",
        example: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "catVout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Seller's ORDINALS address (where the cat sits, per ordinal theory FIFO). MUST match the " +
            "on-chain owner at insert time — the server cross-checks this against ord's live inscription " +
            'lookup before persisting. BIP-322 signature must verify against this address.',
        example: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateListingDto.prototype, "ordinalsAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unix seconds at signing time. Server rejects listings whose `signedAt` is more than ' +
            '24h in the past or 1h in the future (loose sanity window to catch obviously-stale ' +
            'submissions and clock-skewed spoofing attempts).',
        example: 1_700_000_000,
        minimum: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "signedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Base64-encoded BIP-322 "simple" signature witness. For P2TR ordinals addresses (the only ' +
            'kind cats live on today) this is either a raw 64-byte schnorr signature OR the wrapped ' +
            "witness format Xverse/Leather/cat21-wallet emit (`numItems || sigLen || sigBytes`). Both " +
            'accepted.',
        example: 'AUHd69PrJQEv+oKTfZ8l+WROBHuy9HKrbFCJu7U1iK2iiEy1vMU5EfMtjc+VSHM7aU0SDbak5IUZRVno2P5mjSafAQ==',
        maxLength: 512,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], CreateListingDto.prototype, "signature", void 0);
//# sourceMappingURL=create-listing.dto.js.map