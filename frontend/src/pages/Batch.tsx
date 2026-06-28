import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle, XCircle, RefreshCw, AlertTriangle, 
  Download, Play, Trash2, ArrowRight, Activity, ShieldAlert
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { predictionService } from '../services/api';

interface BatchRow {
  id: number;
  Time: number;
  Amount: number;
  features: Record<string, number>;
  actualClass?: number;
  prediction?: string;
  probability?: number;
  risk?: string;
  recommendation?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

export default function Batch() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseCSV(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toastError('Invalid file type', 'Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error('CSV is empty or missing header');

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        // Find indices of Time, Amount, Class (if exists) and V1-V28
        const timeIdx = headers.findIndex(h => h.toLowerCase() === 'time');
        const amountIdx = headers.findIndex(h => h.toLowerCase() === 'amount');
        const classIdx = headers.findIndex(h => h.toLowerCase() === 'class');

        if (timeIdx === -1 || amountIdx === -1) {
          throw new Error('CSV must contain "Time" and "Amount" columns.');
        }

        const parsedRows: BatchRow[] = [];
        // Limit to 50 rows for safety and animation aesthetics
        const rowsToParse = lines.slice(1, 51);

        rowsToParse.forEach((line, index) => {
          const cells = line.split(',').map(c => c.trim());
          if (cells.length < headers.length) return;

          const timeVal = parseFloat(cells[timeIdx]) || 0;
          const amountVal = parseFloat(cells[amountIdx]) || 0;
          const actualClass = classIdx !== -1 ? parseInt(cells[classIdx]) : undefined;

          // Build V1-V28
          const features: Record<string, number> = {};
          for (let i = 1; i <= 28; i++) {
            const vName = `V${i}`;
            const vIdx = headers.findIndex(h => h.toUpperCase() === vName);
            features[vName] = vIdx !== -1 ? parseFloat(cells[vIdx]) || 0.0 : 0.0;
          }

          parsedRows.push({
            id: index + 1,
            Time: timeVal,
            Amount: amountVal,
            features,
            actualClass,
            status: 'pending'
          });
        });

        setRows(parsedRows);
        setProcessedCount(0);
        toastSuccess('CSV Parsed', `Loaded ${parsedRows.length} transactions. Click Run to process.`);
      } catch (err: any) {
        toastError('Parsing Failed', err.message || 'Error processing CSV columns.');
      }
    };
    reader.readAsText(file);
  };

  const processBatch = async () => {
    if (rows.length === 0 || processing) return;
    setProcessing(true);
    setProcessedCount(0);
    toastInfo('Processing started', 'Sending transactions to ML engine...');

    const updated = [...rows];
    
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'processing' };
      setRows([...updated]);

      try {
        const payload = {
          Time: updated[i].Time,
          Amount: updated[i].Amount,
          ...updated[i].features
        };
        const result = await predictionService.predict(payload);
        
        updated[i] = {
          ...updated[i],
          status: 'success',
          prediction: result.prediction,
          probability: result.probability,
          risk: result.risk,
          recommendation: result.recommendation
        };
      } catch (err: any) {
        updated[i] = {
          ...updated[i],
          status: 'failed',
          error: err.response?.data?.detail || 'API error'
        };
      }
      
      setProcessedCount(i + 1);
      setRows([...updated]);
      // Small sleep to make the progression visual
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    setProcessing(false);
    const fraudCount = updated.filter(r => r.prediction === 'Fraud').length;
    toastSuccess('Batch Completed', `Processed all ${updated.length} rows. Found ${fraudCount} fraud signals.`);
  };

  const handleClear = () => {
    setRows([]);
    setProcessedCount(0);
    setProcessing(false);
    toastInfo('Cleared', 'Batch predictor reset.');
  };

  const downloadResultsCSV = () => {
    const successRows = rows.filter(r => r.status === 'success');
    if (successRows.length === 0) return;

    // Build headers
    const headers = ['ID', 'Time', 'Amount', 'Prediction', 'Probability', 'RiskLevel', 'Recommendation'];
    if (rows[0].actualClass !== undefined) headers.push('ActualClass', 'Match');

    const csvLines = [headers.join(',')];

    successRows.forEach(r => {
      const match = r.actualClass !== undefined 
        ? (r.prediction === 'Fraud' ? 1 : 0) === r.actualClass ? 'MATCH' : 'MISMATCH'
        : '';
      const line = [
        r.id,
        r.Time,
        r.Amount,
        r.prediction,
        r.probability?.toFixed(4),
        r.risk,
        `"${r.recommendation}"`
      ];
      if (r.actualClass !== undefined) {
        line.push(r.actualClass, match);
      }
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_prediction_results.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toastSuccess('CSV Saved', 'Results exported successfully.');
  };

  // Stats calculation
  const total = rows.length;
  const successes = rows.filter(r => r.status === 'success');
  const fraudCount = successes.filter(r => r.prediction === 'Fraud').length;
  const genuineCount = successes.filter(r => r.prediction === 'Genuine').length;
  const progressPct = total > 0 ? Math.round((processedCount / total) * 100) : 0;

  // Accuracy calculation if ground truth is present
  const rowsWithGroundTruth = successes.filter(r => r.actualClass !== undefined);
  const accurateCount = rowsWithGroundTruth.filter(r => {
    const predVal = r.prediction === 'Fraud' ? 1 : 0;
    return predVal === r.actualClass;
  }).length;
  const accuracyPct = rowsWithGroundTruth.length > 0 ? Math.round((accurateCount / rowsWithGroundTruth.length) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Batch Predictor</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload multi-row CSV files for automated high-volume processing.</p>
        </div>
      </div>

      {/* Upload Zone */}
      {rows.length === 0 && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-500/5' 
              : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Upload className="h-7 w-7 text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Upload CSV data</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 max-w-sm mb-4">
            File must contain headers: <strong>Time, Amount, V1-V28</strong>. Maximum 50 rows processed per batch.
          </p>
          
          <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 cursor-pointer hover:-translate-y-0.5 transition-all">
            Browse files
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {/* Rows present view */}
      {rows.length > 0 && (
        <div className="space-y-6">
          {/* Operations Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={processBatch}
                disabled={processing || processedCount === total}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
              >
                {processing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Run Batch Predict
              </button>
              <button
                onClick={downloadResultsCSV}
                disabled={processing || successes.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300"
              >
                <Download className="h-3.5 w-3.5" />
                Export Results CSV
              </button>
              <button
                onClick={handleClear}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 disabled:opacity-40 text-xs font-bold transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-slate-400">
              Loaded: {total} records
            </span>
          </div>

          {/* Progress Section */}
          {processedCount > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Processing Progress</span>
                <span className="font-mono font-black text-blue-500">{progressPct}% ({processedCount}/{total})</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full progress-bar-animated shadow-[0_0_8px_#3b82f688]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Stats dashboard inside progress */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-150 dark:border-slate-800/60">
                {[
                  { label: 'Genuine Found', value: genuineCount, color: 'text-emerald-500' },
                  { label: 'Fraud Flagged', value: fraudCount, color: 'text-red-500' },
                  { label: 'Pending Rows', value: total - processedCount, color: 'text-slate-400' },
                  ...(accuracyPct !== null ? [{ label: 'Ground Truth Match', value: `${accuracyPct}%`, color: 'text-blue-500' }] : [])
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <p className={`text-base font-black mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid list of rows */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Row</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Decision</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                  {rows.map((row) => {
                    const isSuccess = row.status === 'success';
                    const isFraud = row.prediction === 'Fraud';
                    return (
                      <tr key={row.id} className="hover:bg-slate-55 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-3 text-slate-400 font-mono">#{row.id}</td>
                        <td className="px-6 py-3 text-slate-500">{row.Time}</td>
                        <td className="px-6 py-3 font-extrabold text-slate-900 dark:text-white">${row.Amount.toFixed(2)}</td>
                        <td className="px-6 py-3">
                          {row.status === 'pending' && <span className="text-slate-400 font-bold uppercase text-[9px]">Awaiting</span>}
                          {row.status === 'processing' && <span className="text-blue-500 font-bold uppercase text-[9px] flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> RUNNING</span>}
                          {row.status === 'success' && <span className="text-emerald-500 font-bold uppercase text-[9px] flex items-center gap-1"><CheckCircle className="h-3 w-3" /> OK</span>}
                          {row.status === 'failed' && <span className="text-red-500 font-bold uppercase text-[9px] flex items-center gap-1"><XCircle className="h-3 w-3" /> FAILED</span>}
                        </td>
                        <td className="px-6 py-3">
                          {isSuccess ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isFraud ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {row.prediction}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-3 font-mono">
                          {isSuccess && row.probability !== undefined ? `${(row.probability * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-3 text-slate-500 truncate max-w-[200px]">
                          {isSuccess ? row.recommendation : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
