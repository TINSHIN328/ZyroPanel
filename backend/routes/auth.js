const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);

  // Audit log
  db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'register', `New user registered: ${email}`, req.ip);

  const user = db.prepare('SELECT id, email, role, suspended, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user.id);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.suspended) {
    return res.status(403).json({ error: 'Account suspended' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Audit log
  db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
    .run(user.id, 'login', `User logged in`, req.ip);

  const token = generateToken(user.id);
  const safeUser = { id: user.id, email: user.email, role: user.role, suspended: user.suspended, created_at: user.created_at };

  res.json({ token, user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
    .run(req.userId, 'logout', 'User logged out', req.ip);
  res.json({ message: 'Logged out' });
});

module.exports = router;
