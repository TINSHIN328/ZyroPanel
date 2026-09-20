const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'zyro.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    suspended INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    directory TEXT NOT NULL,
    port INTEGER NOT NULL UNIQUE,
    version TEXT NOT NULL,
    software TEXT NOT NULL DEFAULT 'paper',
    status TEXT NOT NULL DEFAULT 'offline',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert admin user if ADMIN_EMAIL is set and doesn't exist
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'zyro-admin-2024';
    const hash = bcrypt.hashSync(defaultPassword, 12);
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(adminEmail, hash, 'admin');
    console.log(`[DB] Admin user created: ${adminEmail}`);
  }
}

module.exports = db;
