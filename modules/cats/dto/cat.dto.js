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
exports.ExtendedHealthDto = exports.SyncHealthDto = exports.DatabaseHealthDto = exports.HealthDto = exports.CacheStatsDto = exports.StatusDto = exports.CatNumbersPaginatedResultDto = exports.CatsPaginatedResultDto = exports.CatDto = exports.CatSearchQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const FILTER_MAX_LENGTH = 200;
const EYES_VALUES = ['Orange', 'Red', 'Green', 'Blue', 'None'];
const POSE_VALUES = ['Standing', 'Sleeping', 'Pouncing', 'Stalking'];
const EXPRESSION_VALUES = ['Smile', 'Grumpy', 'Pouting', 'Shy'];
const PATTERN_VALUES = ['Solid', 'Striped', 'Eyepatch', 'Half/Half'];
const BACKGROUND_VALUES = ['Block9', 'Cyberpunk', 'Whitepaper', 'Orange'];
const CROWN_VALUES = ['Gold', 'Diamond', 'None'];
const GLASSES_VALUES = ['Black', 'Cool', '3D', 'Nouns', 'None'];
const CATEGORY_VALUES = ['genesis', 'sub1k', 'sub10k', 'sub50k', 'sub100k', 'sub250k', 'sub500k', 'sub1M'];
const GENDER_VALUES = ['Male', 'Female'];
const COLOR_VALUES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
function csvOf(values) {
    const alts = values.map((v) => v.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')).join('|');
    return new RegExp(`^(?:${alts})(?:,(?:${alts}))*$`);
}
const EYES_CSV = csvOf(EYES_VALUES);
const POSE_CSV = csvOf(POSE_VALUES);
const EXPRESSION_CSV = csvOf(EXPRESSION_VALUES);
const PATTERN_CSV = csvOf(PATTERN_VALUES);
const BACKGROUND_CSV = csvOf(BACKGROUND_VALUES);
const CROWN_CSV = csvOf(CROWN_VALUES);
const GLASSES_CSV = csvOf(GLASSES_VALUES);
const CATEGORY_CSV = csvOf(CATEGORY_VALUES);
const GENDER_CSV = csvOf(GENDER_VALUES);
const COLOR_CSV = csvOf(COLOR_VALUES);
const msg = (name, values) => `${name} must be a comma-separated list of: ${values.join(', ')}`;
class CatSearchQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eyes: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "EYES_CSV" }, pose: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "POSE_CSV" }, expression: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "EXPRESSION_CSV" }, pattern: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "PATTERN_CSV" }, background: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "BACKGROUND_CSV" }, crown: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "CROWN_CSV" }, glasses: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "GLASSES_CSV" }, category: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "CATEGORY_CSV" }, gender: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "GENDER_CSV" }, color: { required: false, type: () => String, maxLength: FILTER_MAX_LENGTH, pattern: "COLOR_CSV" } };
    }
}
exports.CatSearchQueryDto = CatSearchQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Laser eyes: Orange, Red, Green, Blue, None', example: 'Red,Blue' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(EYES_CSV, { message: msg('eyes', EYES_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "eyes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pose: Standing, Sleeping, Pouncing, Stalking', example: 'Sleeping' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(POSE_CSV, { message: msg('pose', POSE_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "pose", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expression: Smile, Grumpy, Pouting, Shy', example: 'Smile' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(EXPRESSION_CSV, { message: msg('expression', EXPRESSION_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "expression", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Coat pattern: Solid, Striped, Eyepatch, Half/Half', example: 'Striped' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(PATTERN_CSV, { message: msg('pattern', PATTERN_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "pattern", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Background: Block9, Cyberpunk, Whitepaper, Orange', example: 'Cyberpunk' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(BACKGROUND_CSV, { message: msg('background', BACKGROUND_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "background", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Crown: Gold, Diamond, None', example: 'Diamond' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(CROWN_CSV, { message: msg('crown', CROWN_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "crown", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Glasses: Black, Cool, 3D, Nouns, None', example: 'Cool' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(GLASSES_CSV, { message: msg('glasses', GLASSES_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "glasses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rarity category: genesis, sub1k, sub10k, sub50k, sub100k, sub250k, sub500k, sub1M. Multiple bands OR-combine.', example: 'sub1k' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(CATEGORY_CSV, { message: msg('category', CATEGORY_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Gender: Male, Female', example: 'Female' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(GENDER_CSV, { message: msg('gender', GENDER_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dominant body color bucket: red, orange, yellow, green, blue, purple, pink. Genesis cats have no body hue and never match.', example: 'red' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(FILTER_MAX_LENGTH),
    (0, class_validator_1.Matches)(COLOR_CSV, { message: msg('color', COLOR_VALUES) }),
    __metadata("design:type", String)
], CatSearchQueryDto.prototype, "color", void 0);
class CatDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, catNumber: { required: true, type: () => Number }, txHash: { required: true, type: () => String }, blockHash: { required: true, type: () => String }, blockHeight: { required: true, type: () => Number }, mintedAt: { required: true, type: () => String }, mintedBy: { required: true, type: () => String, nullable: true }, fee: { required: true, type: () => Number }, weight: { required: true, type: () => Number }, size: { required: true, type: () => Number }, feeRate: { required: true, type: () => Number }, sat: { required: true, type: () => Number }, value: { required: true, type: () => Number }, category: { required: true, type: () => String }, genesis: { required: true, type: () => Boolean }, catColors: { required: true, type: () => [String] }, gender: { required: true, type: () => String }, designIndex: { required: true, type: () => Number }, designPose: { required: true, type: () => String }, designExpression: { required: true, type: () => String }, designPattern: { required: true, type: () => String }, designFacing: { required: true, type: () => String }, laserEyes: { required: true, type: () => String }, background: { required: true, type: () => String }, backgroundColors: { required: true, type: () => [String] }, crown: { required: true, type: () => String }, glasses: { required: true, type: () => String }, glassesColors: { required: true, type: () => [String] } };
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
    (0, swagger_1.ApiProperty)({
        description: 'Gender of the cat. Empty string for cats that have neither (rare edge case, e.g. some fixtures).',
        enum: ['Female', 'Male', ''],
        example: 'Female',
    }),
    __metadata("design:type", String)
], CatDto.prototype, "gender", void 0);
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
class CatNumbersPaginatedResultDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { catNumbers: { required: true, type: () => [Number] }, total: { required: true, type: () => Number }, currentPage: { required: true, type: () => Number }, itemsPerPage: { required: true, type: () => Number } };
    }
}
exports.CatNumbersPaginatedResultDto = CatNumbersPaginatedResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number], description: 'Array of cat numbers for the current page', example: [63731, 63730, 63729] }),
    __metadata("design:type", Array)
], CatNumbersPaginatedResultDto.prototype, "catNumbers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of cats across all pages', example: 63732 }),
    __metadata("design:type", Number)
], CatNumbersPaginatedResultDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page number (1-based)', example: 1 }),
    __metadata("design:type", Number)
], CatNumbersPaginatedResultDto.prototype, "currentPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of cats per page', example: 48 }),
    __metadata("design:type", Number)
], CatNumbersPaginatedResultDto.prototype, "itemsPerPage", void 0);
class StatusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { totalCats: { required: true, type: () => Number }, lastSyncedCatNumber: { required: true, type: () => Number }, proofOfCatWork: { required: true, type: () => Number } };
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
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Proof of Cat Work: the total Bitcoin fees (in sats) paid to miners across all CAT-21 mint transactions. This number only grows, never decreases. See the CAT-21 whitepaper for the philosophical foundation.',
        example: 5234876543,
    }),
    __metadata("design:type", Number)
], StatusDto.prototype, "proofOfCatWork", void 0);
class CacheStatsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { cats: { required: true, type: () => Number }, catsMax: { required: true, type: () => Number }, txHashIndex: { required: true, type: () => Number }, totalCatCount: { required: true, type: () => Number }, lastSyncedCatNumber: { required: true, type: () => Number }, proofOfCatWork: { required: true, type: () => Number }, memoryLimitMB: { required: true, type: () => Number }, memoryTargetMB: { required: true, type: () => Number }, memoryHeadroomMB: { required: true, type: () => Number }, memoryRssMB: { required: true, type: () => Number }, memoryHeapUsedMB: { required: true, type: () => Number } };
    }
}
exports.CacheStatsDto = CacheStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of cats currently in the LRU cache. Oldest 2400 and newest 2400 are pinned (never evicted).', example: 5000 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Max capacity of the cat LRU (dynamically adjusted between 5300 and 20000)', example: 10000 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "catsMax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of txHash index entries (secondary lookup map)', example: 5000 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "txHashIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cached total cat count (maintained via auto-bump + sync notifications)', example: 63732 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "totalCatCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cached last synced cat number. Defines the newest-pinned range: [n-2399 .. n].', example: 63731 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "lastSyncedCatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cached Proof of Cat Work (sum of all mint fees in sats). Refreshed from DB after each sync cycle.', example: 5234876543 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "proofOfCatWork", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Detected container memory limit in MB (cgroup v2/v1, Node 20+ constrainedMemory, or fallback)', example: 512 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "memoryLimitMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target memory ceiling (75% of limit) in MB', example: 384 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "memoryTargetMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Available memory before hitting target, in MB', example: 263 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "memoryHeadroomMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current resident memory (RSS) in MB', example: 121 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "memoryRssMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current V8 heap used in MB', example: 45 }),
    __metadata("design:type", Number)
], CacheStatsDto.prototype, "memoryHeapUsedMB", void 0);
class HealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, timestamp: { required: true, type: () => String }, uptimeSec: { required: true, type: () => Number }, version: { required: true, type: () => String }, memoryMB: { required: true, type: () => Number }, cache: { required: true, type: () => require("./cat.dto").CacheStatsDto } };
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
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resident memory in MB', example: 85 }),
    __metadata("design:type", Number)
], HealthDto.prototype, "memoryMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'In-memory cache statistics', type: CacheStatsDto }),
    __metadata("design:type", CacheStatsDto)
], HealthDto.prototype, "cache", void 0);
class DatabaseHealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reachable: { required: true, type: () => Boolean }, latencyMs: { required: true, type: () => Number, nullable: true }, error: { required: true, type: () => String, nullable: true } };
    }
}
exports.DatabaseHealthDto = DatabaseHealthDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the database responded to a SELECT 1 ping', example: true }),
    __metadata("design:type", Boolean)
], DatabaseHealthDto.prototype, "reachable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'DB round-trip time in ms for the SELECT 1 ping. Null when the ping failed.', example: 12, nullable: true }),
    __metadata("design:type", Object)
], DatabaseHealthDto.prototype, "latencyMs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Short error message from the database driver when unreachable (truncated to 200 chars). Null when reachable.', example: null, nullable: true }),
    __metadata("design:type", Object)
], DatabaseHealthDto.prototype, "error", void 0);
class SyncHealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { lastSuccessAt: { required: true, type: () => String, nullable: true }, lastErrorAt: { required: true, type: () => String, nullable: true }, lastError: { required: true, type: () => String, nullable: true }, secondsSinceLastSuccess: { required: true, type: () => Number, nullable: true }, stalled: { required: true, type: () => Boolean } };
    }
}
exports.SyncHealthDto = SyncHealthDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO timestamp of the last successful sync cycle. Null until the first cycle completes after startup.', example: '2026-04-20T09:12:33.000Z', nullable: true }),
    __metadata("design:type", Object)
], SyncHealthDto.prototype, "lastSuccessAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO timestamp of the last sync cycle that threw. Null when no sync has errored since startup.', example: null, nullable: true }),
    __metadata("design:type", Object)
], SyncHealthDto.prototype, "lastErrorAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Short message of the last sync error. Null when no sync has errored since startup.', example: null, nullable: true }),
    __metadata("design:type", Object)
], SyncHealthDto.prototype, "lastError", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Seconds since the last successful sync cycle. Null until the first successful cycle.', example: 42, nullable: true }),
    __metadata("design:type", Object)
], SyncHealthDto.prototype, "secondsSinceLastSuccess", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True when the sync has not succeeded within the stall threshold (default 300 s).', example: false }),
    __metadata("design:type", Boolean)
], SyncHealthDto.prototype, "stalled", void 0);
class ExtendedHealthDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object }, timestamp: { required: true, type: () => String }, uptimeSec: { required: true, type: () => Number }, version: { required: true, type: () => String }, memoryMB: { required: true, type: () => Number }, database: { required: true, type: () => require("./cat.dto").DatabaseHealthDto }, sync: { required: true, type: () => require("./cat.dto").SyncHealthDto }, cache: { required: true, type: () => require("./cat.dto").CacheStatsDto } };
    }
}
exports.ExtendedHealthDto = ExtendedHealthDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rollup status: "ok" when DB is reachable and sync is fresh; "degraded" when DB is reachable but sync is stalled; "down" when the DB ping failed.',
        example: 'ok',
        enum: ['ok', 'degraded', 'down'],
    }),
    __metadata("design:type", String)
], ExtendedHealthDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current server time (ISO 8601)', example: '2026-04-20T09:13:15.000Z' }),
    __metadata("design:type", String)
], ExtendedHealthDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Server uptime in seconds', example: 3600 }),
    __metadata("design:type", Number)
], ExtendedHealthDto.prototype, "uptimeSec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Backend version', example: '0.1.0' }),
    __metadata("design:type", String)
], ExtendedHealthDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resident memory in MB', example: 85 }),
    __metadata("design:type", Number)
], ExtendedHealthDto.prototype, "memoryMB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Result of a live SELECT 1 against the database', type: DatabaseHealthDto }),
    __metadata("design:type", DatabaseHealthDto)
], ExtendedHealthDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last sync cycle outcome and freshness signal', type: SyncHealthDto }),
    __metadata("design:type", SyncHealthDto)
], ExtendedHealthDto.prototype, "sync", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'In-memory cache statistics', type: CacheStatsDto }),
    __metadata("design:type", CacheStatsDto)
], ExtendedHealthDto.prototype, "cache", void 0);
//# sourceMappingURL=cat.dto.js.map