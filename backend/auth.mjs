// backend/auth.mjs
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.mjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_local_key';

// 1. Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token containing identity and role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 1b. Register Endpoint (New)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role]
    );

    res.status(201).json({ message: 'User registered', user: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit an existing project
router.put('/projects/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { name, team } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, team = $2 WHERE id = $3 RETURNING *',
      [name, team, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
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

// 2. Authentication Middleware (verifies JWT)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer "

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decodedUser;
    next();
  });
};

// 3. RBAC Middleware (enforces specific roles)
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

export default router;