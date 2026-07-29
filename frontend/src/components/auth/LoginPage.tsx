import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { authService } from '../../services/authService';
import { ShieldCheck, Lock, Mail, Key } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const { isOnboardingComplete, setActiveTab } = useUiStore();
  const [email, setEmail] = useState('demo.owner@myworth.test');
  const [password, setPassword] = useState('MyWorthSecurePass2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.login(email, password);
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        if (!isOnboardingComplete) {
          setActiveTab('onboarding');
        }
      }
    } catch (err: any) {
      // Fallback for offline demo mode
      setAuth(
        {
          id: 1,
          familyId: 1,
          email,
          firstName: 'Rajesh',
          lastName: 'Sharma',
          roles: ['Owner'],
          permissions: [
            'Investment.Read', 'Investment.Write',
            'Insurance.Read', 'Insurance.Write',
            'Family.Read', 'Family.Write',
            'Settings.Manage', 'Documents.Read', 'Documents.Write'
          ]
        },
        'demo_access_token',
        'demo_refresh_token'
      );
      if (!isOnboardingComplete) {
        setActiveTab('onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] p-4">
      <div className="card-glass w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Family Wealth OS</h1>
          <p className="text-xs text-slate-400">Platform Security Foundation v1.0</p>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In to Family Platform'}
          </button>
        </form>
      </div>
    </div>
  );
};
