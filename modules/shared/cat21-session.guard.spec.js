"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const secp256k1_1 = require("@noble/curves/secp256k1");
const base_1 = require("@scure/base");
const btc = require("@scure/btc-signer");
const cat21_session_1 = require("ordpool-sdk/cat21-session");
const cat21_session_guard_1 = require("./cat21-session.guard");
const SESSION_KEY = base_1.hex.decode('07'.repeat(32));
const sessionP2tr = btc.p2tr(secp256k1_1.schnorr.getPublicKey(SESSION_KEY), undefined, btc.NETWORK);
const ADDR = sessionP2tr.address;
const OTHER_ADDR = btc.p2tr(secp256k1_1.schnorr.getPublicKey(base_1.hex.decode('08'.repeat(32))), undefined, btc.NETWORK).address;
function signSession(message) {
    const messageHash = secp256k1_1.schnorr.utils.taggedHash('BIP0322-signed-message', new TextEncoder().encode(message));
    const toSpend = new btc.Transaction({ version: 0, lockTime: 0, allowUnknownInputs: true, allowUnknownOutputs: true });
    toSpend.addOutput({ script: sessionP2tr.script, amount: 0n });
    toSpend.addInput({
        txid: new Uint8Array(32),
        index: 0xffffffff,
        sequence: 0,
        finalScriptSig: btc.Script.encode(['OP_0', messageHash]),
    });
    const toSign = new btc.Transaction({ version: 0, lockTime: 0, allowUnknownOutputs: true });
    toSign.addInput({
        txid: toSpend.id,
        index: 0,
        sequence: 0,
        witnessUtxo: { script: sessionP2tr.script, amount: 0n },
        tapInternalKey: secp256k1_1.schnorr.getPublicKey(SESSION_KEY),
    });
    toSign.addOutput({ script: btc.Script.encode(['RETURN']), amount: 0n });
    toSign.signIdx(SESSION_KEY, 0);
    const sig = toSign.getInput(0).tapKeySig;
    return base_1.base64.encode(new Uint8Array([0x01, sig.length, ...sig]));
}
function ctxWith(headers) {
    const req = { headers };
    const ctx = { switchToHttp: () => ({ getRequest: () => req }) };
    return { ctx, req };
}
function futureIso(msFromNow = 60 * 60 * 1000) {
    return new Date(Date.now() + msFromNow).toISOString();
}
function getAddressFactory() {
    class Probe {
        handler(_addr) { }
    }
    __decorate([
        __param(0, (0, cat21_session_guard_1.Cat21SessionAddress)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], Probe.prototype, "handler", null);
    const meta = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, Probe, 'handler');
    const key = Object.keys(meta)[0];
    return meta[key].factory;
}
describe('Cat21SessionGuard', () => {
    let guard;
    beforeEach(() => {
        guard = new cat21_session_guard_1.Cat21SessionGuard();
    });
    it.each([
        ['all three missing', {}],
        ['only address', { 'x-cat21-session-address': ADDR }],
        ['address + validUntil, no signature', { 'x-cat21-session-address': ADDR, 'x-cat21-session-valid-until': futureIso() }],
        ['validUntil + signature, no address', { 'x-cat21-session-valid-until': futureIso(), 'x-cat21-session-signature': 'sig' }],
        ['empty-string address', { 'x-cat21-session-address': '', 'x-cat21-session-valid-until': futureIso(), 'x-cat21-session-signature': 'sig' }],
    ])('rejects with session-headers-missing when %s', (_label, headers) => {
        const { ctx } = ctxWith(headers);
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown).toBeInstanceOf(common_1.UnauthorizedException);
        expect(thrown.getResponse()).toMatchObject({ code: 'session-headers-missing' });
    });
    it('rejects a malformed timestamp before ever touching the signature', () => {
        const { ctx } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': 'not-a-real-date',
            'x-cat21-session-signature': 'sig',
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown.getResponse()).toMatchObject({ code: 'session-malformed-timestamp' });
    });
    it('rejects an expired session (code carries the validity reason)', () => {
        const { ctx } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': new Date(Date.now() - 1000).toISOString(),
            'x-cat21-session-signature': 'sig',
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown.getResponse()).toMatchObject({ code: 'session-session-expired' });
    });
    it('rejects a session dated further out than the SDK cap', () => {
        const { ctx } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': futureIso(1000 * 60 * 60 * 24 * 3650),
            'x-cat21-session-signature': 'sig',
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown.getResponse()).toMatchObject({ code: 'session-session-too-far-in-future' });
    });
    it('rejects a signature payload the verifier cannot read, surfacing the SDK reason + detail', () => {
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': futureIso(),
            'x-cat21-session-signature': 'sig',
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown).toBeInstanceOf(common_1.UnauthorizedException);
        expect(thrown.getResponse()).toMatchObject({
            code: 'session-malformed-signature',
            detail: expect.stringContaining('base64 decode failed'),
        });
        expect(req.cat21SessionAddress).toBeUndefined();
    });
    it('rejects a real signature over a different message (the canonical message is rebuilt, not trusted)', () => {
        const validUntilIso = futureIso();
        const signature = signSession((0, cat21_session_1.buildCat21SessionMessage)({ address: ADDR, validUntilIso: futureIso(2 * 60 * 60 * 1000) }));
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': signature,
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown.getResponse()).toMatchObject({
            code: 'session-signature-does-not-verify',
            detail: 'BIP-322 verify rejected: signature-does-not-verify',
        });
        expect(req.cat21SessionAddress).toBeUndefined();
    });
    it('rejects a real signature presented for another address', () => {
        const validUntilIso = futureIso();
        const signature = signSession((0, cat21_session_1.buildCat21SessionMessage)({ address: OTHER_ADDR, validUntilIso }));
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': OTHER_ADDR,
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': signature,
        });
        let thrown;
        try {
            guard.canActivate(ctx);
        }
        catch (e) {
            thrown = e;
        }
        expect(thrown.getResponse()).toMatchObject({ code: 'session-signature-does-not-verify' });
        expect(req.cat21SessionAddress).toBeUndefined();
    });
    it('accepts a session signed over the canonical message and stashes the verified address', () => {
        const validUntilIso = futureIso();
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': signSession((0, cat21_session_1.buildCat21SessionMessage)({ address: ADDR, validUntilIso })),
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(req.cat21SessionAddress).toBe(ADDR);
    });
    it('reads a header delivered as a string array (fastify multi-value): takes the first element', () => {
        const validUntilIso = futureIso();
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': [ADDR, 'second-ignored'],
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': signSession((0, cat21_session_1.buildCat21SessionMessage)({ address: ADDR, validUntilIso })),
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(req.cat21SessionAddress).toBe(ADDR);
    });
});
describe('@Cat21SessionAddress() param decorator', () => {
    it('returns the address the guard stashed on the request', () => {
        const factory = getAddressFactory();
        const req = { cat21SessionAddress: ADDR };
        const ctx = { switchToHttp: () => ({ getRequest: () => req }) };
        expect(factory(undefined, ctx)).toBe(ADDR);
    });
    it('throws (internal misuse) when the guard never populated the address', () => {
        const factory = getAddressFactory();
        const req = { headers: {} };
        const ctx = { switchToHttp: () => ({ getRequest: () => req }) };
        expect(() => factory(undefined, ctx)).toThrow(/without @UseGuards\(Cat21SessionGuard\)/);
    });
});
//# sourceMappingURL=cat21-session.guard.spec.js.map