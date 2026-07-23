"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catsArraysEqual = catsArraysEqual;
function catsArraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.every((v, i) => v === sb[i]);
}
//# sourceMappingURL=array-utils.js.map