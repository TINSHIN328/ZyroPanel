# Zyro Hosting Panel

A complete, self-hosted Minecraft server hosting panel for Linux VPS. No Docker required.

## Features

- 🎮 **Minecraft Server Management** - Create, start, stop, restart servers
- 👤 **User Authentication** - Secure registration/login with JWT
- 📊 **Dashboard** - Modern dark UI with real-time status
- 🖥️ **Console** - Live server log viewer
- 📁 **File Manager** - Browse, edit, upload, download files
- ⚙️ **Server Settings** - Edit server.properties from the panel
- 🛡️ **Admin Panel** - Manage all users and servers
- 🔒 **Security** - Path traversal protection, rate limiting, input validation
- 📦 **Resource Limits** - systemd-based memory/CPU limits per server
- 🆓 **Free Plan** - 1 server per user, 1GB RAM

## Architecture

```
zyro-panel/
├── backend/              # Node.js + Express API
│   ├── server.js         # Main entry point
│   ├── database.js       # SQLite setup
│   ├── routes/           # API routes
│   ├── middleware/        # Auth middleware
│   └── services/         # Business logic
├── frontend/             # React + Vite dashboard
│   └── dist/             # Built frontend files
├── scripts/              # Installation scripts
│   ├── install.sh
│   └── uninstall.sh
├── systemd/              # Service templates
├── config/               # Configuration examples
└── README.md
```

## Requirements

- Ubuntu Linux (18.04+)
- Node.js 18+ (installed by script)
- Java 17+ (installed by script)
- systemd
- Root access for installation

## Quick Install

```bash
# Clone or copy the project to your VPS
cd /opt
git clone <your-repo> zyro-panel
cd zyro-panel

# Run the installer
sudo bash scripts/install.sh
```

The installer will:
1. Install Node.js and Java if not present
2. Create system user `zyro`
3. Create required directories
4. Install backend dependencies
5. Configure environment
6. Create and start systemd service
7. Print access URL and admin credentials

## After Installation

```bash
# Check panel status
systemctl status zyro-panel

# View logs
journalctl -u zyro-panel -f

# Restart panel
systemctl restart zyro-panel

# Stop panel
systemctl stop zyro-panel
```

## Access the Panel

- URL: `http://YOUR_SERVER_IP:22892`
- Admin login: Check `/opt/zyro-panel/.env` for credentials

## Port Map

| Port  | Purpose                    |
|-------|----------------------------|
| 22891 | Existing MC server (DO NOT TOUCH) |
| 22892 | Zyro Panel (web interface) |
| 22893 | MC Server slot 1           |
| 22894 | MC Server slot 2           |
| 22895 | MC Server slot 3           |
| 22896 | MC Server slot 4           |
| 22897 | MC Server slot 5           |
| 22898 | MC Server slot 6           |
| 22899 | MC Server slot 7           |

## How Users Create a Server

1. Register at the panel URL
2. Go to Dashboard
3. Click "Create Server"
4. Enter server name, select Minecraft version and software (Paper/Vanilla)
5. Server is created with:
   - Unique directory in `/var/lib/zyro-servers/<id>/`
   - Auto-downloaded server JAR
   - Auto-accepted EULA
   - Auto-assigned port (22893-22899)
   - systemd service with 1GB RAM limit
6. Click "Start" to launch the server
7. Connect using `YOUR_IP:ASSIGNED_PORT`

## Security Features

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT authentication with 7-day expiry
- ✅ Rate limiting on auth endpoints (20/15min)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Path traversal protection in file manager
- ✅ Server ID validation (no shell injection)
- ✅ Strict allowlist for systemctl commands
- ✅ Admin authorization middleware
- ✅ User ownership checks on all server endpoints
- ✅ Audit logging
- ✅ No arbitrary command execution
- ✅ No Docker (native Linux processes)

## Troubleshooting

### Panel won't start
```bash
journalctl -u zyro-panel -n 50 --no-pager
```

### Server won't start
```bash
# Check the server's systemd service
systemctl status zyro-server-<ID>
journalctl -u zyro-server-<ID> -n 50
```

### Port conflicts
```bash
# Check what's using a port
ss -tlnp | grep 2289
```

### Database issues
```bash
# Backup
cp /opt/zyro-panel/data/zyro.db /opt/zyro-panel/data/zyro.db.backup
```

### Permission issues
```bash
chown -R zyro:zyro /var/lib/zyro-servers
chown -R zyro:zyro /opt/zyro-panel/data
```

## Configuration

Edit `/opt/zyro-panel/.env`:

```env
PORT=22892                    # Panel port
JWT_SECRET=<random-string>    # Auth secret
ADMIN_EMAIL=admin@example.com # Admin email
ADMIN_PASSWORD=secure-pass    # Admin password
SERVERS_BASE=/var/lib/zyro-servers
JAVA_PATH=/usr/bin/java
```

## Uninstall

```bash
sudo bash scripts/uninstall.sh
```

## Notes

- This panel is completely independent from PufferPanel
- The existing Minecraft server on port 22891 is never touched
- Each Minecraft server runs as a separate systemd service
- Resource limits are enforced by systemd (MemoryMax=1G)
- Maximum 7 new servers (ports 22893-22899)
- Each user gets exactly 1 free server

## License

MIT
