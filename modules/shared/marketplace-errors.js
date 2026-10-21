"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwOrdLookupFailed = throwOrdLookupFailed;
exports.throwCatNotFound = throwCatNotFound;
const common_1 = require("@nestjs/common");
function throwOrdLookupFailed() {
    throw new common_1.BadRequestException({
        code: 'ord-lookup-failed',
        detail: 'On-chain cats-bundle check could not complete. Try again in a moment.',
    });
}
function throwCatNotFound(detail) {
    throw new common_1.BadRequestException({ code: 'cat-not-found', detail });
}
//# sourceMappingURL=marketplace-errors.js.map