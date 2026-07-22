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
exports.EnvironmentVariables = void 0;
exports.validate = validate;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class EnvironmentVariables {
    constructor() {
        this.NODE_ENV = 'development';
        this.PORT = 3333;
        this.HOST = '0.0.0.0';
        this.ORD_API_URL = 'https://ord.cat21.space';
        this.ELECTRS_API_URL = 'https://api.ordpool.space/api';
    }
}
exports.EnvironmentVariables = EnvironmentVariables;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "HOST", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "ORD_API_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "ELECTRS_API_URL", void 0);
function validate(config) {
    const validated = (0, class_transformer_1.plainToClass)(EnvironmentVariables, config);
    const errors = (0, class_validator_1.validateSync)(validated, {
        skipMissingProperties: false,
        forbidUnknownValues: true,
    });
    if (errors.length > 0) {
        throw new Error(`Config validation failed:\n${errors
            .map((e) => Object.values(e.constraints ?? {}).join(', '))
            .join('\n')}`);
    }
    return validated;
}
//# sourceMappingURL=env.config.js.map