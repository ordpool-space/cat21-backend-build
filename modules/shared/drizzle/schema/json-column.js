"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonColumn = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const jsonColumn = () => (0, mysql_core_1.customType)({
    dataType() {
        return 'json';
    },
    toDriver(value) {
        return JSON.stringify(value);
    },
    fromDriver(value) {
        if (typeof value === 'string') {
            return JSON.parse(value);
        }
        return value;
    },
});
exports.jsonColumn = jsonColumn;
//# sourceMappingURL=json-column.js.map