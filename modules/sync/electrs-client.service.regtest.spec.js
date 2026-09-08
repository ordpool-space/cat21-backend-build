"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electrs_client_service_1 = require("./electrs-client.service");
const ELECTRS_API_URL = process.env.ELECTRS_API_URL ?? 'http://127.0.0.1:3010';
function realService() {
    return new electrs_client_service_1.ElectrsClientService({ getOrThrow: () => ELECTRS_API_URL });
}
async function fetchTxFromElectrs(txid) {
    const res = await fetch(`${ELECTRS_API_URL}/tx/${txid}`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`electrs /tx/${txid} returned ${res.status} ${res.statusText}`);
    }
    return res.json();
}
describe('ElectrsClientService against a REAL regtest electrs (no mock)', () => {
    const seedMintTxid = process.env.SEED_MINT_TXID;
    const seededIt = seedMintTxid ? it : it.skip;
    seededIt('reports the fresh mint output unspent and the spent-input outpoint spent', async () => {
        const txid = seedMintTxid;
        if (!txid)
            throw new Error('SEED_MINT_TXID must be set for this test');
        const svc = realService();
        const catOutputStatus = await svc.getOutpointStatus(txid, 0);
        expect(catOutputStatus).toBe('unspent');
        const mintTx = await fetchTxFromElectrs(txid);
        const spentInput = mintTx.vin[0];
        if (!spentInput)
            throw new Error(`mint tx ${txid} has no inputs`);
        const spentInputStatus = await svc.getOutpointStatus(spentInput.txid, spentInput.vout);
        expect(spentInputStatus).toBe('spent');
    });
    it('collapses a txid electrs never saw to spent (404 → spent)', async () => {
        const svc = realService();
        const phantomTxid = 'ff'.repeat(32);
        const status = await svc.getOutpointStatus(phantomTxid, 0);
        expect(status).toBe('spent');
    });
});
//# sourceMappingURL=electrs-client.service.regtest.spec.js.map