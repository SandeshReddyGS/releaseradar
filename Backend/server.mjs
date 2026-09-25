import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// API Health Check Route
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'success', 
        environment: process.env.APP_ENV || 'local',
        version: '1.0.0'
    });
});

// Serve React static files (used when deployed)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ReleaseRadar API running on port ${PORT}`);
});