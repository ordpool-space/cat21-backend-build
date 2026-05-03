"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_column_1 = require("./json-column");
describe('jsonColumn (mysql2 JSON parsing fix)', () => {
    const helper = (0, json_column_1.jsonColumn)();
    const built = helper('test');
    const { toDriver, fromDriver } = built.config.customTypeParams;
    test('toDriver stringifies arrays for MariaDB JSON columns', () => {
        expect(toDriver(['#555555', '#222222'])).toBe('["#555555","#222222"]');
        expect(toDriver([])).toBe('[]');
    });
    test('fromDriver parses the JSON string mysql2 returns under prepared statements', () => {
        expect(fromDriver('["#555555","#222222"]')).toEqual(['#555555', '#222222']);
        expect(fromDriver('[]')).toEqual([]);
    });
    test('fromDriver passes already-parsed arrays through (defensive: real MySQL with non-prepared queries)', () => {
        const arr = ['#abc'];
        expect(fromDriver(arr)).toBe(arr);
    });
});
//# sourceMappingURL=json-column.spec.js.map