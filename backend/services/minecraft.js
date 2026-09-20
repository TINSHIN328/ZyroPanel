const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const db = require('../database');

const SERVERS_BASE = process.env.SERVERS_BASE || '/var/lib/zyro-servers';
const JAVA_PATH = process.env.JAVA_PATH || '/usr/bin/java';

// Validate server ID to prevent injection
function validateServerId(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(String(id))) {
    throw new Error('Invalid server ID');
  }
  return String(id);
}

function getServiceName(serverId) {
  return `zyro-server-${validateServerId(serverId)}`;
}

async function createServer({ userId, name, version, software, port }) {
  // Generate unique server ID
  const { v4: uuidv4 } = require('uuid');
  const serverId = uuidv4().split('-')[0]; // Short ID
  validateServerId(serverId);

  const directory = path.join(SERVERS_BASE, serverId);

  // Create directory
  fs.mkdirSync(directory, { recursive: true });

  // Create eula.txt
  fs.writeFileSync(path.join(directory, 'eula.txt'), 'eula=true\n');

  // Download server JAR
  const jarName = software === 'paper' ? 'paper.jar' : 'server.jar';
  await downloadServerJar(software, version, path.join(directory, jarName));

  // Create server.properties
  const props = generateServerProperties(port, version);
  fs.writeFileSync(path.join(directory, 'server.properties'), props);

  // Create systemd service
  createSystemdService(serverId, directory, port);

  // Insert into database
  const result = db.prepare(
    'INSERT INTO servers (user_id, name, directory, port, version, software, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, name, directory, port, version, software, 'offline');

  return result.lastInsertRowid;
}

async function downloadServerJar(software, version, destPath) {
  let url;

  if (software === 'paper') {
    // Paper API - use PaperMC downloads API
    url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds`;
    try {
      const builds = await fetchJson(url);
      if (!builds.builds || builds.builds.length === 0) {
        throw new Error(`No Paper builds found for ${version}`);
      }
      // Get latest successful build
      const latestBuild = builds.builds.filter(b => b.result === 'success').pop();
      if (!latestBuild) throw new Error(`No successful Paper build for ${version}`);
      const fileName = latestBuild.downloads.application.name;
      url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild.build}/downloads/${fileName}`;
    } catch (e) {
      // Fallback: try direct URL pattern
      console.log(`[MC] Paper API failed, trying fallback for ${version}`);
      url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds`;
      throw new Error(`Failed to download Paper ${version}: ${e.message}`);
    }
  } else {
    // Vanilla - use Mojang version manifest
    const manifest = await fetchJson('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const versionInfo = manifest.versions.find(v => v.id === version);
    if (!versionInfo) throw new Error(`Minecraft version ${version} not found`);

    const versionData = await fetchJson(versionInfo.url);
    url = versionData.downloads.server.url;
  }

  await downloadFile(url, destPath);
  console.log(`[MC] Downloaded ${software} ${version} to ${destPath}`);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    const request = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));

      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          request(response.headers.location, redirects + 1);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
    };

    request(url);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON response')); }
      });
    }).on('error', reject);
  });
}

function generateServerProperties(port, version) {
  return `#Zyro Hosting Panel - Auto-generated
server-port=${port}
gamemode=survival
difficulty=normal
max-players=20
motd=Zyro Hosting - Minecraft Server
online-mode=true
view-distance=10
pvp=true
allow-flight=false
spawn-protection=16
enable-command-block=true
level-name=world
level-seed=
level-type=default
generate-structures=true
max-world-size=29999984
network-compression-threshold=256
max-tick-time=60000
white-list=false
enforce-whitelist=false
resource-pack=
spawn-npcs=true
spawn-animals=true
spawn-monsters=true
`;
}

function createSystemdService(serverId, directory, port) {
  const serviceName = getServiceName(serverId);
  const jarName = fs.existsSync(path.join(directory, 'paper.jar')) ? 'paper.jar' : 'server.jar';

  const serviceContent = `[Unit]
Description=Zyro Minecraft Server ${serverId}
After=network.target

[Service]
Type=simple
WorkingDirectory=${directory}
ExecStart=${JAVA_PATH} -Xms128M -Xmx1024M -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -jar ${jarName} nogui
Restart=on-failure
RestartSec=10

# Resource limits
MemoryMax=1G
MemorySwapMax=0
CPUQuota=100%
TasksMax=512

# Security
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${directory}
ProtectHome=true
PrivateTmp=true

# Logging
StandardOutput=append:${directory}/logs/latest.log
StandardError=append:${directory}/logs/latest.log

[Install]
WantedBy=multi-user.target
`;

  const servicePath = `/etc/systemd/system/${serviceName}.service`;
  fs.writeFileSync(servicePath, serviceContent);

  try {
    execSync('systemctl daemon-reload');
  } catch (e) {
    console.warn('[SYSTEMD] daemon-reload failed (may need root):', e.message);
  }
}

async function startServer(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  try {
    execSync(`systemctl start ${serviceName}`, { timeout: 10000 });
    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run('online', server.id);
  } catch (e) {
    throw new Error(`Failed to start server: ${e.message}`);
  }
}

async function stopServer(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  try {
    execSync(`systemctl stop ${serviceName}`, { timeout: 30000 });
    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run('offline', server.id);
  } catch (e) {
    throw new Error(`Failed to stop server: ${e.message}`);
  }
}

async function restartServer(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  try {
    execSync(`systemctl restart ${serviceName}`, { timeout: 30000 });
    db.prepare('UPDATE servers SET status = ? WHERE id = ?').run('online', server.id);
  } catch (e) {
    throw new Error(`Failed to restart server: ${e.message}`);
  }
}

async function deleteServer(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  // Stop service
  try {
    execSync(`systemctl stop ${serviceName}`, { timeout: 15000 });
  } catch (e) {}

  // Disable service
  try {
    execSync(`systemctl disable ${serviceName}`, { timeout: 5000 });
  } catch (e) {}

  // Remove service file
  const servicePath = `/etc/systemd/system/${serviceName}.service`;
  if (fs.existsSync(servicePath)) {
    fs.unlinkSync(servicePath);
  }

  try {
    execSync('systemctl daemon-reload', { timeout: 5000 });
  } catch (e) {}

  // Remove server directory
  if (fs.existsSync(server.directory)) {
    fs.rmSync(server.directory, { recursive: true, force: true });
  }

  // Remove from database
  db.prepare('DELETE FROM servers WHERE id = ?').run(server.id);
}

function getServerStatus(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  let status = 'offline';
  let memory = 0;
  let cpu = 0;

  try {
    const result = execSync(`systemctl is-active ${serviceName}`, { encoding: 'utf-8' }).trim();
    status = result === 'active' ? 'online' : 'offline';
  } catch (e) {
    status = 'offline';
  }

  // Get memory usage from systemd
  try {
    const memResult = execSync(`systemctl show ${serviceName} -p MemoryCurrent --value`, { encoding: 'utf-8' }).trim();
    if (memResult && memResult !== '[not set]' && memResult !== '') {
      memory = Math.round(parseInt(memResult) / (1024 * 1024));
    }
  } catch (e) {}

  // Get CPU usage
  try {
    const cpuResult = execSync(`systemctl show ${serviceName} -p CPUUsageNSec --value`, { encoding: 'utf-8' }).trim();
    if (cpuResult && cpuResult !== '[not set]') {
      // Approximate CPU percentage (simplified)
      cpu = Math.min(100, Math.round(parseInt(cpuResult) / 1000000000));
    }
  } catch (e) {}

  // Get disk usage
  let disk = 0;
  try {
    const diskResult = execSync(`du -sm ${server.directory} 2>/dev/null | cut -f1`, { encoding: 'utf-8' }).trim();
    disk = parseInt(diskResult) || 0;
  } catch (e) {}

  // Update status in DB
  db.prepare('UPDATE servers SET status = ? WHERE id = ?').run(status, server.id);

  return { status, memory, cpu, disk };
}

function getServerLogs(server) {
  const serviceName = getServiceName(server.id);
  validateServerId(server.id);

  // Try reading from log file first
  const logPath = path.join(server.directory, 'logs', 'latest.log');
  if (fs.existsSync(logPath)) {
    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      // Return last 200 lines
      const lines = content.split('\n');
      return lines.slice(-200).join('\n');
    } catch (e) {}
  }

  // Fallback to journalctl
  try {
    const logs = execSync(`journalctl -u ${serviceName} -n 200 --no-pager`, {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return logs;
  } catch (e) {
    return 'No logs available. Server may not have been started yet.';
  }
}

module.exports = {
  createServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
  getServerStatus,
  getServerLogs,
  getServiceName,
  validateServerId,
};
