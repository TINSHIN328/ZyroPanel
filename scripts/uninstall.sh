#!/bin/bash
# Zyro Hosting Panel - Uninstallation Script
# Run with: sudo bash uninstall.sh

set -e

echo "=========================================="
echo "  Zyro Hosting Panel - Uninstaller"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

echo "WARNING: This will remove the Zyro Hosting Panel."
echo "It will NOT remove Minecraft server data."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo "[1/5] Stopping panel service..."
systemctl stop zyro-panel 2>/dev/null || true
systemctl disable zyro-panel 2>/dev/null || true

echo "[2/5] Removing systemd service..."
rm -f /etc/systemd/system/zyro-panel.service
systemctl daemon-reload

echo "[3/5] Stopping all Minecraft servers..."
for service in /etc/systemd/system/zyro-server-*.service; do
    if [ -f "$service" ]; then
        name=$(basename "$service" .service)
        systemctl stop "$name" 2>/dev/null || true
        systemctl disable "$name" 2>/dev/null || true
        echo "  Stopped: $name"
    fi
done

echo "[4/5] Removing panel files..."
rm -rf /opt/zyro-panel
echo "  Removed /opt/zyro-panel"

echo "[5/5] Removing system user..."
if id "zyro" &>/dev/null; then
    userdel zyro 2>/dev/null || true
    echo "  Removed user 'zyro'"
fi

echo ""
echo "=========================================="
echo "  Uninstallation Complete"
echo "=========================================="
echo ""
echo "NOTE: Minecraft server data at /var/lib/zyro-servers/ was NOT removed."
echo "To remove it: rm -rf /var/lib/zyro-servers/"
echo ""
