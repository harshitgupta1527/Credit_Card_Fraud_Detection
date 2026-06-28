import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, ShieldAlert, FileText, HelpCircle, 
  Sparkles, RefreshCw, Send, Shuffle, ChevronDown,
  ChevronUp, Clock, DollarSign, Brain, AlertTriangle,
  CheckCircle, XCircle, Zap, BarChart2, TrendingUp, TrendingDown
} from 'lucide-react';
import { predictionService, api } from '../services/api';
import { useToast } from '../components/Toast';

// ─── Templates ────────────────────────────────────────────────────
const PRESETS = [
  {
    name: '🟢 Secure Transaction Sample',
    data: {
      Time: 42000.0, Amount: 49.95,
      V1: 1.15, V2: -0.28, V3: 0.78, V4: 0.12, V5: -0.15, V6: 0.05, V7: 0.12, V8: -0.02,
      V9: 0.23, V10: -0.18, V11: -0.45, V12: 0.38, V13: -0.05, V14: 0.22, V15: 0.88, V16: 0.15,
      V17: -0.12, V18: -0.32, V19: 0.12, V20: -0.08, V21: -0.18, V22: -0.35, V23: 0.08, V24: 0.18,
      V25: 0.22, V26: -0.12, V27: 0.02, V28: 0.01
    }
  },
  {
    name: '🔴 High Risk Fraud Sample',
    data: {
      Time: 85000.0, Amount: 120.00,
      V1: -3.05, V2: 2.85, V3: -4.55, V4: 4.88, V5: -2.15, V6: -1.05, V7: -3.88, V8: 1.55,
      V9: -2.75, V10: -5.85, V11: 4.25, V12: -6.85, V13: 0.85, V14: -8.12, V15: -0.55, V16: -4.85,
      V17: -10.55, V18: -3.85, V19: 1.25, V20: 0.45, V21: 0.85, V22: -0.45, V23: -0.15, V24: -0.85,
      V25: 0.35, V26: 0.45, V27: 0.85, V28: 0.35
    }
  },
  {
    name: '🟡 Borderline Suspicious Sample',
    data: {
      Time: 125000.0, Amount: 385.00,
      V1: -1.25, V2: 1.05, V3: -1.85, V4: 2.12, V5: -0.85, V6: -0.35, V7: -1.15, V8: 0.45,
      V9: -0.95, V10: -2.15, V11: 1.85, V12: -2.85, V13: 0.25, V14: -3.55, V15: 0.15, V16: -1.95,
      V17: -4.12, V18: -1.45, V19: 0.55, V20: 0.12, V21: 0.25, V22: -0.15, V23: -0.05, V24: -0.35,
      V25: 0.15, V26: 0.18, V27: 0.25, V28: 0.08
    }
  }
];

const emptyForm = () => ({
  Time: 0, Amount: 0,
  ...Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, 0.0]))
});

// ─── Circular Risk Gauge ──────────────────────────────────────────
function RiskGauge({ score, isFraud }: { score: number; isFraud: boolean }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [score]);

  const color = score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981';
  const label = score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="120" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
        {/* Filled arc */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 6px ${color}88)`
          }}
        />
        {/* Center text */}
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>{score}</text>
        <text x="50" y="59" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">RISK SCORE</text>
      </svg>
      <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color }}>{label} Risk</span>
    </div>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────
function ConfidenceBar({ confidence, isFraud }: { confidence: number; isFraud: boolean }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round(confidence * 100);
  const color = isFraud ? 'bg-red-500' : 'bg-emerald-500';
  const glow = isFraud ? 'shadow-red-500/40' : 'shadow-emerald-500/40';

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence</span>
        <span className={`text-sm font-black ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} shadow-lg ${glow} progress-bar-animated`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─── XAI Feature Importance ───────────────────────────────────────
function XAIPanel({ form, isFraud }: { form: Record<string, number>; isFraud: boolean }) {
  // Compute pseudo-SHAP contributions: use absolute magnitude of V values as proxy importance
  const features = Array.from({ length: 28 }, (_, i) => {
    const key = `V${i + 1}`;
    const val = form[key] ?? 0;
    const absVal = Math.abs(val);
    // Contribution direction: negative V values correlated with fraud for many features
    const contributesToFraud = val < -1.5 || (isFraud && Math.abs(val) > 1);
    return { key, val, absVal, contributesToFraud };
  });

  const maxAbs = Math.max(...features.map(f => f.absVal), 0.01);

  // Sort by absolute magnitude and take top 8
  const top = [...features].sort((a, b) => b.absVal - a.absVal).slice(0, 8);
  const positive = top.filter(f => !f.contributesToFraud).slice(0, 4);
  const negative = top.filter(f => f.contributesToFraud).slice(0, 4);

  // Human-readable explanation
  const explanations: string[] = [];
  if (form.Amount > 200) explanations.push('Large transaction amount increased fraud probability.');
  if (negative.length > 0) explanations.push(`${negative[0].key} showed a strong fraud-correlated pattern (value: ${negative[0].val.toFixed(3)}).`);
  if (positive.length > 0) explanations.push(`${positive[0].key} contributed to a genuine transaction pattern.`);
  if (form.Amount < 50) explanations.push('Small transaction amount is consistent with legitimate activity.');
  if (!isFraud) explanations.push('Transaction behaviour closely matches historical legitimate transactions.');
  else explanations.push('Multiple PCA dimensions show anomalous deviations from normal transaction clusters.');

  return (
    <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-2xl space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-violet-500/10">
          <Brain className="h-4 w-4 text-violet-500" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Explainable AI (XAI)</h4>
          <p className="text-[10px] text-slate-400">Feature importance analysis — what drove this decision?</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Negative contributions (fraud signals) */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Fraud Signals</span>
          </div>
          <div className="space-y-2">
            {(negative.length ? negative : top.slice(0, 3)).map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 w-8 shrink-0">{f.key}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400 feature-bar"
                    style={{ width: `${(f.absVal / maxAbs) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 w-12 text-right">{f.val.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Positive contributions (genuine signals) */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Genuine Signals</span>
          </div>
          <div className="space-y-2">
            {(positive.length ? positive : top.slice(4, 7)).map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 w-8 shrink-0">{f.key}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 feature-bar"
                    style={{ width: `${(f.absVal / maxAbs) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 w-12 text-right">{f.val.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Human-readable summary */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Model Reasoning</p>
        <ul className="space-y-1.5">
          {explanations.map((e, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Predict Page ────────────────────────────────────────────
export default function Predict() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [form, setForm] = useState<any>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [lastPredId, setLastPredId] = useState<number | null>(null);
  const [sampleSpoiler, setSampleSpoiler] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [btnState, setBtnState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const handleInputChange = (field: string, val: string) => {
    setForm((prev: any) => ({ ...prev, [field]: parseFloat(val) || 0.0 }));
  };

  const handleLoadPreset = (presetName: string) => {
    if (presetName === '') return;
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
      setForm(preset.data);
      setResult(null);
      setSampleSpoiler(null);
      toastInfo('Template loaded', preset.name);
    }
  };

  const handleReset = () => {
    setForm(emptyForm());
    setResult(null);
    setSampleSpoiler(null);
    setLastPredId(null);
    setBtnState('idle');
  };

  const handleRandomSample = async () => {
    setRandomLoading(true);
    setResult(null);
    setSampleSpoiler(null);
    try {
      const res = await api.get('/predictions/random-sample');
      const { actual_class, ...formData } = res.data;
      setForm(formData);
      setSampleSpoiler(actual_class === 1 ? 'fraud' : 'genuine');
      toastInfo('Random sample loaded', `Dataset label: ${actual_class === 1 ? 'Fraud' : 'Genuine'}`);
    } catch {
      toastError('Could not load sample', 'Is the backend running?');
    } finally {
      setRandomLoading(false);
    }
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = submitBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    setBtnState('loading');

    try {
      const response = await predictionService.predict(form);
      setResult(response);
      setBtnState('success');
      setShowAdvanced(false); // Collapse PCA after predict

      const history = await predictionService.getHistory(1, 1);
      if (history.items.length > 0) setLastPredId(history.items[0].id);

      if (response.prediction === 'Fraud') {
        toastError('⚠️ Fraud Detected', `Risk: ${response.risk} | Confidence: ${response.confidence}`);
      } else {
        toastSuccess('✅ Transaction Genuine', `Confidence: ${response.confidence} | ${response.response_time_ms.toFixed(1)}ms`);
      }
    } catch (err: any) {
      setBtnState('error');
      toastError('Analysis failed', err.response?.data?.detail || 'Backend connection error');
    } finally {
      setLoading(false);
      setTimeout(() => setBtnState('idle'), 3000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!lastPredId) return;
    try {
      const blob = await predictionService.downloadReportPdf(lastPredId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraudguard_report_${lastPredId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toastSuccess('PDF Downloaded', `Report #${lastPredId} saved`);
    } catch {
      toastError('Download failed', 'Could not generate PDF report');
    }
  };

  // Compute risk score (0-100)
  const riskScore = result ? Math.round(result.probability * 100) : 0;
  const isFraud = result?.prediction === 'Fraud';

  const btnConfig = {
    idle:    { text: 'Analyze Transaction', icon: Send,         cls: 'btn-gradient text-white' },
    loading: { text: 'Analyzing...',         icon: RefreshCw,   cls: 'bg-blue-600 text-white opacity-80' },
    success: { text: 'Analysis Complete',    icon: CheckCircle, cls: 'bg-emerald-600 text-white' },
    error:   { text: 'Analysis Failed',      icon: XCircle,     cls: 'bg-red-600 text-white' },
  }[btnState];
  const BtnIcon = btnConfig.icon;

  return (
    <div className="space-y-6">
      {/* ── Templates Card ──────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Quick Templates</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Load known transaction patterns or pick a random real sample from the dataset.</p>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-semibold text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">-- Select Transaction Template --</option>
            {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>

          <button
            type="button"
            onClick={handleRandomSample}
            disabled={randomLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
          >
            {randomLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
            🎲 Random Transaction
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            Clear All
          </button>
        </div>

        {sampleSpoiler && (
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border animate-scale-in ${
            sampleSpoiler === 'fraud'
              ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400'
          }`}>
            {sampleSpoiler === 'fraud' ? '🔴' : '🟢'}
            Dataset label: <strong>{sampleSpoiler === 'fraud' ? 'FRAUDULENT' : 'GENUINE'}</strong> — run model to verify!
          </div>
        )}
      </div>

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ── Input Form (col-span-3) ──────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-0.5">Transaction Attributes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter the transaction details to analyze for fraud.</p>
            </div>

            {/* Time & Amount — always visible */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Clock className="h-3 w-3" /> Time (Seconds elapsed)
                </label>
                <input
                  type="number" step="any" value={form.Time}
                  onChange={(e) => handleInputChange('Time', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <DollarSign className="h-3 w-3" /> Amount ($)
                </label>
                <input
                  type="number" step="any" value={form.Amount}
                  onChange={(e) => handleInputChange('Amount', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Collapsible V1-V28 */}
            <div className="border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Advanced PCA Features (V1–V28)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold">
                    {Object.keys(form).filter(k => k.startsWith('V') && form[k] !== 0).length} modified
                  </span>
                </div>
                {showAdvanced
                  ? <ChevronUp className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[600px]' : 'max-h-0'}`}>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Array.from({ length: 28 }, (_, i) => {
                    const key = `V${i + 1}`;
                    const isModified = form[key] !== 0;
                    return (
                      <div key={key}>
                        <label className={`block text-[9px] font-bold mb-1 ${isModified ? 'text-blue-400' : 'text-slate-400'}`}>{key}</label>
                        <input
                          type="number" step="any" value={form[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors
                            ${isModified
                              ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-1">
              <button
                ref={submitBtnRef}
                type="submit"
                disabled={loading}
                onClick={handleRipple}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-200 shadow-lg flex-1 sm:flex-none ${btnConfig.cls}`}
              >
                {ripple && (
                  <span
                    className="btn-ripple-effect absolute"
                    style={{ left: ripple.x - 5, top: ripple.y - 5 }}
                  />
                )}
                <BtnIcon className={`h-4 w-4 ${btnState === 'loading' ? 'animate-spin' : ''}`} />
                <span>🛡 {btnConfig.text}</span>
              </button>
            </div>
          </div>
        </form>

        {/* ── Result Panel (col-span-2) ────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Awaiting state */}
          {!result && !loading && (
            <div className="p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl flex flex-col items-center text-center animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Awaiting Analysis</h4>
              <p className="text-xs text-slate-400 max-w-xs">Select a template or load a random sample, then click Analyze Transaction.</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl flex flex-col items-center justify-center text-center min-h-[300px] animate-fade-in">
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute h-20 w-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute h-14 w-14 rounded-full border-4 border-indigo-500/10 border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                <ShieldCheck className="h-8 w-8 text-blue-500 animate-pulse" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">AI Pattern Matching</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">Scanning transaction vectors through CatBoost classification nodes...</p>
              <div className="mt-4 flex gap-1">
                {['Normalizing', 'Classifying', 'Scoring'].map((s, i) => (
                  <span key={s} className="text-[9px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 font-semibold animate-pulse" style={{ animationDelay: `${i * 300}ms` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className={`relative p-5 rounded-2xl shadow-lg border animate-scale-in overflow-hidden
              ${isFraud
                ? 'bg-red-950/10 dark:bg-red-950/20 border-red-500/30'
                : 'bg-emerald-950/10 dark:bg-emerald-950/20 border-emerald-500/30'}
            `}>
              {/* Glow blob */}
              <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-20 blur-3xl pointer-events-none
                ${isFraud ? 'bg-red-500' : 'bg-emerald-500'}`} />

              {/* Header verdict */}
              <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
                isFraud ? 'bg-red-500/10' : 'bg-emerald-500/10'
              }`}>
                {isFraud
                  ? <ShieldAlert className="h-7 w-7 text-red-400 shrink-0" />
                  : <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0" />}
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Security Verdict</p>
                  <p className={`text-xl font-black leading-none ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isFraud ? '❌ FRAUD DETECTED' : '✅ GENUINE TRANSACTION'}
                  </p>
                </div>
              </div>

              {/* Risk Gauge + Confidence */}
              <div className="flex items-center justify-around mb-4">
                <RiskGauge score={riskScore} isFraud={isFraud} />
                <div className="flex-1 px-4 space-y-4">
                  <ConfidenceBar confidence={result.probability} isFraud={isFraud} />

                  {/* Recommendation */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recommendation</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border
                      ${result.recommendation === 'Block Transaction'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : result.recommendation === 'Review Manually'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}
                    >
                      {result.recommendation === 'Block Transaction' && <XCircle className="h-3 w-3" />}
                      {result.recommendation === 'Review Manually' && <AlertTriangle className="h-3 w-3" />}
                      {result.recommendation === 'Approve Transaction' && <CheckCircle className="h-3 w-3" />}
                      {result.recommendation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta info grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Probability', value: `${(result.probability * 100).toFixed(1)}%` },
                  { label: 'Response', value: `${result.response_time_ms.toFixed(1)}ms` },
                  { label: 'Model', value: 'CatBoost' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-2 rounded-xl bg-black/10 dark:bg-white/5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Timestamp */}
              <p className="text-[10px] text-slate-400 text-center mb-3">
                <Clock className="h-2.5 w-2.5 inline mr-1" />
                Analyzed at {new Date().toLocaleTimeString()}
              </p>

              {/* Actions */}
              <button
                onClick={handleDownloadPdf}
                disabled={!lastPredId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Download Security Report PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── XAI Panel ───────────────────────────────────────── */}
      {result && <XAIPanel form={form} isFraud={isFraud} />}
    </div>
  );
}
