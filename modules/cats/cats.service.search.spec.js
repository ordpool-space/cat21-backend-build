"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_core_1 = require("drizzle-orm/mysql-core");
const cats_service_1 = require("./cats.service");
const dialect = new mysql_core_1.MySqlDialect();
function compile(where) {
    if (!where)
        throw new Error('expected a SQL expression, got undefined');
    const { sql, params } = dialect.sqlToQuery(where);
    return { sql, params };
}
describe('buildSearchWhere', () => {
    it('returns undefined for an empty filter set', () => {
        expect((0, cats_service_1.buildSearchWhere)({})).toBeUndefined();
        expect((0, cats_service_1.buildSearchWhere)({ eyes: [], pose: [] })).toBeUndefined();
    });
    it('emits `laser_eyes in (?)` for a single-field single-value filter', () => {
        expect(compile((0, cats_service_1.buildSearchWhere)({ eyes: ['Red'] }))).toEqual({
            sql: '`cats`.`laser_eyes` in (?)',
            params: ['Red'],
        });
    });
    it('emits a multi-placeholder inArray (OR within a field) for a multi-value filter', () => {
        expect(compile((0, cats_service_1.buildSearchWhere)({ eyes: ['Red', 'Blue'] }))).toEqual({
            sql: '`cats`.`laser_eyes` in (?, ?)',
            params: ['Red', 'Blue'],
        });
    });
    it('AND-combines multiple fields, each an inArray on its own column', () => {
        expect(compile((0, cats_service_1.buildSearchWhere)({ eyes: ['Red'], pose: ['Sleeping'], crown: ['Diamond'] }))).toEqual({
            sql: '(`cats`.`laser_eyes` in (?) and `cats`.`design_pose` in (?) and `cats`.`crown` in (?))',
            params: ['Red', 'Sleeping', 'Diamond'],
        });
    });
    it('maps every documented categorical field to an inArray on its own column, in push order', () => {
        const filters = {
            eyes: ['Orange'],
            pose: ['Standing'],
            expression: ['Smile'],
            pattern: ['Solid'],
            background: ['Cyberpunk'],
            crown: ['Gold'],
            glasses: ['Cool'],
        };
        const { sql, params } = compile((0, cats_service_1.buildSearchWhere)(filters));
        for (const col of ['laser_eyes', 'design_pose', 'design_expression', 'design_pattern', 'background', 'crown', 'glasses']) {
            expect(sql).toContain(`\`cats\`.\`${col}\` in (?)`);
        }
        expect(params).toEqual(['Orange', 'Standing', 'Smile', 'Solid', 'Cyberpunk', 'Gold', 'Cool']);
    });
    describe('category (load-bearing: DISJOINT collections, HARD RULE)', () => {
        it('emits `category in (?)` with the band token — NOT a cumulative cat_number ceiling', () => {
            const { sql, params } = compile((0, cats_service_1.buildSearchWhere)({ category: ['sub1k'] }));
            expect(sql).toBe('`cats`.`category` in (?)');
            expect(params).toEqual(['sub1k']);
            expect(sql).not.toContain('cat_number');
            expect(sql).not.toContain('<=');
            expect(params).not.toContain(1000);
            expect(params).not.toContain(9999);
        });
        it('matches EACH band by its exact token (disjoint), never a range', () => {
            for (const band of ['sub1', 'sub1k', 'sub10k', 'sub50k', 'sub100k', 'sub250k', 'sub500k', 'sub1M']) {
                expect(compile((0, cats_service_1.buildSearchWhere)({ category: [band] }))).toEqual({
                    sql: '`cats`.`category` in (?)',
                    params: [band],
                });
            }
        });
        it('multi-select category is an inArray over the exact bands, still disjoint (never a widening range)', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ category: ['sub1k', 'sub10k'] }))).toEqual({
                sql: '`cats`.`category` in (?, ?)',
                params: ['sub1k', 'sub10k'],
            });
        });
        it('an unknown band is still matched literally (inArray), so it matches nothing rather than a range', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ category: ['sub42k'] }))).toEqual({
                sql: '`cats`.`category` in (?)',
                params: ['sub42k'],
            });
        });
    });
    describe('genesis (ORIGIN trait -> boolean equality)', () => {
        it("'genesis' alone -> `genesis` = true", () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ genesis: ['genesis'] }))).toEqual({
                sql: '`cats`.`genesis` = ?',
                params: [true],
            });
        });
        it("'normal' alone -> `genesis` = false", () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ genesis: ['normal'] }))).toEqual({
                sql: '`cats`.`genesis` = ?',
                params: [false],
            });
        });
        it('both genesis+normal -> undefined (matches everything, no clause)', () => {
            expect((0, cats_service_1.buildSearchWhere)({ genesis: ['genesis', 'normal'] })).toBeUndefined();
        });
    });
    describe('gender (inArray)', () => {
        it('Male -> `gender in (?)`', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ gender: ['Male'] }))).toEqual({
                sql: '`cats`.`gender` in (?)',
                params: ['Male'],
            });
        });
        it('Female -> `gender in (?)`', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ gender: ['Female'] }))).toEqual({
                sql: '`cats`.`gender` in (?)',
                params: ['Female'],
            });
        });
        it('both -> `gender in (?, ?)` (OR)', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ gender: ['Male', 'Female'] }))).toEqual({
                sql: '`cats`.`gender` in (?, ?)',
                params: ['Male', 'Female'],
            });
        });
        it('unknown token still an inArray literal (matches nothing)', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ gender: ['xenon'] }))).toEqual({
                sql: '`cats`.`gender` in (?)',
                params: ['xenon'],
            });
        });
    });
    describe('rarity (rank CEILING -> lte, broadest wins)', () => {
        it('single tier -> `rarity_rank <= ?` at that threshold', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ rarity: ['top100'] }))).toEqual({
                sql: '`cats`.`rarity_rank` <= ?',
                params: [100],
            });
        });
        it('multi-select -> the BROADEST ceiling wins (max threshold), not the narrowest', () => {
            expect(compile((0, cats_service_1.buildSearchWhere)({ rarity: ['top10', 'top100'] }))).toEqual({
                sql: '`cats`.`rarity_rank` <= ?',
                params: [100],
            });
        });
        it('an unknown tier alone contributes no clause -> undefined', () => {
            expect((0, cats_service_1.buildSearchWhere)({ rarity: ['top999'] })).toBeUndefined();
        });
    });
});
//# sourceMappingURL=cats.service.search.spec.js.map