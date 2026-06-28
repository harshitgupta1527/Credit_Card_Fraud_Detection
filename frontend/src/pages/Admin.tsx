import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, Activity, Users, ShieldAlert, Cpu, 
  Terminal, ShieldCheck, RefreshCw, KeyRound, HardDrive, Clock
} from 'lucide-react';
import { systemService } from '../services/api';

export default function Admin() {
  const { data: health, isLoading: healthLoading, isError: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: systemService.getHealth,
  });

  const { data: logs, isLoading: logsLoading, isError: logsError, refetch: refetchLogs } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: systemService.getLogs,
  });

  const [uptimeSec, setUptimeSec] = useState(3840); // Base baseline uptime

  // Increment uptime seconds live
  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSec(u => u + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleRefreshAll = () => {
    refetchHealth();
    refetchLogs();
  };

  const loading = healthLoading || logsLoading;

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col gap-4">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading system diagnostics...</p>
      </div>
    );
  }

  if (healthError || logsError || !health || !logs) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col gap-3">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">Admin diagnostics load error</p>
        <button 
          onClick={handleRefreshAll}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const isDBHealthy = health.database_status === 'Healthy';
  const isModelLoaded = health.model_status === 'Loaded';

  const healthCards = [
    {
      title: 'Database Status',
      value: health.database_status,
      icon: Database,
      color: isDBHealthy ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5',
      indicator: isDBHealthy ? 'bg-emerald-500' : 'bg-red-500',
    },
    {
      title: 'ML Model Engine',
      value: health.model_status,
      icon: Cpu,
      color: isModelLoaded ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5',
      indicator: isModelLoaded ? 'bg-emerald-500' : 'bg-red-500',
    },
    {
      title: 'CPU Usage',
      value: `${health.cpu_usage}%`,
      icon: Activity,
      color: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
      indicator: 'bg-blue-500',
    },
    {
      title: 'Active Accounts',
      value: health.active_users,
      icon: Users,
      color: 'text-violet-500 border-violet-500/30 bg-violet-500/5',
      indicator: 'bg-violet-500',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Admin Console</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time telemetry, server configuration, and secure audits.</p>
        </div>
        <button 
          onClick={handleRefreshAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Diagnostics widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-5 rounded-2xl border ${card.color} shadow-sm relative overflow-hidden`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${card.indicator}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${card.indicator}`}></span>
                </span>
              </div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450">{card.title}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-none">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Hardware specs details summary */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
          <HardDrive className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Memory Allocation</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{health.memory_usage}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
          <Cpu className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Production Engine</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{health.model_name} (v{health.model_version})</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
          <Database className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Pred Logged</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{health.total_system_predictions} rows</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
          <Clock className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Uptime Baseline</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{formatUptime(uptimeSec)}</p>
          </div>
        </div>
      </div>

      {/* Logs splitting view */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* System traffic logs */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800/60">
            <Terminal className="h-4 w-4 text-blue-500" />
            <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">System Traffic Logs</h3>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {logs.system_logs.length === 0 ? (
              <p className="text-xs text-slate-500">No system events logged</p>
            ) : (
              logs.system_logs.map((log: any) => (
                <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{log.event_type}</span>
                    <span className="text-[9px] font-medium text-slate-400">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-normal">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit modifications trails */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800/60">
            <KeyRound className="h-4 w-4 text-blue-500" />
            <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Security Audits Trail</h3>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {logs.audit_logs.length === 0 ? (
              <p className="text-xs text-slate-500">No audits recorded</p>
            ) : (
              logs.audit_logs.map((log: any) => (
                <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">{log.action}</span>
                    <span className="text-[9px] font-medium text-slate-400">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                    Modified <b className="text-blue-500 font-bold">{log.table_name}</b> by <span className="font-semibold">{log.changed_by}</span>.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
