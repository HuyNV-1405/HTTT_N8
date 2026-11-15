import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

export const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Healthcheck endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Warehouse Management System (WMS) API',
      version: '1.0.0',
    });
  });

  // RESTful API Routes
  app.use('/api', apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
