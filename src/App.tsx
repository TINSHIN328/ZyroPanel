import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-zyro-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zyro-accent"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-zyro-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zyro-accent"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/server/:id" element={<ProtectedRoute><Layout><ServerDetail /></Layout></ProtectedRoute>} />
      <Route path="/server/:id/console" element={<ProtectedRoute><Layout><ServerDetail /></Layout></ProtectedRoute>} />
      <Route path="/server/:id/files" element={<ProtectedRoute><Layout><ServerDetail /></Layout></ProtectedRoute>} />
      <Route path="/server/:id/settings" element={<ProtectedRoute><Layout><ServerDetail /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Layout><AdminPanel /></Layout></AdminRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
