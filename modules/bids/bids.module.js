"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../shared/drizzle/drizzle.module");
const sync_module_1 = require("../sync/sync.module");
const bids_controller_1 = require("./bids.controller");
const bids_pruner_1 = require("./bids.pruner");
const bids_service_1 = require("./bids.service");
let BidsModule = class BidsModule {
};
exports.BidsModule = BidsModule;
exports.BidsModule = BidsModule = __decorate([
    (0, common_1.Module)({
        imports: [drizzle_module_1.DrizzleModule, sync_module_1.SyncModule],
        controllers: [bids_controller_1.BidsController],
        providers: [bids_service_1.BidsService, bids_pruner_1.BidsPruner],
        exports: [bids_service_1.BidsService],
    })
], BidsModule);
//# sourceMappingURL=bids.module.js.map