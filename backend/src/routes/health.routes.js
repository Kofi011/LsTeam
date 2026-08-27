import express from 'express';
import { checkDbConnection } from '../config/db.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default router;
