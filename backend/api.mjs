// backend/api.mjs
import express from 'express';
import pool from './db.mjs';
import { authenticateToken, requireRole } from './auth.mjs';

const router = express.Router();

// Enforce valid JWT on all routes in this router
router.use(authenticateToken);

// 1. Get projects based on user role
router.get('/projects', async (req, res) => {
  try {
    let result;
    
    // Check the role stored inside the user's JWT
    if (req.user.role === 'Admin') {
      // Admins get unrestricted access to all projects
      result = await pool.query('SELECT * FROM projects ORDER BY id ASC');
    } else if (req.user.role === 'MobileTeamLead') {
      // Mobile Leads only get projects assigned to the Mobile team
      result = await pool.query(
        "SELECT * FROM projects WHERE team = 'Mobile' ORDER BY id ASC"
      );
    } else {
      // Fallback for any other roles
      result = { rows: [] }; 
    }

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

// Edit an existing project
router.put('/projects/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  
  // 1. Extract ALL fields from the incoming JSON body
  const { name, team, last_deploy_date, deploy_message } = req.body;
  
  try {
    // 2. Add the new fields to the SQL UPDATE statement
    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, 
           team = $2, 
           last_deploy_date = $3, 
           deploy_message = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, team, last_deploy_date, deploy_message, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit an existing deployment version
router.put('/deployments/:id', requireRole(['Admin', 'MobileTeamLead']), async (req, res) => {
  const { id } = req.params;
  const { environment, status, git_commit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE deployments SET environment = $1, status = $2, git_commit = $3 WHERE id = $4 RETURNING *',
      [environment, status, git_commit, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deployment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a project (Admin Only)
router.delete('/projects/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    // Run the SQL DELETE command and return the deleted row to confirm
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    // If no rows were returned, the ID didn't exist in the database
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Send a success message back to the frontend
    res.json({ 
      message: 'Project deleted successfully', 
      deletedProject: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;