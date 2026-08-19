import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { loggerMiddleware } from './shared/middleware/logger.middleware';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { authRouter } from './modules/auth/auth.module';
import { usersRouter } from './modules/users/users.module';
import { filesRouter } from './modules/files/files.module';
import { jobsRouter } from './modules/jobs/jobs.module';
import { foldersRouter } from './modules/folders/folders.module';
import { openapiSpec } from './config/openapi';

export function createApp() {
  const app = express();

  // Seguridad
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 200,
      message: {
        success: false,
        message: 'Too many requests, please try again later',
      },
    }),
  );

  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(loggerMiddleware);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'DataForge',
    });
  });

  // Documentación OpenAPI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Rutas
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/files', filesRouter);
  app.use('/api/v1/jobs', jobsRouter);
  app.use('/api/v1/folders', foldersRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // Error handler
  app.use(errorMiddleware);

  return app;
}
