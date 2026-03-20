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
var DrizzleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = require("./schema");
let DrizzleService = DrizzleService_1 = class DrizzleService {
    constructor(configService) {
        this.logger = new common_1.Logger(DrizzleService_1.name);
        const databaseUrl = configService.getOrThrow('DATABASE_URL');
        this.pool = new pg_1.Pool({ connectionString: databaseUrl });
        this.db = (0, node_postgres_1.drizzle)(this.pool, { schema });
        this.logger.log('Database connection pool created');
    }
    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log('Database connection pool closed');
    }
};
exports.DrizzleService = DrizzleService;
exports.DrizzleService = DrizzleService = DrizzleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DrizzleService);
//# sourceMappingURL=drizzle.service.js.map