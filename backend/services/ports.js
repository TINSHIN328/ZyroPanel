const db = require('../database');

// Protected ports that must never be allocated
const PROTECTED_PORTS = [22891, 22892];
// Available range for Minecraft servers
const AVAILABLE_PORTS = [22893, 22894, 22895, 22896, 22897, 22898, 22899];

function allocatePort() {
  // Get all ports currently in use from database
  const usedPorts = db.prepare('SELECT port FROM servers').all().map(s => s.port);

  // Find first available port
  for (const port of AVAILABLE_PORTS) {
    if (PROTECTED_PORTS.includes(port)) continue;
    if (usedPorts.includes(port)) continue;

    // Also check if port is actually listening (extra safety)
    if (isPortInUse(port)) continue;

    return port;
  }

  return null; // No ports available
}

function releasePort(port) {
  // Port is released when server is deleted from DB
  // This function is a hook for any additional cleanup
  console.log(`[PORT] Released port ${port}`);
}

function isPortInUse(port) {
  try {
    const net = require('net');
    const server = net.createServer();
    let inUse = false;

    // Synchronous check using child_process
    const { execSync } = require('child_process');
    try {
      execSync(`ss -tlnp | grep -q ":${port} "`, { stdio: 'ignore' });
      inUse = true;
    } catch (e) {
      inUse = false;
    }
    return inUse;
  } catch (e) {
    return false;
  }
}

function validatePort(port) {
  if (PROTECTED_PORTS.includes(port)) {
    throw new Error(`Port ${port} is protected and cannot be used`);
  }
  if (!AVAILABLE_PORTS.includes(port)) {
    throw new Error(`Port ${port} is not in the allowed range`);
  }
  return true;
}

module.exports = { allocatePort, releasePort, isPortInUse, validatePort, AVAILABLE_PORTS, PROTECTED_PORTS };
