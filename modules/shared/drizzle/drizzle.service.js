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
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promise_1 = require("mysql2/promise");
const mysql2_1 = require("drizzle-orm/mysql2");
const migrator_1 = require("drizzle-orm/mysql2/migrator");
const schema = require("./schema");
let DrizzleService = DrizzleService_1 = class DrizzleService {
    constructor(configService) {
        this.logger = new common_1.Logger(DrizzleService_1.name);
        const databaseUrl = configService.getOrThrow('DATABASE_URL');
        this.pool = (0, promise_1.createPool)(databaseUrl);
        this.db = (0, mysql2_1.drizzle)(this.pool, { schema, mode: 'default' });
        this.logger.log('Database connection pool created');
    }
    async onModuleInit() {
        const candidates = ['./migrations', '../migrations'];
        const folder = candidates.find((p) => (0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), p)));
        if (!folder) {
            this.logger.warn('No migrations folder found; skipping drizzle migrate');
            return;
        }
        this.logger.log(`Applying drizzle migrations from ${folder}`);
        await (0, migrator_1.migrate)(this.db, { migrationsFolder: folder });
        this.logger.log('Drizzle migrations applied');
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