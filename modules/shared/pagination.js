"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationOffset = paginationOffset;
const common_1 = require("@nestjs/common");
function paginationOffset(itemsPerPage, currentPage) {
    if (!Number.isInteger(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
        throw new common_1.BadRequestException('itemsPerPage must be an integer in [1, 100]');
    }
    if (!Number.isInteger(currentPage) || currentPage < 1) {
        throw new common_1.BadRequestException('currentPage must be a positive integer');
    }
    return (currentPage - 1) * itemsPerPage;
}
//# sourceMappingURL=pagination.js.map