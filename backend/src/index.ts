import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
import assetsRouter from './routes/assets';
import transactionsRouter from './routes/transactions';
import importRouter from './routes/import';
import dashboardRouter from './routes/dashboardRoutes';
import cashflowRouter from './routes/cashflow';
import familiesRouter from './routes/v1/families';
import familyMembersRouter from './routes/v1/familyMembers';
import entitiesRouter from './routes/v1/entities';
import accountsRouter from './routes/v1/accounts';
import assetsMasterRouter from './routes/v1/assetsMaster';
import holdingsRouter from './routes/v1/holdings';
import { insuranceRouter } from './routes/insuranceRoutes';
import domainRoutes from './routes';
import { syncAllAssets } from './services/marketSync';
import { syncLogRepository } from './repositories/SQLiteSyncLogRepository';
import { correlationMiddleware } from './middleware/correlationMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '127.0.0.1'; // Restrict Express binding strictly to localhost

// Hardened CORS Origin Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Family-Id']
}));

// Express Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(correlationMiddleware);

// Initialize Database Tables
initDb();

// Mount Legacy & Domain v1 Routes with resilient path aliases
app.use(['/api/assets', '/api/v1/assets', '/api/v1/v1/assets'], assetsRouter);
app.use(['/api/transactions', '/api/v1/transactions', '/api/v1/v1/transactions'], transactionsRouter);
app.use(['/api/import', '/api/v1/import', '/api/v1/v1/import'], importRouter);
app.use(['/api/dashboard', '/api/v1/dashboard', '/api/v1/v1/dashboard'], dashboardRouter);
app.use(['/api/cashflow', '/api/v1/cashflow', '/api/v1/v1/cashflow'], cashflowRouter);

app.use(['/api/families', '/api/v1/families', '/api/v1/v1/families'], familiesRouter);
app.use(['/api/family-members', '/api/v1/family-members', '/api/v1/v1/family-members'], familyMembersRouter);
app.use(['/api/entities', '/api/v1/entities', '/api/v1/v1/entities'], entitiesRouter);
app.use(['/api/accounts', '/api/v1/accounts', '/api/v1/v1/accounts'], accountsRouter);
app.use(['/api/assets-master', '/api/v1/assets-master', '/api/v1/v1/assets-master'], assetsMasterRouter);
app.use(['/api/holdings', '/api/v1/holdings', '/api/v1/v1/holdings'], holdingsRouter);
app.use(['/api/protection', '/api/v1/protection', '/api/v1/v1/protection'], insuranceRouter);
app.use(['/api/insurance', '/api/v1/insurance', '/api/v1/v1/insurance'], insuranceRouter);

// Mount domain routes (/graph, /estate, /planning, /tax, /recommendations, /ai, /dx, /auth)
app.use(['/api/v1', '/api/v1/v1', '/api'], domainRoutes);

// Sync Market Data Trigger Route
app.post(['/api/sync', '/api/v1/sync'], async (req, res, next) => {
  logger.info('Manual sync triggered via REST API...');
  try {
    const results = await syncAllAssets();
    res.json({
      success: true,
      message: 'Sync completed successfully.',
      details: results
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sync/logs - Fetch sync logs to verify activities
app.get('/api/sync/logs', (req, res, next) => {
  try {
    const logs = syncLogRepository.getRecentLogs(20);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// App Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: 'online', time: new Date().toISOString() });
});

// Register Centralized Error Handling Middleware
app.use(errorHandlerMiddleware);

// Start listening strictly on loopback interface (127.0.0.1)
app.listen(PORT, HOST, () => {
  logger.info(`===================================================`);
  logger.info(` Family Wealth OS Server listening on 127.0.0.1    `);
  logger.info(` Port: http://127.0.0.1:${PORT}                      `);
  logger.info(` Time: ${new Date().toLocaleString()}              `);
  logger.info(`===================================================`);
});
