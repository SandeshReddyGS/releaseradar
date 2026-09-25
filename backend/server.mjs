import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.mjs';
import authRouter, { authenticateToken, requireRole } from './auth.mjs';
import apiRouter from './api.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public Auth routes
app.use('/api/auth', authRouter);

// Protected Business routes
app.use('/api', apiRouter);

// Existing DB check route
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Example Protected Route to test RBAC
app.get('/api/admin-only', authenticateToken, requireRole(['Admin']), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.email}! You have verified access.` });
});

// Serve frontend static assets in production
if (process.env.APP_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});