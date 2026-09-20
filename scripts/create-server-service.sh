#!/bin/bash
# Create a systemd service for a Minecraft server
# Usage: bash create-server-service.sh <server-id> <directory> <port>

set -e

SERVER_ID="$1"
SERVER_DIR="$2"
SERVER_PORT="$3"

if [ -z "$SERVER_ID" ] || [ -z "$SERVER_DIR" ] || [ -z "$SERVER_PORT" ]; then
    echo "Usage: $0 <server-id> <directory> <port>"
    exit 1
fi

# Validate server ID (alphanumeric and hyphens only)
if ! echo "$SERVER_ID" | grep -qE '^[a-zA-Z0-9_-]+$'; then
    echo "ERROR: Invalid server ID format"
    exit 1
fi

SERVICE_NAME="zyro-server-${SERVER_ID}"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
JAVA_PATH="${JAVA_PATH:-/usr/bin/java}"

# Determine JAR file
if [ -f "${SERVER_DIR}/paper.jar" ]; then
    JAR_FILE="paper.jar"
elif [ -f "${SERVER_DIR}/server.jar" ]; then
    JAR_FILE="server.jar"
else
    echo "ERROR: No server JAR found in ${SERVER_DIR}"
    exit 1
fi

# Create log directory
mkdir -p "${SERVER_DIR}/logs"

cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Zyro Minecraft Server ${SERVER_ID}
After=network.target

[Service]
Type=simple
WorkingDirectory=${SERVER_DIR}
ExecStart=${JAVA_PATH} -Xms128M -Xmx1024M -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -jar ${JAR_FILE} nogui
Restart=on-failure
RestartSec=10

# Resource limits - 1GB RAM max
MemoryMax=1G
MemorySwapMax=0
CPUQuota=100%
TasksMax=512

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${SERVER_DIR}
ProtectHome=true
PrivateTmp=true

# Logging
StandardOutput=append:${SERVER_DIR}/logs/latest.log
StandardError=append:${SERVER_DIR}/logs/latest.log

[Install]
WantedBy=multi-user.target
EOF

echo "Service created: ${SERVICE_PATH}"
echo "Service name: ${SERVICE_NAME}"

# Reload systemd
systemctl daemon-reload

echo "Service ready. Start with: systemctl start ${SERVICE_NAME}"
