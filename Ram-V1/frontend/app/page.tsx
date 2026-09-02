import Link from "next/link";
import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
            F
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight">FinOS</span>
            <span className="block text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Financial Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-300 hover:text-white transition px-4 py-2 rounded-lg"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition px-4 py-2 rounded-xl shadow-sm"
          >
            Start for Company →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8 my-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium text-indigo-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>FinOS Enterprise v1.0 Release</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The Financial Operating System for <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            High-Growth Companies
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed">
          Drop in raw general ledgers, messy ERP dumps, or bank statements. Gain instant executive margins, cash runway modeling, and board-ready reports in milliseconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            Create Company Workspace →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 font-semibold text-sm transition-all"
          >
            Open Existing Workspace
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl">⚡️</span>
            <h3 className="text-sm font-bold text-white">Universal Ingestion</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Auto-cleans metadata banners, melts multi-month P&Ls, and auto-balances single-entry bank statements automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl">🎛</span>
            <h3 className="text-sm font-bold text-white">"What-If" Simulator</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Simulate price increases, supply chain inflation, and hiring burn rate in real time without altering database records.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl">📊</span>
            <h3 className="text-sm font-bold text-white">Board-Ready Reports</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              1-click multi-sheet formatted Excel workbook downloads and vector PDF financial presentation decks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 text-center text-xs text-zinc-500 font-mono">
        FinOS SaaS Engine v1.0.0 • Multi-Tenant Autonomous Financial System
      </footer>
    </div>
  );
}
