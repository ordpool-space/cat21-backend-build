"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const drizzle_orm_1 = require("drizzle-orm");
const stack_1 = require("ordpool-sdk/e2e/stack");
const drizzle_service_1 = require("../shared/drizzle/drizzle.service");
const listings_1 = require("../shared/drizzle/schema/listings");
const ord_client_service_1 = require("../sync/ord-client.service");
const listings_pruner_1 = require("./listings.pruner");
const listings_service_1 = require("./listings.service");
const CAT_SATS = 2_500;
const MINT_FEE_SATS = 5_000;
const MOVE_FEE_SATS = 5_000;
const WALLET = process.env.REGTEST_WALLET || 'ordpool-e2e';
const BITCOIND = process.env.REGTEST_BITCOIND_CONTAINER;
function bcli(...args) {
    if (!BITCOIND)
        throw new Error('REGTEST_BITCOIND_CONTAINER is not set; run inside the regtest lane');
    return (0, node_child_process_1.execFileSync)('docker', ['exec', BITCOIND, 'bitcoin-cli', '-regtest', '-rpcuser=ordpool', '-rpcpassword=ordpool', ...args], { encoding: 'utf8' }).trim();
}
function bcliJson(...args) {
    return JSON.parse(bcli(...args));
}
const wcli = (...args) => bcli(`-rpcwallet=${WALLET}`, ...args);
const wcliJson = (...args) => bcliJson(`-rpcwallet=${WALLET}`, ...args);
function satsToBtc(sats) {
    const s = String(sats).padStart(9, '0');
    return `${s.slice(0, -8)}.${s.slice(-8)}`;
}
function pickFundingUtxo(minSats, exclude = new Set()) {
    const unspent = wcliJson('listunspent', '1');
    const pick = unspent.find((u) => Math.round(u.amount * 1e8) >= minSats && !exclude.has(`${u.txid}:${u.vout}`));
    if (!pick)
        throw new Error(`no confirmed UTXO >= ${minSats} sats in wallet ${WALLET}`);
    return pick;
}
function mine(blocks = 1) {
    const addr = wcli('getnewaddress');
    bcli('generatetoaddress', String(blocks), addr);
}
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function poll(fn, label, tries = 90, delayMs = 2_000) {
    for (let i = 0; i < tries; i++) {
        const v = await fn();
        if (v !== null && v !== undefined)
            return v;
        await sleep(delayMs);
    }
    throw new Error(`timed out waiting for: ${label}`);
}
const ORD_API_URL = process.env.ORD_API_URL ?? (0, stack_1.stackUrl)('ord');
const DATABASE_URL = process.env.DATABASE_URL ?? `mysql://cat21:cat21@127.0.0.1:${(0, stack_1.stackPort)('mariadb')}/cat21`;
function configStub(value) {
    return { getOrThrow: () => value };
}
describe('ListingsPruner against a REAL regtest cat21-ord + MariaDB (no mock)', () => {
    let drizzle;
    let ordClient;
    let pruner;
    let catNumber;
    let mintTxid;
    const listingNetwork = 'regtest';
    beforeAll(async () => {
        process.env.BACKEND_NETWORK = listingNetwork;
        drizzle = new drizzle_service_1.DrizzleService(configStub(DATABASE_URL));
        await drizzle.onModuleInit();
        ordClient = new ord_client_service_1.OrdClientService(configStub(ORD_API_URL));
        const listingsService = new listings_service_1.ListingsService(drizzle, ordClient);
        pruner = new listings_pruner_1.ListingsPruner(drizzle, ordClient, listingsService);
        const funding = pickFundingUtxo(1_000_000);
        const catAddr = wcli('getnewaddress', '', 'bech32');
        const changeAddr = wcli('getnewaddress');
        const changeSats = Math.round(funding.amount * 1e8) - CAT_SATS - MINT_FEE_SATS;
        const mintInputs = JSON.stringify([{ txid: funding.txid, vout: funding.vout }]);
        const mintOutputs = `[{"${catAddr}":${satsToBtc(CAT_SATS)}},{"${changeAddr}":${satsToBtc(changeSats)}}]`;
        const mintRaw = bcli('createrawtransaction', mintInputs, mintOutputs, '21');
        const mintSigned = bcliJson(`-rpcwallet=${WALLET}`, 'signrawtransactionwithwallet', mintRaw).hex;
        mintTxid = bcli('sendrawtransaction', mintSigned);
        expect(bcliJson('getrawtransaction', mintTxid, 'true').locktime).toBe(21);
        mine(1);
        const cat = await poll(() => ordClient.getCat(`${mintTxid}i0`), `cat21-ord to index mint ${mintTxid}`);
        catNumber = cat.number;
        await drizzle.db.insert(listings_1.listings).values({
            network: listingNetwork,
            catNumber,
            catsOnUtxo: [catNumber],
            headlineCatNumber: catNumber,
            askSats: 50_000,
            payTo: changeAddr,
            catTxid: mintTxid,
            catVout: 0,
            ordinalsAddress: catAddr,
            signedAt: Date.now(),
            signature: '',
        });
    }, 300_000);
    afterAll(async () => {
        if (drizzle?.db && mintTxid) {
            await drizzle.db
                .delete(listings_1.listings)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(listings_1.listings.catTxid, mintTxid), (0, drizzle_orm_1.eq)(listings_1.listings.catVout, 0)));
        }
        await drizzle?.onModuleDestroy();
    });
    it('closes a listing after a foreign (locktime != 21) settle moves the cat to the buyer', async () => {
        const before = await drizzle.db
            .select()
            .from(listings_1.listings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(listings_1.listings.catTxid, mintTxid), (0, drizzle_orm_1.eq)(listings_1.listings.catVout, 0)));
        expect(before).toHaveLength(1);
        const buyerAddr = wcli('getnewaddress', '', 'bech32');
        const moveChangeAddr = wcli('getnewaddress');
        const moveFunding = pickFundingUtxo(1_000_000, new Set([`${mintTxid}:0`]));
        const moveChangeSats = Math.round(moveFunding.amount * 1e8) - MOVE_FEE_SATS;
        const moveInputs = JSON.stringify([
            { txid: mintTxid, vout: 0 },
            { txid: moveFunding.txid, vout: moveFunding.vout },
        ]);
        const moveOutputs = `[{"${buyerAddr}":${satsToBtc(CAT_SATS)}},{"${moveChangeAddr}":${satsToBtc(moveChangeSats)}}]`;
        const moveRaw = bcli('createrawtransaction', moveInputs, moveOutputs, '0');
        const moveSigned = bcliJson(`-rpcwallet=${WALLET}`, 'signrawtransactionwithwallet', moveRaw);
        expect(moveSigned.complete).toBe(true);
        const moveTxid = bcli('sendrawtransaction', moveSigned.hex);
        expect(bcliJson('getrawtransaction', moveTxid, 'true').locktime).toBe(0);
        mine(1);
        const moved = await poll(async () => {
            const loc = await ordClient.getCatCurrentLocation(catNumber);
            return loc && loc.txid === moveTxid ? loc : null;
        }, `cat21-ord to track cat #${catNumber} to the settle outpoint`);
        expect(moved.txid).toBe(moveTxid);
        expect(moved.vout).toBe(0);
        expect(moved.ordinalsAddress).toBe(buyerAddr);
        await pruner.runPrune();
        const after = await drizzle.db
            .select()
            .from(listings_1.listings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(listings_1.listings.catTxid, mintTxid), (0, drizzle_orm_1.eq)(listings_1.listings.catVout, 0)));
        expect(after).toHaveLength(0);
    }, 300_000);
});
//# sourceMappingURL=listings-pruner-foreign-settle.regtest.spec.js.map