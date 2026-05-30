import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, db } from './db';
import assetsRouter from './routes/assets';
import transactionsRouter from './routes/transactions';
import importRouter from './routes/import';
import dashboardRouter from './routes/dashboard';
import cashflowRouter from './routes/cashflow';
import { syncAllAssets } from './services/marketSync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allows connections from local frontend on any port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database Tables
initDb();

// Mount Routes
app.use('/api/assets', assetsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/import', importRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/cashflow', cashflowRouter);

// Sync Market Data Trigger Route
app.post('/api/sync', async (req, res) => {
  console.log('Manual sync triggered via REST API...');
  try {
    const results = await syncAllAssets();
    res.json({
      success: true,
      message: 'Sync completed successfully.',
      details: results
    });
  } catch (error: any) {
    console.error('Manual sync failure:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Synchronization failed.'
    });
  }
});

// GET /api/sync/logs - Fetch sync logs to verify activities
app.get('/api/sync/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM sync_logs 
      ORDER BY timestamp DESC 
      LIMIT 20
    `).all();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// App Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: 'online', time: new Date().toISOString() });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` MyWorth Server is successfully running locally! `);
  console.log(` Port: http://localhost:${PORT}                      `);
  console.log(` Time: ${new Date().toLocaleString()}              `);
  console.log(`===================================================`);
});
