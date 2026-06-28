import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, FileSpreadsheet, FileDown, Trash2, ArrowUpDown,
  ChevronLeft, ChevronRight, RefreshCw, FileText, X, Eye, Clock, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { predictionService } from '../services/api';
import { useToast } from '../components/Toast';
import { HistorySkeleton } from '../components/Skeleton';

export default function History() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [activeItem, setActiveItem] = useState<any | null>(null);

  const { data: historyData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['predictionHistory', page, searchQuery, sortBy, order],
    queryFn: () => predictionService.getHistory(page, size, searchQuery, sortBy, order),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(searchVal);
    if (!isNaN(parsed)) {
      setSearchQuery(parsed);
      toastInfo('Search applied', `Filtering transactions with amount near $${parsed.toFixed(2)}`);
    } else if (searchVal === '') {
      setSearchQuery(undefined);
    }
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    setSearchQuery(undefined);
    setPage(1);
    toastInfo('Filters cleared', 'Showing all prediction logs');
  };

  const toggleSort = (colName: string) => {
    if (sortBy === colName) {
      setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colName);
      setOrder('desc');
    }
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this prediction log?')) return;
    try {
      await predictionService.delete(id);
      toastSuccess('Record Deleted', `Audit log entry #${id} successfully removed.`);
      refetch();
    } catch {
      toastError('Delete Failed', 'Could not delete the selected prediction log.');
    }
  };

  const downloadPdf = async (id: number) => {
    try {
      const blob = await predictionService.downloadReportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraudguard_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toastSuccess('PDF Exported', `Security report #${id} downloaded.`);
    } catch {
      toastError('Export Failed', 'Could not generate report PDF.');
    }
  };

  const downloadCsv = async () => {
    try {
      const blob = await predictionService.downloadHistoryCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction_history.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toastSuccess('CSV Exported', 'Complete prediction history saved.');
    } catch {
      toastError('Export Failed', 'Could not generate CSV file.');
    }
  };

  const totalPages = historyData ? Math.ceil(historyData.total_count / size) : 0;

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Audit History Log</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive immutable trail of all card checks.</p>
        </div>
        
        <button
          onClick={downloadCsv}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 self-start sm:self-auto hover:-translate-y-0.5"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV History
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search by Amount ($)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <button 
            type="submit" 
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-xs font-bold text-white hover:bg-slate-850 dark:hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
          {searchQuery !== undefined && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="text-xs text-blue-500 hover:text-blue-400 font-bold px-2"
            >
              Clear
            </button>
          )}
        </form>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
          title="Reload History"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* History table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <HistorySkeleton />
        ) : isError || !historyData || historyData.items.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center text-slate-400">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-800 mb-3" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No predictions found</h4>
            <p className="text-xs text-slate-500 mt-1">Predictions will appear here once processed by the API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('created_at')}>
                    <span className="flex items-center gap-1">Date {sortBy === 'created_at' && <ArrowUpDown className="h-3 w-3 text-blue-500" />}</span>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('amount')}>
                    <span className="flex items-center gap-1">Amount {sortBy === 'amount' && <ArrowUpDown className="h-3 w-3 text-blue-500" />}</span>
                  </th>
                  <th className="px-6 py-4">Verdict</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('probability')}>
                    <span className="flex items-center gap-1">Probability {sortBy === 'probability' && <ArrowUpDown className="h-3 w-3 text-blue-500" />}</span>
                  </th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Recommendation</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                {historyData.items.map((item: any) => {
                  const isFraud = item.prediction_label === 'Fraud';
                  const probPct = Math.round(item.probability * 100);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-mono">#{item.id}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-extrabold text-sm">
                        ${item.transaction_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isFraud 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {isFraud ? <ShieldAlert className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                          {item.prediction_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">{item.probability.toFixed(3)}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                            <div className={`h-full rounded-full ${isFraud ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${probPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          item.risk_level === 'High' 
                            ? 'bg-red-500/10 text-red-500' 
                            : item.risk_level === 'Medium'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {item.recommendation}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadPdf(item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title="Download Report PDF"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-900/30 dark:hover:text-red-400 text-slate-400"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && historyData && historyData.total_count > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {((page - 1) * size) + 1} to {Math.min(page * size, historyData.total_count)} of {historyData.total_count} records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── View Details Modal ───────────────────────────────── */}
      {activeItem && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col animate-scale-in">
            
            {/* Modal header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Evaluation Audit Details</h3>
              </div>
              <button onClick={() => setActiveItem(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body (scrollable) */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              {/* Verdict header */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                activeItem.prediction_label === 'Fraud' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                <div className="flex items-center gap-3">
                  {activeItem.prediction_label === 'Fraud' 
                    ? <ShieldAlert className="h-6 w-6" /> 
                    : <ShieldCheck className="h-6 w-6" />}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Security Verdict</span>
                    <p className="text-base font-black leading-none mt-1">{activeItem.prediction_label === 'Fraud' ? 'FRAUD SIGNAL DETECTED' : 'SECURE TRANSACTION APPROVED'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Probability</span>
                  <p className="text-base font-mono font-black mt-1">{(activeItem.probability * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Record ID', value: `#${activeItem.id}` },
                  { label: 'Amount', value: `$${activeItem.transaction_amount.toFixed(2)}` },
                  { label: 'Risk level', value: activeItem.risk_level },
                  { label: 'Response time', value: `${activeItem.response_time_ms.toFixed(1)}ms` }
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{value}</p>
                  </div>
                ))}
              </div>

              {/* PCA Vectors */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Model Input Vector Dimensions</h4>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3.5">
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-slate-400">Transaction Time</span>
                    <p className="text-xs font-mono font-bold mt-0.5">{activeItem.transaction_time} sec</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-slate-400">Transaction Amount</span>
                    <p className="text-xs font-mono font-bold mt-0.5">${activeItem.transaction_amount}</p>
                  </div>
                  {activeItem.features_json && (() => {
                    try {
                      const features = JSON.parse(activeItem.features_json);
                      return Object.keys(features)
                        .filter(k => k.startsWith('V'))
                        .map(key => (
                          <div key={key} className="p-1">
                            <span className="text-[9px] font-bold text-slate-500">{key}</span>
                            <p className="text-[10px] font-mono font-semibold truncate" title={features[key]}>
                              {features[key].toFixed(4)}
                            </p>
                          </div>
                        ));
                    } catch {
                      return <p className="text-xs text-slate-400">No feature details available.</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3 shrink-0">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created at {new Date(activeItem.created_at).toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadPdf(activeItem.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  <FileDown className="h-4 w-4" /> Export PDF
                </button>
                <button
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 dark:hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
