import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Server, LayoutDashboard, Shield, LogOut, Menu, X, Zap } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  return (
    <div className="flex h-screen bg-zyro-900 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zyro-800 border-r border-zyro-600/30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zyro-600/30">
          <div className="w-9 h-9 bg-gradient-to-br from-zyro-accent to-emerald-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Zyro Hosting</h1>
            <p className="text-xs text-zyro-300">Minecraft Panel</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-zyro-accent/10 text-zyro-accent border border-zyro-accent/20'
                  : 'text-zyro-200 hover:bg-zyro-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zyro-600/30">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-zyro-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-zyro-200">{user?.email?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-zyro-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-zyro-300 hover:bg-zyro-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zyro-600/30 bg-zyro-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-zyro-200 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-zyro-accent" />
            <span className="font-bold text-white">Zyro</span>
          </div>
          <div className="w-10" />
        </div>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
