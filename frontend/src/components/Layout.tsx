import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, FileSpreadsheet, History, 
  Settings, LogOut, Menu, X, Sun, Moon, Database,
  Upload, ChevronRight, Zap
} from 'lucide-react';
import { authService } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/predict':   'Transaction Analyzer',
  '/history':   'Audit History',
  '/profile':   'Account Settings',
  '/batch':     'Batch Prediction',
  '/admin':     'Admin Console',
};

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [clock, setClock] = useState('');

  const userRole = authService.getRole();
  const userName = authService.getName();
  const userInitial = userName.charAt(0).toUpperCase();

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Apply dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    darkMode ? root.classList.add('dark') : root.classList.remove('dark');
  }, [darkMode]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',        path: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Fraud Prediction', path: '/predict',   icon: Shield,          badge: null },
    { name: 'Batch Predict',    path: '/batch',     icon: Upload,          badge: 'NEW' },
    { name: 'History',          path: '/history',   icon: History,         badge: null },
    { name: 'Settings',         path: '/profile',   icon: Settings,        badge: null },
  ];

  if (userRole === 'Admin') {
    navItems.push({ name: 'Admin Console', path: '/admin', icon: Database, badge: null });
  }

  const isActive = (path: string) => location.pathname === path;
  const pageTitle = PAGE_TITLES[location.pathname] || 'FraudGuard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080e1a] text-slate-800 dark:text-slate-200 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white dark:bg-slate-900/95 backdrop-blur-xl
        border-r border-slate-200 dark:border-slate-800/60
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <Shield className="h-4 w-4 text-white fill-white/20" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div>
              <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">FraudGuard</span>
              <p className="text-[9px] text-slate-400 font-medium -mt-0.5">ML Security Platform</p>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active
                    ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'}
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                )}
                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-500/15' : 'bg-slate-100 dark:bg-slate-800/60 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/60'}`}>
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                </div>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20">{item.badge}</span>
                )}
                {active && <ChevronRight className="h-3 w-3 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/60 shrink-0 space-y-2">
          {/* User card */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-lg shadow-blue-500/25">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userRole}</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-900/30 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-5 lg:px-7 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-bold text-sm text-slate-900 dark:text-white">{pageTitle}</h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live clock */}
            <span className="hidden md:block text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 tabular-nums">{clock}</span>

            {/* API Status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">API LIVE</span>
            </div>

            {/* ML Engine badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
              <Zap className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">CatBoost</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 px-6 py-4 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                FraudGuard ML Platform &bull; Powered by React + FastAPI + CatBoost
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/harshitgupta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-slate-400 hover:text-blue-500 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/harshitgupta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-slate-400 hover:text-blue-500 transition-colors"
              >
                LinkedIn
              </a>
              <span className="text-[10px] font-semibold text-slate-400">
                Developed by <span className="text-slate-500 dark:text-slate-300">Harshit Gupta</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">v2.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
