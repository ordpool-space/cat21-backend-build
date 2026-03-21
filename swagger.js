"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
function setupSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('CAT-21 Backend')
        .setDescription('REST API for CAT-21 cat data with traits')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            defaultModelsExpandDepth: -1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            tryItOutEnabled: true,
        },
    });
}
//# sourceMappingURL=swagger.js.map