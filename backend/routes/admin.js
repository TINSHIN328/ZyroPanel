const express = require('express');
const db = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { startServer, stopServer, deleteServer } = require('../services/minecraft');
const { releasePort } = require('../services/ports');

const router = express.Router();
router.use(authenticate);
router.use(adminOnly);

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, email, role, suspended, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// GET /api/admin/servers
router.get('/servers', (req, res) => {
  const servers = db.prepare(`
    SELECT s.*, u.email as user_email 
    FROM servers s 
    LEFT JOIN users u ON s.user_id = u.id 
    ORDER BY s.created_at DESC
  `).all();
  res.json(servers);
});

// POST /api/admin/servers/:id/start
router.post('/servers/:id/start', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await startServer(server);
    db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
      .run(req.userId, 'admin_start_server', `Admin started server ${server.name}`, req.ip);
    res.json({ message: 'Server starting' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/servers/:id/stop
router.post('/servers/:id/stop', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await stopServer(server);
    db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
      .run(req.userId, 'admin_stop_server', `Admin stopped server ${server.name}`, req.ip);
    res.json({ message: 'Server stopping' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/servers/:id/delete
router.post('/servers/:id/delete', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await deleteServer(server);
    releasePort(server.port);
    db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
      .run(req.userId, 'admin_delete_server', `Admin deleted server ${server.name}`, req.ip);
    res.json({ message: 'Server deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newState = user.suspended ? 0 : 1;
  db.prepare('UPDATE users SET suspended = ? WHERE id = ?').run(newState, req.params.id);

  db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
    .run(req.userId, newState ? 'suspend_user' : 'unsuspend_user', `Admin ${newState ? 'suspended' : 'unsuspended'} user ${user.email}`, req.ip);

  res.json({ message: newState ? 'User suspended' : 'User unsuspended', suspended: newState });
});

module.exports = router;
