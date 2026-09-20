#!/bin/bash
# Zyro Hosting Panel - Installation Script
# Run with: sudo bash install.sh

set -e

echo "=========================================="
echo "  Zyro Hosting Panel - Installer"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# Check Ubuntu
if ! grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
    echo "WARNING: This installer is designed for Ubuntu. Proceed at your own risk."
fi

# Configuration
PANEL_PORT=22892
PANEL_USER="zyro"
PANEL_DIR="/opt/zyro-panel"
SERVERS_DIR="/var/lib/zyro-servers"
DATA_DIR="/opt/zyro-panel/data"

echo "[1/10] Updating system packages..."
apt-get update -qq

echo "[2/10] Installing required packages..."
apt-get install -y -qq curl wget gnupg software-properties-common net-tools > /dev/null 2>&1

echo "[3/10] Checking/installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo "  Node.js version: $(node --version)"

echo "[4/10] Checking/installing Java..."
if ! command -v java &> /dev/null; then
    apt-get install -y -qq openjdk-21-jre-headless > /dev/null 2>&1 || \
    apt-get install -y -qq openjdk-17-jre-headless > /dev/null 2>&1
fi
echo "  Java version: $(java -version 2>&1 | head -1)"

echo "[5/10] Creating system user '${PANEL_USER}'..."
if ! id "$PANEL_USER" &>/dev/null; then
    useradd -r -m -s /usr/sbin/nologin "$PANEL_USER"
    echo "  User '${PANEL_USER}' created"
else
    echo "  User '${PANEL_USER}' already exists"
fi

echo "[6/10] Creating directories..."
mkdir -p "$PANEL_DIR"
mkdir -p "$SERVERS_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$PANEL_DIR/frontend/dist"
chown -R "$PANEL_USER":"$PANEL_USER" "$SERVERS_DIR"
chown -R "$PANEL_USER":"$PANEL_USER" "$DATA_DIR"

echo "[7/10] Installing backend dependencies..."
cd "$PANEL_DIR"
# Copy backend files
if [ -d "./backend" ]; then
    cd backend
    npm install --production > /dev/null 2>&1
    cd "$PANEL_DIR"
else
    echo "  WARNING: Backend files not found. Copy them to $PANEL_DIR/backend/"
fi

echo "[8/10] Building frontend..."
if [ -d "./frontend/dist" ] && [ -f "./frontend/dist/index.html" ]; then
    cp -r frontend/dist/* "$PANEL_DIR/frontend/dist/" 2>/dev/null || true
    echo "  Frontend files copied"
else
    echo "  WARNING: Frontend build not found. Build it separately and copy to $PANEL_DIR/frontend/dist/"
fi

echo "[9/10] Creating environment configuration..."
if [ ! -f "$PANEL_DIR/.env" ]; then
    cat > "$PANEL_DIR/.env" << EOF
# Zyro Hosting Panel Configuration
PORT=${PANEL_PORT}
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=$(openssl rand -base64 16)
SERVERS_BASE=${SERVERS_DIR}
DB_PATH=${DATA_DIR}/zyro.db
JAVA_PATH=$(which java)
FRONTEND_PATH=${PANEL_DIR}/frontend/dist
CORS_ORIGIN=*
EOF
    echo "  .env file created at $PANEL_DIR/.env"
    echo "  IMPORTANT: Edit .env to set your ADMIN_EMAIL and ADMIN_PASSWORD"
else
    echo "  .env already exists, skipping"
fi

echo "[10/10] Creating systemd service..."
cat > /etc/systemd/system/zyro-panel.service << EOF
[Unit]
Description=Zyro Hosting Panel
After=network.target

[Service]
Type=simple
User=${PANEL_USER}
WorkingDirectory=${PANEL_DIR}/backend
ExecStart=/usr/bin/node ${PANEL_DIR}/backend/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

# Security
NoNewPrivileges=false
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable zyro-panel > /dev/null 2>&1
systemctl start zyro-panel

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Panel URL: http://$(hostname -I | awk '{print $1}'):${PANEL_PORT}"
echo "Panel Port: ${PANEL_PORT}"
echo ""
echo "Admin credentials (from .env):"
cat "$PANEL_DIR/.env" | grep -E "ADMIN_EMAIL|ADMIN_PASSWORD"
echo ""
echo "Useful commands:"
echo "  Status:    systemctl status zyro-panel"
echo "  Logs:      journalctl -u zyro-panel -f"
echo "  Restart:   systemctl restart zyro-panel"
echo "  Stop:      systemctl stop zyro-panel"
echo ""
echo "Server directories: ${SERVERS_DIR}"
echo "Database: ${DATA_DIR}/zyro.db"
echo ""
echo "IMPORTANT:"
echo "  - Edit $PANEL_DIR/.env to change admin credentials"
echo "  - Port 22891 is RESERVED (existing MC server)"
echo "  - Panel uses port 22892"
echo "  - New MC servers use ports 22893-22899"
echo ""
