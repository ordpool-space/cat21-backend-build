"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cats = void 0;
const node_crypto_1 = require("node:crypto");
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.cats = (0, mysql_core_1.mysqlTable)('cats', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, node_crypto_1.randomUUID)()),
    catNumber: (0, mysql_core_1.int)('cat_number').notNull().unique(),
    txHash: (0, mysql_core_1.varchar)('tx_hash', { length: 64 }).notNull().unique(),
    blockHash: (0, mysql_core_1.varchar)('block_hash', { length: 64 }).notNull(),
    blockHeight: (0, mysql_core_1.int)('block_height').notNull(),
    mintedAt: (0, mysql_core_1.datetime)('minted_at', { mode: 'date', fsp: 3 }).notNull(),
    mintedBy: (0, mysql_core_1.varchar)('minted_by', { length: 256 }),
    fee: (0, mysql_core_1.bigint)('fee', { mode: 'number' }).notNull(),
    weight: (0, mysql_core_1.int)('weight').notNull(),
    size: (0, mysql_core_1.int)('size').notNull(),
    feeRate: (0, mysql_core_1.double)('feerate').notNull(),
    sat: (0, mysql_core_1.bigint)('sat', { mode: 'number' }).notNull(),
    value: (0, mysql_core_1.bigint)('value', { mode: 'number' }).notNull(),
    category: (0, mysql_core_1.varchar)('category', { length: 50 }).notNull().default(''),
    genesis: (0, mysql_core_1.boolean)('genesis').notNull().default(false),
    catColors: (0, mysql_core_1.json)('cat_colors').$type().notNull().default([]),
    male: (0, mysql_core_1.boolean)('male').notNull().default(false),
    female: (0, mysql_core_1.boolean)('female').notNull().default(false),
    designIndex: (0, mysql_core_1.int)('design_index').notNull().default(0),
    designPose: (0, mysql_core_1.varchar)('design_pose', { length: 50 }).notNull().default(''),
    designExpression: (0, mysql_core_1.varchar)('design_expression', { length: 50 }).notNull().default(''),
    designPattern: (0, mysql_core_1.varchar)('design_pattern', { length: 50 }).notNull().default(''),
    designFacing: (0, mysql_core_1.varchar)('design_facing', { length: 10 }).notNull().default(''),
    laserEyes: (0, mysql_core_1.varchar)('laser_eyes', { length: 50 }).notNull().default('None'),
    background: (0, mysql_core_1.varchar)('background', { length: 50 }).notNull().default(''),
    backgroundColors: (0, mysql_core_1.json)('background_colors').$type().notNull().default([]),
    crown: (0, mysql_core_1.varchar)('crown', { length: 50 }).notNull().default('None'),
    glasses: (0, mysql_core_1.varchar)('glasses', { length: 50 }).notNull().default('None'),
    glassesColors: (0, mysql_core_1.json)('glasses_colors').$type().notNull().default([]),
}, (t) => [
    (0, mysql_core_1.index)('idx_cats_block_height').on(t.blockHeight),
    (0, mysql_core_1.index)('idx_cats_minted_by').on(t.mintedBy),
    (0, mysql_core_1.index)('idx_cats_genesis').on(t.genesis),
    (0, mysql_core_1.index)('idx_cats_design_pose').on(t.designPose),
    (0, mysql_core_1.index)('idx_cats_laser_eyes').on(t.laserEyes),
    (0, mysql_core_1.index)('idx_cats_background').on(t.background),
    (0, mysql_core_1.index)('idx_cats_crown').on(t.crown),
    (0, mysql_core_1.index)('idx_cats_glasses').on(t.glasses),
    (0, mysql_core_1.index)('idx_cats_feerate').on(t.feeRate),
]);
//# sourceMappingURL=cats.js.map