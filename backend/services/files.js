const fs = require('fs');
const path = require('path');

// CRITICAL: Path traversal protection
function resolveSafePath(baseDir, userPath) {
  // Normalize and resolve the path
  const normalizedBase = path.resolve(baseDir);
  const normalizedUser = path.resolve(normalizedBase, '.' + (userPath.startsWith('/') ? userPath : '/' + userPath));

  // Ensure the resolved path is within the base directory
  if (!normalizedUser.startsWith(normalizedBase + path.sep) && normalizedUser !== normalizedBase) {
    throw new Error('Access denied: path traversal detected');
  }

  // Block access to sensitive paths
  const blocked = ['..', '../', '/etc', '/root', '/var/log', '/proc', '/sys'];
  for (const b of blocked) {
    if (userPath.includes(b)) {
      throw new Error('Access denied: blocked path pattern');
    }
  }

  return normalizedUser;
}

function listFiles(baseDir, userPath) {
  const targetPath = resolveSafePath(baseDir, userPath);

  if (!fs.existsSync(targetPath)) {
    return { files: [], path: userPath };
  }

  const stat = fs.statSync(targetPath);

  // If it's a file, return its content (for editing)
  if (stat.isFile()) {
    // Check file size (max 5MB for editing)
    if (stat.size > 5 * 1024 * 1024) {
      return { content: '[File too large to display]', path: userPath };
    }
    const content = fs.readFileSync(targetPath, 'utf-8');
    return { content, path: userPath };
  }

  // If it's a directory, list contents
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const files = entries.map(entry => {
      const entryPath = path.join(targetPath, entry.name);
      let size = '';
      try {
        const entryStat = fs.statSync(entryPath);
        if (entryStat.isFile()) {
          size = formatSize(entryStat.size);
        }
      } catch (e) {}

      return {
        name: entry.name,
        isDir: entry.isDirectory(),
        size,
      };
    });

    // Sort: directories first, then files
    files.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    return { files, path: userPath };
  }

  return { files: [], path: userPath };
}

function readFile(baseDir, userPath) {
  const targetPath = resolveSafePath(baseDir, userPath);

  if (!fs.existsSync(targetPath)) {
    throw new Error('File not found');
  }

  const stat = fs.statSync(targetPath);
  if (!stat.isFile()) {
    throw new Error('Not a file');
  }

  if (stat.size > 5 * 1024 * 1024) {
    throw new Error('File too large');
  }

  return fs.readFileSync(targetPath, 'utf-8');
}

function writeFile(baseDir, userPath, content, newName) {
  let targetPath = resolveSafePath(baseDir, userPath);

  if (newName) {
    // Rename file
    const dir = path.dirname(targetPath);
    // Validate new name
    if (newName.includes('/') || newName.includes('..')) {
      throw new Error('Invalid file name');
    }
    const newPath = path.join(dir, newName);
    // Ensure new path is still safe
    resolveSafePath(baseDir, path.relative(baseDir, newPath));

    if (fs.existsSync(targetPath)) {
      fs.renameSync(targetPath, newPath);
      targetPath = newPath;
    }
  }

  // Write content
  if (content !== undefined) {
    // Ensure parent directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, content, 'utf-8');
  }
}

function deleteFile(baseDir, userPath) {
  const targetPath = resolveSafePath(baseDir, userPath);

  // Don't allow deleting the base directory itself
  if (path.resolve(targetPath) === path.resolve(baseDir)) {
    throw new Error('Cannot delete server root directory');
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error('File not found');
  }

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(targetPath);
  }
}

function createFileOrDir(baseDir, userPath, content, isDir) {
  const targetPath = resolveSafePath(baseDir, userPath);

  if (fs.existsSync(targetPath)) {
    throw new Error('Already exists');
  }

  if (isDir) {
    fs.mkdirSync(targetPath, { recursive: true });
  } else {
    // Ensure parent directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, content || '', 'utf-8');
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = { listFiles, readFile, writeFile, deleteFile, createFileOrDir, resolveSafePath };
