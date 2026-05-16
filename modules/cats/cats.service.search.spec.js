"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cats_service_1 = require("./cats.service");
describe('buildSearchWhere', () => {
    it('returns undefined for an empty filter set', () => {
        expect((0, cats_service_1.buildSearchWhere)({})).toBeUndefined();
        expect((0, cats_service_1.buildSearchWhere)({ eyes: [], pose: [] })).toBeUndefined();
    });
    it('returns a SQL expression for a single-field single-value filter', () => {
        const sql = (0, cats_service_1.buildSearchWhere)({ eyes: ['Red'] });
        expect(sql).toBeDefined();
    });
    it('returns a SQL expression for multi-value single-field filter', () => {
        const sql = (0, cats_service_1.buildSearchWhere)({ eyes: ['Red', 'Blue'] });
        expect(sql).toBeDefined();
    });
    it('combines multiple fields', () => {
        const sql = (0, cats_service_1.buildSearchWhere)({
            eyes: ['Red'],
            pose: ['Sleeping'],
            crown: ['Diamond'],
        });
        expect(sql).toBeDefined();
    });
    it('handles every documented categorical field', () => {
        const filters = {
            eyes: ['Orange'],
            pose: ['Standing'],
            expression: ['Smile'],
            pattern: ['Solid'],
            background: ['Cyberpunk'],
            crown: ['Gold'],
            glasses: ['Cool'],
        };
        expect((0, cats_service_1.buildSearchWhere)(filters)).toBeDefined();
    });
    describe('category', () => {
        it('translates a single sub-Nk category into a clause', () => {
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub1k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub10k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub50k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub100k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub250k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub500k'] })).toBeDefined();
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub1M'] })).toBeDefined();
        });
        it('still returns a SQL clause for unknown category values (they just match nothing)', () => {
            expect((0, cats_service_1.buildSearchWhere)({ category: ['sub42k'] })).toBeDefined();
        });
    });
    describe('genesis (ORIGIN trait)', () => {
        it("translates 'genesis' alone to a boolean equality clause", () => {
            expect((0, cats_service_1.buildSearchWhere)({ genesis: ['genesis'] })).toBeDefined();
        });
        it("translates 'normal' alone to a boolean equality clause", () => {
            expect((0, cats_service_1.buildSearchWhere)({ genesis: ['normal'] })).toBeDefined();
        });
        it('returns undefined when both genesis+normal are selected (matches everything)', () => {
            expect((0, cats_service_1.buildSearchWhere)({ genesis: ['genesis', 'normal'] })).toBeUndefined();
        });
    });
    describe('gender', () => {
        it('matches Male via inArray', () => {
            expect((0, cats_service_1.buildSearchWhere)({ gender: ['Male'] })).toBeDefined();
        });
        it('matches Female via inArray', () => {
            expect((0, cats_service_1.buildSearchWhere)({ gender: ['Female'] })).toBeDefined();
        });
        it('combines both via OR', () => {
            expect((0, cats_service_1.buildSearchWhere)({ gender: ['Male', 'Female'] })).toBeDefined();
        });
        it('still returns a clause for unknown gender tokens (just matches nothing)', () => {
            expect((0, cats_service_1.buildSearchWhere)({ gender: ['xenon'] })).toBeDefined();
        });
    });
});
//# sourceMappingURL=cats.service.search.spec.js.map