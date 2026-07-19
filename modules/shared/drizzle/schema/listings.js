"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listings = void 0;
const node_crypto_1 = require("node:crypto");
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.listings = (0, mysql_core_1.mysqlTable)('listings', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, node_crypto_1.randomUUID)()),
    catNumber: (0, mysql_core_1.int)('cat_number').notNull().unique(),
    network: (0, mysql_core_1.varchar)('network', { length: 16 }).notNull(),
    askSats: (0, mysql_core_1.bigint)('ask_sats', { mode: 'number' }).notNull(),
    payTo: (0, mysql_core_1.varchar)('pay_to', { length: 128 }).notNull(),
    catTxid: (0, mysql_core_1.varchar)('cat_txid', { length: 64 }).notNull(),
    catVout: (0, mysql_core_1.int)('cat_vout').notNull(),
    ordinalsAddress: (0, mysql_core_1.varchar)('ordinals_address', { length: 128 }).notNull(),
    signedAt: (0, mysql_core_1.bigint)('signed_at', { mode: 'number' }).notNull(),
    signature: (0, mysql_core_1.varchar)('signature', { length: 512 }).notNull(),
    createdAt: (0, mysql_core_1.datetime)('created_at', { mode: 'date', fsp: 3 })
        .notNull()
        .$defaultFn(() => new Date()),
}, (table) => [
    (0, mysql_core_1.index)('idx_listings_outpoint').on(table.catTxid, table.catVout),
    (0, mysql_core_1.index)('idx_listings_signed_at').on(table.signedAt),
]);
//# sourceMappingURL=listings.js.map