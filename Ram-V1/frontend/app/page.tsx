import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. PUBLIC MARKETING HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-indigo-500/20">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Fin<span className="text-indigo-400">OS</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#analytics" className="hover:text-indigo-400 transition-colors">Analytics</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1">
        <section className="relative pt-24 pb-20 px-6 text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span>Next-Gen Financial Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Automate Financial Analysis <br />
            <span className="gradient-text">In Under 60 Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Replace manual Excel spreadsheets with intelligent, multi-source financial dashboards. Built for founders, CFOs, and finance leaders who demand instant clarity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/upload" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/20 px-8 py-4">
                Launch Live Demo →
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white px-8 py-4">
                Explore Dashboard
              </Button>
            </Link>
          </div>

          {/* DASHBOARD PREVIEW SHADOW MOCKUP */}
          <div className="pt-12">
            <div className="gradient-border rounded-2xl p-2 shadow-2xl shadow-indigo-500/10 bg-slate-900/80 backdrop-blur-xl">
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 text-left space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-500">FinOS Executive Suite v1.0</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">$1,450,000</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Operating Margin</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">43.4%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Reconciled Batch</p>
                    <p className="text-2xl font-bold text-violet-400 mt-1">100% Balanced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURES SHOWCASE GRID */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-900">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Built for Enterprise Intelligence</h2>
            <p className="text-slate-400 text-sm">Everything you need to unify multi-source financial data into action.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">01</div>
              <h3 className="text-xl font-bold text-white">Multi-Source Ingestion</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drop 1 to 10 files simultaneously. Reconcile General Ledgers, Bank Statements, and COGS invoices into one unified model.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-violet-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-lg">02</div>
              <h3 className="text-xl font-bold text-white">Unit Economics & COGS</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drill down into Direct Materials, Direct Labor, and Overhead costs with precision industry breakdown widgets.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">03</div>
              <h3 className="text-xl font-bold text-white">Diagnostic Storytelling</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automated plain-English executive summaries explaining exact profit driver changes and working capital drag.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 4. PUBLIC MARKETING FOOTER */}
      <footer className="py-8 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>FinOS Operating System &copy; {new Date().getFullYear()} • Enterprise Financial Intelligence</p>
      </footer>
    </div>
  );
}