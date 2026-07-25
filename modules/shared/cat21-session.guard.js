"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Cat21SessionGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cat21SessionAddress = exports.Cat21SessionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("ordpool-sdk/core");
let Cat21SessionGuard = Cat21SessionGuard_1 = class Cat21SessionGuard {
    constructor() {
        this.logger = new common_1.Logger(Cat21SessionGuard_1.name);
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const address = readHeader(req, 'x-cat21-session-address');
        const validUntilIso = readHeader(req, 'x-cat21-session-valid-until');
        const signatureBase64 = readHeader(req, 'x-cat21-session-signature');
        if (!address || !validUntilIso || !signatureBase64) {
            throw new common_1.UnauthorizedException({
                code: 'session-headers-missing',
                detail: 'Requires X-Cat21-Session-Address, X-Cat21-Session-Valid-Until, and X-Cat21-Session-Signature headers.',
            });
        }
        const validity = (0, core_1.checkSessionValidity)(validUntilIso, Date.now());
        if (validity !== null) {
            throw new common_1.UnauthorizedException({
                code: `session-${validity}`,
                detail: `X-Cat21-Session-Valid-Until: ${validity} (${validUntilIso}).`,
            });
        }
        const message = (0, core_1.buildCat21SessionMessage)({ address, validUntilIso });
        const result = (0, core_1.verifyBip322Signature)({ address, message, signatureBase64 });
        if (!result.ok) {
            throw new common_1.UnauthorizedException({
                code: `session-${result.reason}`,
                detail: result.detail ?? `BIP-322 verify rejected: ${result.reason}`,
            });
        }
        req.cat21SessionAddress = address;
        return true;
    }
};
exports.Cat21SessionGuard = Cat21SessionGuard;
exports.Cat21SessionGuard = Cat21SessionGuard = Cat21SessionGuard_1 = __decorate([
    (0, common_1.Injectable)()
], Cat21SessionGuard);
exports.Cat21SessionAddress = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const addr = req.cat21SessionAddress;
    if (!addr) {
        throw new Error('@Cat21SessionAddress() used on a route without @UseGuards(Cat21SessionGuard)');
    }
    return addr;
});
function readHeader(req, name) {
    const v = req.headers[name];
    if (typeof v === 'string' && v.length > 0)
        return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string')
        return v[0];
    return null;
}
//# sourceMappingURL=cat21-session.guard.js.map