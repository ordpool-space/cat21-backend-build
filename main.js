"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const helmet_1 = require("@fastify/helmet");
const config_1 = require("@nestjs/config");
const sharp = require("sharp");
const app_module_1 = require("./app.module");
const swagger_1 = require("./swagger");
sharp.cache(false);
sharp.concurrency(1);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: false, trustProxy: '127.0.0.1' }));
    await app.register(helmet_1.default, {
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
    });
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    (0, swagger_1.setupSwagger)(app);
    const cfg = app.get(config_1.ConfigService);
    const port = cfg.get('PORT', 3333);
    const host = cfg.get('HOST', '0.0.0.0');
    await app.listen(port, host);
    console.log(`API  : http://${host}:${port}`);
    console.log(`Docs : http://${host}:${port}/docs`);
}
bootstrap().catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map