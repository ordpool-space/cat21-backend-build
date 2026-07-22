"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bids = void 0;
const node_crypto_1 = require("node:crypto");
const mysql_core_1 = require("drizzle-orm/mysql-core");
const json_column_1 = require("./json-column");
const jsonNumberArray = (0, json_column_1.jsonColumn)();
exports.bids = (0, mysql_core_1.mysqlTable)('bids', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, node_crypto_1.randomUUID)()),
    network: (0, mysql_core_1.varchar)('network', { length: 16 }).notNull(),
    catTxid: (0, mysql_core_1.varchar)('cat_txid', { length: 64 }).notNull(),
    catVout: (0, mysql_core_1.int)('cat_vout').notNull(),
    catsOnUtxo: jsonNumberArray('cats_on_utxo').notNull(),
    headlineCatNumber: (0, mysql_core_1.int)('headline_cat_number').notNull(),
    bidSats: (0, mysql_core_1.bigint)('bid_sats', { mode: 'number' }).notNull(),
    buyerOrdinalsAddress: (0, mysql_core_1.varchar)('buyer_ordinals_address', { length: 128 }).notNull(),
    buyerPaymentAddress: (0, mysql_core_1.varchar)('buyer_payment_address', { length: 128 }).notNull(),
    sellerPaymentAddress: (0, mysql_core_1.varchar)('seller_payment_address', { length: 128 }).notNull(),
    psbtBase64: (0, mysql_core_1.text)('psbt_base64').notNull(),
    createdAt: (0, mysql_core_1.datetime)('created_at', { mode: 'date', fsp: 3 })
        .notNull()
        .$defaultFn(() => new Date()),
}, (table) => [
    (0, mysql_core_1.uniqueIndex)('bids_utxo_buyer_unique').on(table.network, table.catTxid, table.catVout, table.buyerOrdinalsAddress),
    (0, mysql_core_1.index)('idx_bids_outpoint').on(table.catTxid, table.catVout),
    (0, mysql_core_1.index)('idx_bids_headline_cat_number').on(table.headlineCatNumber),
]);
//# sourceMappingURL=bids.js.map