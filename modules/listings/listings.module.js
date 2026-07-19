"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../shared/drizzle/drizzle.module");
const sync_module_1 = require("../sync/sync.module");
const listings_controller_1 = require("./listings.controller");
const listings_pruner_1 = require("./listings.pruner");
const listings_service_1 = require("./listings.service");
let ListingsModule = class ListingsModule {
};
exports.ListingsModule = ListingsModule;
exports.ListingsModule = ListingsModule = __decorate([
    (0, common_1.Module)({
        imports: [drizzle_module_1.DrizzleModule, sync_module_1.SyncModule],
        controllers: [listings_controller_1.ListingsController],
        providers: [listings_service_1.ListingsService, listings_pruner_1.ListingsPruner],
        exports: [listings_service_1.ListingsService],
    })
], ListingsModule);
//# sourceMappingURL=listings.module.js.map