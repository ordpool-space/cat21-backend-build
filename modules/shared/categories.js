"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_VALUES = exports.CATEGORIES = exports.CATEGORY_RANGES = void 0;
exports.deriveCategory = deriveCategory;
exports.CATEGORY_RANGES = {
    sub1: [0, 0, 1],
    sub1k: [1, 999, 999],
    sub10k: [1000, 9999, 9000],
    sub50k: [10000, 49999, 40000],
    sub100k: [50000, 99999, 50000],
    sub250k: [100000, 249999, 150000],
    sub500k: [250000, 499999, 250000],
    sub1M: [500000, 999999, 500000],
};
exports.CATEGORIES = Object.keys(exports.CATEGORY_RANGES);
exports.CATEGORY_VALUES = exports.CATEGORIES;
function deriveCategory(catNumber) {
    for (const [name, [, max]] of Object.entries(exports.CATEGORY_RANGES)) {
        if (catNumber <= max)
            return name;
    }
    return '';
}
//# sourceMappingURL=categories.js.map