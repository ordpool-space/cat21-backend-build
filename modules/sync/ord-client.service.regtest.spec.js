"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ord_client_service_1 = require("./ord-client.service");
const ORD_API_URL = process.env.ORD_API_URL ?? 'http://127.0.0.1:8080';
function realService() {
    return new ord_client_service_1.OrdClientService({ getOrThrow: () => ORD_API_URL });
}
describe('OrdClientService against a REAL regtest cat21-ord (no mock)', () => {
    it('getCatsAtOutput maps a real cat UTXO to its real cat number', async () => {
        const svc = realService();
        const latest = await svc.getLatestCatNumber();
        expect(latest).toBeGreaterThanOrEqual(0);
        const cat = await svc.getCat(latest);
        if (!cat)
            throw new Error(`cat21-ord has no cat #${latest}`);
        const loc = await svc.getCatCurrentLocation(latest);
        if (!loc)
            throw new Error(`cat #${latest} has no current location on cat21-ord`);
        const cats = await svc.getCatsAtOutput(loc.txid, loc.vout);
        expect(cats).toContain(latest);
    });
});
//# sourceMappingURL=ord-client.service.regtest.spec.js.map