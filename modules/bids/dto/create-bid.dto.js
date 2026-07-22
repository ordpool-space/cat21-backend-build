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
exports.CreateBidDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const core_1 = require("ordpool-sdk/core");
class CreateBidDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { network: { required: true, enum: ["mainnet", "testnet3", "testnet4", "signet", "regtest"], enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'] }, catTxid: { required: true, type: () => String, pattern: "^[0-9a-f]{64}$" }, catVout: { required: true, type: () => Number, minimum: 0 }, cats: { required: true, type: () => [Number], minimum: 0, uniqueItems: true, minItems: 1 }, headlineCatNumber: { required: true, type: () => Number, minimum: 0 }, bidSats: { required: true, type: () => Number, minimum: 1, maximum: core_1.MAX_ASK_SATS }, buyerOrdinalsAddress: { required: true, type: () => String, maxLength: 128 }, buyerPaymentAddress: { required: true, type: () => String, maxLength: 128 }, sellerPaymentAddress: { required: true, type: () => String, maxLength: 128 }, psbtBase64: { required: true, type: () => String, maxLength: 32768 } };
    }
}
exports.CreateBidDto = CreateBidDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bitcoin network the bid targets. Must match the backend deployment; a testnet-signed ' +
            'PSBT sent to the mainnet backend is rejected as `network-mismatch`.',
        example: 'mainnet',
        enum: ['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['mainnet', 'testnet3', 'testnet4', 'signet', 'regtest']),
    __metadata("design:type", String)
], CreateBidDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Cat UTXO's txid the buyer's PSBT input 0 targets. Lowercase 64-hex.",
        example: 'ab49227cce490e2137872f7d08924187ee4f4bc7e8b3bda7ac63d7bba1d897df',
        pattern: '^[0-9a-f]{64}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{64}$/, { message: 'catTxid must be 64-char lowercase hex' }),
    __metadata("design:type", String)
], CreateBidDto.prototype, "catTxid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'vout of the cat UTXO.', example: 0, minimum: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateBidDto.prototype, "catVout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cats on the UTXO at bid time (buyer-observed snapshot). Sorted ascending, deduped. ' +
            "Backend cross-checks against ord's live `/output/<outpoint>` and rejects on drift " +
            'with `cats-bundle-drift` — the buyer must re-observe and re-bid if the bundle has ' +
            'changed since they built the PSBT.',
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
], CreateBidDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Headline cat number for display (member of `cats`). Same presentational choice as ' +
            'listings — usually min(cats) but bid UIs may choose any bundle member.',
        example: 42,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateBidDto.prototype, "headlineCatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Bid price in sats. What the seller receives (PSBT output 1's amount minus the postage " +
            'top-up). Positive integer, capped at MAX_ASK_SATS. Backend re-derives from the PSBT ' +
            'and rejects on mismatch.',
        example: 21_000,
        minimum: 1,
        maximum: core_1.MAX_ASK_SATS,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(core_1.MAX_ASK_SATS),
    __metadata("design:type", Number)
], CreateBidDto.prototype, "bidSats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Buyer's ORDINALS address — the cat lands here (PSBT output 0). THIS is the buyer " +
            "identity for the uniqueness gate. A different PSBT that routes the cat to the same " +
            'ordinals address is the same buyer and replaces the previous bid.',
        example: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxq7pkrz9',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateBidDto.prototype, "buyerOrdinalsAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Buyer's PAYMENT address — where the buyer's change output goes (PSBT output 2, when " +
            'above dust). Displayed to the accepter for context; not part of the uniqueness key.',
        example: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateBidDto.prototype, "buyerPaymentAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Where the sale proceeds go (PSBT output 1). Baked into the buyer-signed PSBT bytes; ' +
            'if the seller has moved to a new payment wallet since the buyer built the bid, THEY ' +
            "have to accept it or refuse — the bid's output is immutable.",
        example: 'bc1qz69ej270c3q9qvgt822t6pm3zdksk2x35j2jlm',
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateBidDto.prototype, "sellerPaymentAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Buyer's half-signed PSBT, base64-encoded. Input 0 is the seller's cat UTXO (unsigned; " +
            'the seller signs it at accept time). Inputs 1..N are buyer-owned, SIGHASH_ALL-signed. ' +
            "Outputs are (0) cat → buyer ordinals, (1) sats → seller payment, (2) change → buyer " +
            "payment. This is the artifact the seller broadcasts; the buyer's Bitcoin signatures on " +
            'inputs 1..N are the marketplace auth.',
        example: 'cHNidP8BAP0Y...',
        maxLength: 32_768,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32_768),
    __metadata("design:type", String)
], CreateBidDto.prototype, "psbtBase64", void 0);
//# sourceMappingURL=create-bid.dto.js.map