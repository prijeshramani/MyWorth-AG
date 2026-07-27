import { Router } from 'express';
import { SwaggerController } from '../controllers/SwaggerController';

const router = Router();

router.get('/', SwaggerController.getSwaggerUiHtml);
router.get('/swagger.json', SwaggerController.getOpenApiJson);

export default router;
