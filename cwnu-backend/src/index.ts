import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { routes } from './routes';
import { prisma } from './config/prisma';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(config.apiPrefix, routes);

app.use((_, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.env} mode`);
});

const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;