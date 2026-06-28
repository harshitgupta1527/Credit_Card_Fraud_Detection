import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, ShieldAlert, Key, RefreshCw, Sliders, Shield, Calendar, Award } from 'lucide-react';
import { systemService } from '../services/api';
import { useToast } from '../components/Toast';

export default function Profile() {
  const { success: toastSuccess, error: toastError } = useToast();
  
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: systemService.getProfile,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState('dark');
  const [threshold, setThreshold] = useState(0.5);
  const [saveLoading, setSaveLoading] = useState(false);

  // Pre-fill state
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setTheme(profile.theme);
      setThreshold(profile.threshold);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toastError('Mismatch', 'Passwords do not match');
      return;
    }

    setSaveLoading(true);
    try {
      const payload: any = { name, email, theme, threshold };
      if (password) {
        payload.password = password;
      }
      
      const updated = await systemService.updateProfile(payload);
      
      const root = window.document.documentElement;
      if (updated.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      toastSuccess('Settings Saved', 'Profile credentials and preferences updated.');
      setPassword('');
      setConfirmPassword('');
      refetch();
    } catch (err: any) {
      toastError('Save Failed', err.response?.data?.detail || 'Could not update settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col gap-4">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading profile configuration...</p>
      </div>
    );
  }

  // Calculate profile completion metric
  let filledCount = 0;
  if (name.trim()) filledCount++;
  if (email.trim()) filledCount++;
  if (profile?.username) filledCount++;
  if (threshold !== 0.5) filledCount++;
  if (theme !== 'dark') filledCount++;
  const completionPct = Math.round((filledCount / 5) * 100);

  const initial = (name || profile?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Avatar & Stats Panel (Left Column) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-6 flex flex-col items-center text-center">
          
          {/* Avatar Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeDasharray="276"
                strokeDashoffset={276 - (completionPct / 100) * 276}
                strokeLinecap="round"
                className="risk-gauge-circle"
              />
            </svg>
            <div className="absolute h-18 w-18 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/25">
              {initial}
            </div>
          </div>

          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">{profile?.name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Role: {profile?.role}</p>
          </div>

          {/* Completion Bar */}
          <div className="w-full space-y-1.5 text-left">
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>Profile Setup</span>
              <span>{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full progress-bar-animated" style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          {/* Mini Info List */}
          <div className="w-full space-y-2 pt-4 border-t border-slate-150 dark:border-slate-800/60 text-left">
            {[
              { label: 'System Access', value: profile?.role, icon: Shield },
              { label: 'Registered', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Unknown', icon: Calendar },
              { label: 'Status', value: 'Active Access', icon: Award },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                <Icon className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials Form (col-span-2) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Account details */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-150 dark:border-slate-800/60">
              <User className="h-4 w-4 text-blue-500" />
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Account Credentials</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text" disabled value={profile?.username || ''}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Access Level</label>
                <input
                  type="text" disabled value={profile?.role || ''}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-800 dark:text-white font-semibold"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-800 dark:text-white font-semibold"
                  placeholder="email@company.com"
                />
              </div>
            </div>

            {/* Threshold & Preference sliders */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800/60 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800/60">
                <Sliders className="h-4 w-4 text-blue-500" />
                <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Preferences</h3>
              </div>

              {/* Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-450 tracking-wider">
                  <label>Decision Boundary Threshold</label>
                  <span className="font-mono text-xs font-bold text-blue-500">{threshold.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0.1" max="0.9" step="0.05" value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Sets the sensitivity boundary. Lower thresholds flag fraud more aggressively (higher recall but higher false positives).
                </p>
              </div>

              {/* Theme */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Interface Theme</label>
                  <select
                    value={theme} onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password section */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800/60 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800/60">
                <Key className="h-4 w-4 text-blue-500" />
                <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Change Password</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500 transition-colors text-slate-850"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                  <input
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500 transition-colors text-slate-850"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800/60">
              <button
                type="submit" disabled={saveLoading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
              >
                {saveLoading && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
