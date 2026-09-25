// backend/api.mjs
import express from 'express';
import pool from './db.mjs';
import { authenticateToken, requireRole } from './auth.mjs';

const router = express.Router();

// Enforce valid JWT on all routes in this router
router.use(authenticateToken);

// 1. Get all projects (Accessible to any authenticated user)
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create a new project (Admin Only)
router.post('/projects', requireRole(['Admin']), async (req, res) => {
  const { name, team } = req.body;
  if (!name || !team) return res.status(400).json({ error: 'Name and team required' });

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, team) VALUES ($1, $2) RETURNING *',
      [name, team]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get deployments for a specific project
router.get('/projects/:id/deployments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM deployments WHERE project_id = $1 ORDER BY deployed_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Record a new deployment (Admin & MobileTeamLead)
router.post('/deployments', async (req, res) => {
  const { project_id, environment, status, git_commit } = req.body;
  if (!project_id || !environment || !status) {
    return res.status(400).json({ error: 'Missing required deployment fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO deployments (project_id, environment, status, git_commit) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, environment, status, git_commit]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;