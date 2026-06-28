import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Activity, Database, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Background radial blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-900 px-6 lg:px-12 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-500 fill-brand-500/10" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FraudGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold hover:text-white text-slate-400 transition-colors">
            Login
          </Link>
          <Link 
            to="/register" 
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
          >
            Sign Up
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-6xl mx-auto z-10">
        <div className="text-center space-y-6 max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            Enterprise-Grade Protection
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-[1.15]">
            Real-Time Credit Card <br />
            <span className="bg-gradient-to-r from-brand-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">Fraud Detection Portal</span>
          </h1>
          
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Monitor, evaluate, and block fraudulent transactions instantly. Powered by an optimized machine learning pipeline with 99.95% accuracy and full feature explainability.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 font-semibold text-white transition-all shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)]"
            >
              Get Started Free
            </Link>
            <Link 
              to="/login" 
              className="px-6 py-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Access Demo Account
            </Link>
          </div>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-20">
          {[
            { label: 'Evaluation Accuracy', value: '99.95%' },
            { label: 'Model Precision Score', value: '97.26%' },
            { label: 'Recall Coverage', value: '74.74%' },
            { label: 'Optimized F1 Score', value: '84.52%' }
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-900 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">{stat.label}</span>
              <span className="text-3xl font-extrabold text-white leading-none">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Feature Highlights section */}
        <div className="space-y-12 w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-200">Engineered for Reliability & Scale</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-colors space-y-4">
              <div className="h-10 w-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Gradient Boosting ML</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Uses a hyperparameter-tuned CatBoost classifier trained on European cardholder dataset to capture hidden transaction fraud patterns.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-colors space-y-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Inference</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ingests credit card vectors and returns predictions, fraud probabilities, confidence levels, and risk metrics in under 10 milliseconds.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-colors space-y-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Audit trail database</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Preserves prediction transaction logs, audit modifications history, and client diagnostics inside an organized local SQLite/PostgreSQL database.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-slate-900 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 z-10 shrink-0">
        <div>&copy; 2026 FraudGuard Inc. All rights reserved.</div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-slate-400">Security Guidelines</a>
          <a href="#" className="hover:text-slate-400">Developer API</a>
          <a href="#" className="hover:text-slate-400">MIT License</a>
        </div>
      </footer>
    </div>
  );
}
