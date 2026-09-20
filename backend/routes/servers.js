const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { allocatePort, releasePort } = require('../services/ports');
const { createServer, deleteServer, startServer, stopServer, restartServer, getServerStatus, getServerLogs } = require('../services/minecraft');
const { listFiles, readFile, writeFile, deleteFile, createFileOrDir } = require('../services/files');

const router = express.Router();
router.use(authenticate);

// GET /api/servers
router.get('/', (req, res) => {
  const servers = db.prepare('SELECT * FROM servers WHERE user_id = ?').all(req.userId);
  res.json(servers);
});

// POST /api/servers - Create server
router.post('/', async (req, res) => {
  try {
    const { name, version, software } = req.body;

    if (!name || !version || !software) {
      return res.status(400).json({ error: 'Name, version, and software are required' });
    }

    // Validate software
    if (!['paper', 'vanilla'].includes(software)) {
      return res.status(400).json({ error: 'Invalid software. Use paper or vanilla.' });
    }

    // Check if user already has a server
    const existing = db.prepare('SELECT id FROM servers WHERE user_id = ?').get(req.userId);
    if (existing) {
      return res.status(403).json({ error: 'You already have a server. Free plan allows only 1 server.' });
    }

    // Allocate port
    const port = allocatePort();
    if (!port) {
      return res.status(503).json({ error: 'No free Minecraft ports available.' });
    }

    // Create server
    const serverId = await createServer({
      userId: req.userId,
      name,
      version,
      software,
      port,
    });

    // Audit log
    db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
      .run(req.userId, 'create_server', `Created server: ${name} on port ${port}`, req.ip);

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
    res.status(201).json(server);
  } catch (err) {
    console.error('[CREATE SERVER ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to create server' });
  }
});

// GET /api/servers/:id
router.get('/:id', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json(server);
});

// DELETE /api/servers/:id
router.delete('/:id', async (req, res) => {
  try {
    const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    await deleteServer(server);
    releasePort(server.port);

    db.prepare('INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)')
      .run(req.userId, 'delete_server', `Deleted server: ${server.name}`, req.ip);

    res.json({ message: 'Server deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/start
router.post('/:id/start', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await startServer(server);
    res.json({ message: 'Server starting' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/stop
router.post('/:id/stop', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await stopServer(server);
    res.json({ message: 'Server stopping' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/restart
router.post('/:id/restart', async (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await restartServer(server);
    res.json({ message: 'Server restarting' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/servers/:id/status
router.get('/:id/status', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const status = getServerStatus(server);
  res.json(status);
});

// GET /api/servers/:id/logs
router.get('/:id/logs', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const logs = getServerLogs(server);
  res.json({ logs });
});

// GET /api/servers/:id/files
router.get('/:id/files', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const reqPath = req.query.path || '/';
  try {
    const result = listFiles(server.directory, reqPath);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/servers/:id/files
router.post('/:id/files', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const { path: filePath, content, isDir } = req.body;
  try {
    createFileOrDir(server.directory, filePath, content, isDir);
    res.json({ message: 'Created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/servers/:id/files
router.delete('/:id/files', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const { path: filePath } = req.body;
  try {
    deleteFile(server.directory, filePath);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/servers/:id/files
router.put('/:id/files', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const { path: filePath, content, newName } = req.body;
  try {
    writeFile(server.directory, filePath, content, newName);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/servers/:id/settings
router.get('/:id/settings', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const propsPath = path.join(server.directory, 'server.properties');
  let properties = {};
  if (fs.existsSync(propsPath)) {
    const content = fs.readFileSync(propsPath, 'utf-8');
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...vals] = line.split('=');
        if (key) properties[key.trim()] = vals.join('=').trim();
      }
    });
  }
  res.json({ properties });
});

// PUT /api/servers/:id/settings
router.put('/:id/settings', (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  const propsPath = path.join(server.directory, 'server.properties');
  const allowedKeys = ['gamemode', 'difficulty', 'max-players', 'motd', 'online-mode', 'view-distance', 'pvp', 'allow-flight', 'server-port'];

  let content = '';
  if (fs.existsSync(propsPath)) {
    content = fs.readFileSync(propsPath, 'utf-8');
  }

  const updates = req.body;
  const lines = content.split('\n');
  const updated = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && !line.startsWith('#')) {
      const [key] = line.split('=');
      if (key && allowedKeys.includes(key.trim()) && updates[key.trim()] !== undefined) {
        lines[i] = `${key.trim()}=${updates[key.trim()]}`;
        updated[key.trim()] = true;
      }
    }
  }

  // Add any new keys not already in file
  for (const [key, value] of Object.entries(updates)) {
    if (allowedKeys.includes(key) && !updated[key]) {
      lines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(propsPath, lines.join('\n'));
  res.json({ message: 'Settings saved' });
});

module.exports = router;
