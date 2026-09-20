import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Server, Activity, Shield, Play, Square, Ban, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'servers'>('overview');

  const fetchData = async () => {
    try {
      const [u, s] = await Promise.all([api.adminGetUsers(), api.adminGetServers()]);
      setUsers(u);
      setServers(s);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleServerAction = async (id: string, action: string) => {
    try {
      if (action === 'start') await api.adminStartServer(id);
      if (action === 'stop') await api.adminStopServer(id);
      fetchData();
    } catch (e) {}
  };

  const handleSuspend = async (id: string) => {
    try {
      await api.adminSuspendUser(id);
      fetchData();
    } catch (e) {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zyro-accent"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-zyro-accent" />
          Admin Panel
        </h1>
        <p className="text-zyro-300 mt-1">Manage all users and servers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} color="blue" />
        <StatCard icon={Server} label="Total Servers" value={servers.length} color="green" />
        <StatCard icon={Activity} label="Running" value={servers.filter(s => s.status === 'online').length} color="emerald" />
        <StatCard icon={Ban} label="Suspended" value={users.filter(u => u.suspended).length} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zyro-800 border border-zyro-600/30 rounded-xl p-1">
        {(['overview', 'users', 'servers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-zyro-accent/10 text-zyro-accent border border-zyro-accent/20' : 'text-zyro-300 hover:text-white hover:bg-zyro-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zyro-600/30">
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zyro-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zyro-700/30">
                    <td className="px-4 py-3 text-sm text-zyro-200">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{user.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-zyro-accent/10 text-zyro-accent' : 'bg-zyro-700 text-zyro-300'}`}>{user.role}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${user.suspended ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{user.suspended ? 'Suspended' : 'Active'}</span></td>
                    <td className="px-4 py-3 text-sm text-zyro-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSuspend(String(user.id))} className={`px-3 py-1 rounded text-xs font-medium ${user.suspended ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                        {user.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Servers Tab */}
      {tab === 'servers' && (
        <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zyro-600/30">
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Owner</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Port</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Version</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zyro-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zyro-700/50">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-zyro-700/30">
                    <td className="px-4 py-3 text-sm text-zyro-200">{server.id}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{server.name}</td>
                    <td className="px-4 py-3 text-sm text-zyro-300">{server.user_email || server.user_id}</td>
                    <td className="px-4 py-3 text-sm text-zyro-200">{server.port}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${server.status === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{server.status}</span></td>
                    <td className="px-4 py-3 text-sm text-zyro-300">{server.software} {server.version}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleServerAction(String(server.id), 'start')} disabled={server.status === 'online'} className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-30"><Play className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleServerAction(String(server.id), 'stop')} disabled={server.status === 'offline'} className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30"><Square className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-zyro-700/50 last:border-0">
                  <span className="text-sm text-zyro-200">{u.email}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${u.suspended ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{u.suspended ? 'Suspended' : 'Active'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Servers</h3>
            <div className="space-y-3">
              {servers.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-zyro-700/50 last:border-0">
                  <div>
                    <span className="text-sm text-white font-medium">{s.name}</span>
                    <span className="text-xs text-zyro-400 ml-2">:{s.port}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-zyro-800 border border-zyro-600/30 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-zyro-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
