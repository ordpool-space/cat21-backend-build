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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let AppController = class AppController {
    getRoot() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>CAT-21 Backend API</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:monospace;background:#FF9900;color:white;text-align:center;padding:2em">
  <h1>CAT-21 Backend API</h1>
  <p>Meow! Rescue the cats!</p>
  <ul style="list-style:none;padding:0">
    <li><a href="https://cat21.space" style="color:white">cat21.space</a></li>
    <li><a href="https://github.com/ordpool-space/cat21" style="color:white">CAT-21 Protocol</a></li>
    <li><a href="/docs" style="color:white">API Docs (Swagger)</a></li>
  </ul>
</body>
</html>`;
    }
    getRobots() {
        return 'User-agent: *\nDisallow: /';
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Header)('Content-Type', 'text/html'),
    openapi.ApiResponse({ status: 200, type: String }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getRoot", null);
__decorate([
    (0, common_1.Get)('robots.txt'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Header)('Cache-Control', 'public, max-age=604800, immutable'),
    (0, common_1.Header)('Content-Type', 'text/plain'),
    openapi.ApiResponse({ status: 200, type: String }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getRobots", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map