import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Server, Plus, Play, Square, RotateCw, Cpu, HardDrive, Wifi, Globe, AlertCircle, CheckCircle } from 'lucide-react';

interface ServerData {
  id: number;
  name: string;
  port: number;
  version: string;
  software: string;
  status: string;
  created_at: string;
}

const MC_VERSIONS = ['1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20', '1.19.4', '1.18.2', '1.17.1', '1.16.5'];

export default function Dashboard() {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', version: '1.21.4', software: 'paper' });

  const fetchServers = async () => {
    try {
      const data = await api.getServers();
      setServers(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchServers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.createServer(form);
      setShowCreate(false);
      setForm({ name: '', version: '1.21.4', software: 'paper' });
      fetchServers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'start') await api.startServer(String(id));
      if (action === 'stop') await api.stopServer(String(id));
      if (action === 'restart') await api.restartServer(String(id));
      fetchServers();
    } catch (e) {}
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'starting': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 border-green-500/20';
      case 'offline': return 'bg-red-500/10 border-red-500/20';
      case 'starting': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zyro-300 mt-1">Welcome back, {user?.email}</p>
        </div>
        {servers.length === 0 && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zyro-accent to-emerald-600 text-white font-semibold rounded-lg hover:from-zyro-accent-dark hover:to-emerald-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Server
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zyro-accent/10 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-zyro-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{servers.length}</p>
              <p className="text-sm text-zyro-400">Servers</p>
            </div>
          </div>
        </div>
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{servers.filter(s => s.status === 'online').length}</p>
              <p className="text-sm text-zyro-400">Running</p>
            </div>
          </div>
        </div>
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1 GB</p>
              <p className="text-sm text-zyro-400">RAM Limit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zyro-800 border border-zyro-600/30 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Minecraft Server</h2>
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zyro-200 mb-1">Server Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white focus:outline-none focus:border-zyro-accent"
                  placeholder="My Server"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zyro-200 mb-1">Minecraft Version</label>
                <select
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white focus:outline-none focus:border-zyro-accent"
                >
                  {MC_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zyro-200 mb-1">Server Software</label>
                <select
                  value={form.software}
                  onChange={(e) => setForm({ ...form, software: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white focus:outline-none focus:border-zyro-accent"
                >
                  <option value="paper">Paper</option>
                  <option value="vanilla">Vanilla</option>
                </select>
              </div>
              <div className="p-3 bg-zyro-700/50 rounded-lg text-sm text-zyro-300">
                <p>• 1 GB RAM allocated</p>
                <p>• Port will be auto-assigned (22893-22899)</p>
                <p>• EULA will be auto-accepted</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-zyro-700 text-zyro-200 rounded-lg hover:bg-zyro-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-zyro-accent text-white font-semibold rounded-lg hover:bg-zyro-accent-dark disabled:opacity-50 transition-colors">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zyro-accent"></div>
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-zyro-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No servers yet</h3>
          <p className="text-zyro-400 mb-6">Create your first free Minecraft server to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zyro-accent to-emerald-600 text-white font-semibold rounded-lg hover:from-zyro-accent-dark hover:to-emerald-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your Free Server
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <div key={server.id} className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-5 card-hover">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${server.status === 'online' ? 'bg-green-500/10' : 'bg-zyro-700'}`}>
                    <Server className={`w-6 h-6 ${server.status === 'online' ? 'text-green-400' : 'text-zyro-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{server.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBg(server.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${server.status === 'online' ? 'bg-green-400 animate-pulse-dot' : 'bg-red-400'}`}></span>
                        <span className={getStatusColor(server.status)}>{server.status}</span>
                      </span>
                      <span className="text-sm text-zyro-400 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />:{server.port}
                      </span>
                      <span className="text-sm text-zyro-400">{server.software} {server.version}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(server.id, 'start')}
                    disabled={server.status === 'online'}
                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-30 transition-colors"
                    title="Start"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAction(server.id, 'stop')}
                    disabled={server.status === 'offline'}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
                    title="Stop"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAction(server.id, 'restart')}
                    disabled={server.status === 'offline'}
                    className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-30 transition-colors"
                    title="Restart"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/server/${server.id}`}
                    className="ml-2 px-4 py-2 bg-zyro-accent/10 text-zyro-accent border border-zyro-accent/20 rounded-lg text-sm font-medium hover:bg-zyro-accent/20 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
