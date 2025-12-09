import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger.config';

export function setupSwagger(app: Express): void {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'Transporte Universitário - API Docs',
        swaggerOptions: {
            persistAuthorization: true,
        },
    }));
}
