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
jest.mock('ordpool-sdk/core', () => ({
    ...jest.requireActual('ordpool-sdk/core'),
    verifyBip322Signature: jest.fn(),
}));
const core_1 = require("ordpool-sdk/core");
const cat21_session_guard_1 = require("./cat21-session.guard");
const mockVerify = core_1.verifyBip322Signature;
const ADDR = 'bc1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c';
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
        mockVerify.mockReset();
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
    it('rejects when BIP-322 verification fails, surfacing the SDK reason + detail', () => {
        mockVerify.mockReturnValue({ ok: false, reason: 'signature-does-not-verify', detail: 'schnorr verify failed' });
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
            code: 'session-signature-does-not-verify',
            detail: 'schnorr verify failed',
        });
        expect(req.cat21SessionAddress).toBeUndefined();
    });
    it('accepts a valid session, stashes the verified address, and verifies the rebuilt canonical message', () => {
        mockVerify.mockReturnValue({ ok: true });
        const validUntilIso = futureIso();
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': ADDR,
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': 'base64signature',
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(req.cat21SessionAddress).toBe(ADDR);
        expect(mockVerify).toHaveBeenCalledWith({
            address: ADDR,
            message: (0, core_1.buildCat21SessionMessage)({ address: ADDR, validUntilIso }),
            signatureBase64: 'base64signature',
        });
    });
    it('reads a header delivered as a string array (fastify multi-value): takes the first element', () => {
        mockVerify.mockReturnValue({ ok: true });
        const validUntilIso = futureIso();
        const { ctx, req } = ctxWith({
            'x-cat21-session-address': [ADDR, 'second-ignored'],
            'x-cat21-session-valid-until': validUntilIso,
            'x-cat21-session-signature': 'sig',
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