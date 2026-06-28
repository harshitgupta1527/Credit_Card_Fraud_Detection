import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShieldAlert, CheckCircle, Percent,
  Activity, RefreshCw, FileText, Zap, Target, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { systemService, predictionService } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';

// ─── Animated Counter ─────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '', decimals = 0 }: {
  target: number; suffix?: string; prefix?: string; decimals?: number;
}) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const duration = 1200;

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    startTime.current = null;
    requestAnimationFrame(animate);
  }, [target]);

  return (
    <span>
      {prefix}{decimals > 0 ? current.toFixed(decimals) : Math.round(current)}{suffix}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ title, value, numericValue, suffix, prefix, decimals, icon: Icon, gradient, description, delay }: any) {
  return (
    <div
      className="card-hover p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
        <AnimatedCounter target={numericValue ?? 0} suffix={suffix} prefix={prefix} decimals={decimals} />
      </h3>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{description}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-slate-400 font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: systemService.getDashboardStats,
  });

  const downloadPdf = async (id: number) => {
    try {
      const blob = await predictionService.downloadReportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch { alert('Error downloading PDF report'); }
  };

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col gap-3">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">Failed to load statistics</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const genuine = stats.total_predictions - stats.fraud_detected;

  const cards = [
    {
      title: 'Total Checks',
      numericValue: stats.total_predictions,
      icon: Activity,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Lifetime transaction evaluations',
      delay: 0,
    },
    {
      title: 'Fraud Detected',
      numericValue: stats.fraud_detected,
      icon: ShieldAlert,
      gradient: 'from-red-500 to-rose-600',
      description: 'Blocked / flagged transactions',
      delay: 80,
    },
    {
      title: 'Legitimate',
      numericValue: genuine,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Approved genuine transactions',
      delay: 160,
    },
    {
      title: 'Fraud Rate',
      numericValue: stats.fraud_rate,
      suffix: '%',
      decimals: 1,
      icon: Percent,
      gradient: stats.fraud_rate > 5 ? 'from-orange-500 to-red-500' : 'from-violet-500 to-purple-600',
      description: `System-wide fraud frequency`,
      delay: 240,
    },
    {
      title: 'F1 Score',
      numericValue: stats.model_f1 * 100,
      suffix: '%',
      decimals: 1,
      icon: Target,
      gradient: 'from-cyan-500 to-blue-500',
      description: 'Model F1 validation score',
      delay: 320,
    },
    {
      title: 'Model Accuracy',
      numericValue: 99.9,
      suffix: '%',
      decimals: 1,
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      description: 'CatBoost classifier accuracy',
      delay: 400,
    },
  ];

  // Pie chart data
  const pieData = [
    { name: 'Genuine', value: genuine, color: '#10b981' },
    { name: 'Fraud', value: stats.fraud_detected, color: '#ef4444' },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">System Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time metrics from the active ML pipeline.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards — 3 cols on lg, 2 on md, 1 on sm */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Trend Area Chart (col-span-2) */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Transaction Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily evaluations over the last 7 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.prediction_trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Area type="monotone" name="Total Evaluated" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorTotal)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                <Area type="monotone" name="Fraud Flagged" dataKey="fraud" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorFraud)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud vs Genuine Pie */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Transaction Split</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Fraud vs Genuine breakdown</p>
          {stats.total_predictions === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No data yet</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}66)` }} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/40">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400">{p.name}</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{p.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Evaluations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest transaction logs from the API</p>
          </div>
          <Clock className="h-4 w-4 text-slate-400" />
        </div>

        {stats.recent_activity.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400">
            <p className="text-xs font-semibold">No recent evaluations — run a prediction to see data here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.recent_activity.map((activity: any) => (
              <div
                key={activity.id}
                className={`card-hover p-3 rounded-xl border transition-all ${
                  activity.label === 'Fraud'
                    ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200/60 dark:border-red-900/30'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    activity.label === 'Fraud'
                      ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {activity.label}
                  </span>
                  <button
                    onClick={() => downloadPdf(activity.id)}
                    className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    title="Download PDF"
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">${activity.amount.toFixed(2)}</p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{activity.time}</p>
                <div className={`mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                  activity.risk === 'High' ? 'bg-red-100 text-red-500' :
                  activity.risk === 'Medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>{activity.risk} Risk</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
