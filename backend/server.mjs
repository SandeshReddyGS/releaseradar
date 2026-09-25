import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.mjs';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Database Health Check Route
app.get('/api/db-check', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'Database connected successfully', 
            time: result.rows[0].now 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Serve React static files (used when deployed)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ReleaseRadar API running on port ${PORT}`);
});