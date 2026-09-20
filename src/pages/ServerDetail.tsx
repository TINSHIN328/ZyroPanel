import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Terminal, FolderOpen, Settings, Play, Square, RotateCw, ArrowLeft, Cpu, HardDrive, Globe, Trash2, RefreshCw, FileText, Plus, Download, Edit3, Save, X, ChevronRight } from 'lucide-react';

export default function ServerDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [server, setServer] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tab = location.pathname.endsWith('/console') ? 'console' :
    location.pathname.endsWith('/files') ? 'files' :
    location.pathname.endsWith('/settings') ? 'settings' : 'overview';

  useEffect(() => {
    if (id) fetchServer();
  }, [id]);

  const fetchServer = async () => {
    try {
      const data = await api.getServer(id!);
      setServer(data);
      const st = await api.getServerStatus(id!);
      setStatus(st);
    } catch (e) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'start') await api.startServer(id!);
      if (action === 'stop') await api.stopServer(id!);
      if (action === 'restart') await api.restartServer(id!);
      fetchServer();
    } catch (e) {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zyro-accent"></div></div>;
  if (!server) return null;

  const tabs = [
    { key: 'overview', label: 'Overview', path: `/server/${id}`, icon: Cpu },
    { key: 'console', label: 'Console', path: `/server/${id}/console`, icon: Terminal },
    { key: 'files', label: 'Files', path: `/server/${id}/files`, icon: FolderOpen },
    { key: 'settings', label: 'Settings', path: `/server/${id}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-zyro-700 text-zyro-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{server.name}</h1>
            <p className="text-zyro-400 text-sm">{server.software} {server.version} • Port {server.port}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleAction('start')} disabled={server.status === 'online'} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-30 transition-colors text-sm">
            <Play className="w-4 h-4" /> Start
          </button>
          <button onClick={() => handleAction('stop')} disabled={server.status === 'offline'} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-30 transition-colors text-sm">
            <Square className="w-4 h-4" /> Stop
          </button>
          <button onClick={() => handleAction('restart')} disabled={server.status === 'offline'} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 disabled:opacity-30 transition-colors text-sm">
            <RotateCw className="w-4 h-4" /> Restart
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zyro-800 border border-zyro-600/30 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.key}
            to={t.path}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-zyro-accent/10 text-zyro-accent border border-zyro-accent/20' : 'text-zyro-300 hover:text-white hover:bg-zyro-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && <OverviewTab server={server} status={status} />}
      {tab === 'console' && <ConsoleTab serverId={id!} />}
      {tab === 'files' && <FilesTab serverId={id!} />}
      {tab === 'settings' && <SettingsTab serverId={id!} server={server} onRefresh={fetchServer} />}
    </div>
  );
}

function OverviewTab({ server, status }: { server: any; status: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Server Info</h3>
        <div className="space-y-3">
          <InfoRow label="Status" value={server.status} color={server.status === 'online' ? 'text-green-400' : 'text-red-400'} />
          <InfoRow label="Port" value={String(server.port)} />
          <InfoRow label="Version" value={`${server.software} ${server.version}`} />
          <InfoRow label="RAM Limit" value="1 GB" />
          <InfoRow label="Directory" value={server.directory} />
          <InfoRow label="Created" value={new Date(server.created_at).toLocaleDateString()} />
        </div>
      </div>
      <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zyro-300">Memory</span>
              <span className="text-zyro-200">{status?.memory || '0'} MB / 1024 MB</span>
            </div>
            <div className="h-2 bg-zyro-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-zyro-accent to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, ((status?.memory || 0) / 1024) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zyro-300">CPU</span>
              <span className="text-zyro-200">{status?.cpu || '0'}%</span>
            </div>
            <div className="h-2 bg-zyro-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${Math.min(100, status?.cpu || 0)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zyro-300">Disk</span>
              <span className="text-zyro-200">{status?.disk || '0'} MB</span>
            </div>
            <div className="h-2 bg-zyro-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all" style={{ width: `${Math.min(100, ((status?.disk || 0) / 5120) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-3">Connection</h3>
        <div className="flex items-center gap-3 p-3 bg-zyro-700/50 rounded-lg">
          <Globe className="w-5 h-5 text-zyro-accent" />
          <code className="text-zyro-200 font-mono">5.189.132.216:{server.port}</code>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-zyro-700/50 last:border-0">
      <span className="text-zyro-400 text-sm">{label}</span>
      <span className={`text-sm font-medium ${color || 'text-zyro-200'}`}>{value}</span>
    </div>
  );
}

function ConsoleTab({ serverId }: { serverId: string }) {
  const [logs, setLogs] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const consoleRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getServerLogs(serverId);
        setLogs(data.logs || 'No logs available');
      } catch (e) {}
    };
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [serverId, autoRefresh]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zyro-600/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zyro-accent" />
          <span className="text-sm font-medium text-white">Server Console</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zyro-300">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded border-zyro-600 bg-zyro-700" />
            Auto-refresh
          </label>
          <button onClick={() => api.getServerLogs(serverId).then(d => setLogs(d.logs || ''))} className="p-1.5 rounded hover:bg-zyro-700 text-zyro-300">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <pre ref={consoleRef} className="console-output p-4 h-[500px] overflow-y-auto bg-zyro-900 text-zyro-200 whitespace-pre-wrap">
        {logs}
      </pre>
    </div>
  );
}

function FilesTab({ serverId }: { serverId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [editing, setEditing] = useState<{ path: string; content: string; name: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIsDir, setNewIsDir] = useState(false);

  const fetchFiles = async (path: string = currentPath) => {
    try {
      const data = await api.getFiles(serverId, path);
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (e) {}
  };

  useEffect(() => { fetchFiles(); }, [serverId]);

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    await api.deleteFile(serverId, path);
    fetchFiles();
  };

  const handleCreate = async () => {
    if (!newName) return;
    await api.createFile(serverId, currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`, '', newIsDir);
    setShowNew(false);
    setNewName('');
    fetchFiles();
  };

  const handleEdit = async (path: string) => {
    try {
      const data = await api.getFiles(serverId, path);
      if (data.content !== undefined) {
        setEditing({ path, content: data.content, name: path.split('/').pop() || '' });
      }
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!editing) return;
    await api.updateFile(serverId, editing.path, editing.content);
    setEditing(null);
  };

  const navigateTo = (name: string) => {
    const newPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    fetchFiles(newPath);
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.length ? '/' + parts.join('/') : '/');
  };

  return (
    <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zyro-600/30">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-zyro-accent" />
          <span className="text-sm font-medium text-white">File Manager</span>
          <span className="text-sm text-zyro-400 ml-2">{currentPath}</span>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zyro-accent/10 text-zyro-accent border border-zyro-accent/20 text-sm hover:bg-zyro-accent/20">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {showNew && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zyro-600/30 bg-zyro-700/30">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 px-3 py-1.5 bg-zyro-700 border border-zyro-600/50 rounded text-sm text-white" />
          <label className="flex items-center gap-1 text-sm text-zyro-300">
            <input type="checkbox" checked={newIsDir} onChange={(e) => setNewIsDir(e.target.checked)} className="rounded" /> Folder
          </label>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-zyro-accent text-white rounded text-sm">Create</button>
          <button onClick={() => setShowNew(false)} className="px-3 py-1.5 bg-zyro-700 text-zyro-300 rounded text-sm">Cancel</button>
        </div>
      )}

      <div className="divide-y divide-zyro-700/50">
        {currentPath !== '/' && (
          <div className="flex items-center px-4 py-2.5 hover:bg-zyro-700/30 cursor-pointer" onClick={goUp}>
            <ChevronRight className="w-4 h-4 text-zyro-400 rotate-90 mr-3" />
            <span className="text-sm text-zyro-200">..</span>
          </div>
        )}
        {files.map((file: any) => (
          <div key={file.name} className="flex items-center justify-between px-4 py-2.5 hover:bg-zyro-700/30 group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {file.isDir ? (
                <span className="cursor-pointer flex items-center gap-2" onClick={() => navigateTo(file.name)}>
                  <FolderOpen className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-zyro-200 truncate">{file.name}</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zyro-400" />
                  <span className="text-sm text-zyro-200 truncate">{file.name}</span>
                </div>
              )}
              <span className="text-xs text-zyro-500">{file.size || ''}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!file.isDir && (
                <button onClick={() => handleEdit(file.isDir ? file.name : (currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`))} className="p-1.5 rounded hover:bg-zyro-600 text-zyro-300">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => handleDelete(file.isDir ? file.name : (currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`))} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {files.length === 0 && <div className="px-4 py-8 text-center text-zyro-400 text-sm">No files</div>}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zyro-800 border border-zyro-600/30 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zyro-600/30">
              <span className="text-sm font-medium text-white">{editing.name}</span>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-zyro-700 text-zyro-300"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className="flex-1 p-4 bg-zyro-900 text-zyro-200 font-mono text-sm resize-none focus:outline-none min-h-[400px]"
            />
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zyro-600/30">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-zyro-700 text-zyro-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-zyro-accent text-white rounded-lg text-sm font-medium"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ serverId, server, onRefresh }: { serverId: string; server: any; onRefresh: () => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings(serverId).then(data => setSettings(data.properties || {})).catch(() => {});
  }, [serverId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(serverId, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {}
    setSaving(false);
  };

  const fields = [
    { key: 'gamemode', label: 'Game Mode', options: ['survival', 'creative', 'adventure', 'spectator'] },
    { key: 'difficulty', label: 'Difficulty', options: ['peaceful', 'easy', 'normal', 'hard'] },
    { key: 'max-players', label: 'Max Players', type: 'number' },
    { key: 'motd', label: 'MOTD', type: 'text' },
    { key: 'online-mode', label: 'Online Mode', options: ['true', 'false'] },
    { key: 'view-distance', label: 'View Distance', type: 'number' },
    { key: 'pvp', label: 'PvP', options: ['true', 'false'] },
    { key: 'allow-flight', label: 'Allow Flight', options: ['true', 'false'] },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Server Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-zyro-200 mb-1">{field.label}</label>
              {field.options ? (
                <select
                  value={settings[field.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-zyro-accent"
                >
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={settings[field.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-zyro-accent"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-zyro-accent text-white rounded-lg text-sm font-medium hover:bg-zyro-accent-dark disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-green-400">✓ Saved! Restart to apply.</span>}
          <button onClick={() => api.restartServer(serverId).then(onRefresh)} className="flex items-center gap-1.5 px-4 py-2 bg-zyro-700 text-zyro-200 rounded-lg text-sm hover:bg-zyro-600">
            <RotateCw className="w-4 h-4" /> Save & Restart
          </button>
        </div>
      </div>

      <div className="bg-zyro-800 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-zyro-400 mb-4">Deleting the server will permanently remove all files and data.</p>
        <button
          onClick={async () => {
            if (confirm('Are you sure? This cannot be undone.')) {
              await api.deleteServer(serverId);
              window.location.href = '/dashboard';
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" /> Delete Server
        </button>
      </div>
    </div>
  );
}
