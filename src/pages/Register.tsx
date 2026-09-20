import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zyro-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zyro-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zyro-accent to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-zyro-300 mt-2">Get your free Minecraft server</p>
        </div>

        <div className="bg-zyro-800 border border-zyro-600/30 rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 p-3 mb-4 bg-zyro-accent/10 border border-zyro-accent/20 rounded-lg text-zyro-accent text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Free plan: 1 server, 1GB RAM included
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zyro-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zyro-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white placeholder-zyro-400 focus:outline-none focus:border-zyro-accent focus:ring-1 focus:ring-zyro-accent transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zyro-200 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zyro-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white placeholder-zyro-400 focus:outline-none focus:border-zyro-accent focus:ring-1 focus:ring-zyro-accent transition-colors"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zyro-200 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zyro-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zyro-700 border border-zyro-600/50 rounded-lg text-white placeholder-zyro-400 focus:outline-none focus:border-zyro-accent focus:ring-1 focus:ring-zyro-accent transition-colors"
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-zyro-accent to-emerald-600 text-white font-semibold rounded-lg hover:from-zyro-accent-dark hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-zyro-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-zyro-300 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-zyro-accent hover:text-zyro-accent-dark font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
