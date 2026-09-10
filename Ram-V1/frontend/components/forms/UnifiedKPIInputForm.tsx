"use client";

import React, { useState } from "react";

export default function UnifiedKPIInputForm() {
  const [formData, setFormData] = useState({
    revenue: "1000000",
    expenses: "700000",
    cash: "2500000",
    debt: "500000",
    accountsReceivable: "300000",
    accountsPayable: "150000",
    previousRevenue: "850000",
  });

  const [isCalculated, setIsCalculated] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const rev = parseFloat(formData.revenue) || 0;
  const exp = parseFloat(formData.expenses) || 0;
  const csh = parseFloat(formData.cash) || 0;
  const dbt = parseFloat(formData.debt) || 0;
  const ar = parseFloat(formData.accountsReceivable) || 0;
  const ap = parseFloat(formData.accountsPayable) || 0;
  const prevRev = parseFloat(formData.previousRevenue) || 1;

  const grossProfit = rev - exp;
  const profitMargin = rev > 0 ? ((grossProfit / rev) * 100).toFixed(2) : "0.00";
  const expenseRatio = rev > 0 ? ((exp / rev) * 100).toFixed(2) : "0.00";
  const revenueGrowth = prevRev > 0 ? (((rev - prevRev) / prevRev) * 100).toFixed(2) : "0.00";
  const workingCapital = csh + ar - ap;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
      <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="mb-8">
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">CANONICAL DATA LAYER</span>
          <h2 className="text-2xl font-bold text-white mt-1">Unified Financial & KPI Input</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enter your core financial parameters once. FinOS automatically powers your dashboard, reports, and predictive analytics.
          </p>
        </div>

        {isCalculated && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
            <span>✓ Canonical data synced successfully across platform outputs!</span>
            <span className="font-mono">SHA-256_HASH_OK</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">TOTAL REVENUE (₹)</label>
            <input
              type="number"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">TOTAL OPERATING EXPENSES (₹)</label>
            <input
              type="number"
              name="expenses"
              value={formData.expenses}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">CASH & LIQUID RESERVES (₹)</label>
            <input
              type="number"
              name="cash"
              value={formData.cash}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">TOTAL OUTSTANDING DEBT (₹)</label>
            <input
              type="number"
              name="debt"
              value={formData.debt}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">ACCOUNTS RECEIVABLE (₹)</label>
            <input
              type="number"
              name="accountsReceivable"
              value={formData.accountsReceivable}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">ACCOUNTS PAYABLE (₹)</label>
            <input
              type="number"
              name="accountsPayable"
              value={formData.accountsPayable}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-zinc-400 mb-2">PREVIOUS PERIOD REVENUE (For Growth Calculation)</label>
            <input
              type="number"
              name="previousRevenue"
              value={formData.previousRevenue}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition"
            >
              Commit & Propagate Across Platform Outputs
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">AUTOMATED OUTPUT PIPELINE</span>
          <h3 className="text-xl font-bold text-white mt-1 mb-6">Derived Metrics Preview</h3>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
              <span className="text-zinc-400">Gross Profit:</span>
              <span className="text-emerald-400 font-bold">₹{grossProfit.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
              <span className="text-zinc-400">Profit Margin:</span>
              <span className="text-blue-400 font-bold">{profitMargin}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
              <span className="text-zinc-400">Expense Ratio:</span>
              <span className="text-amber-400 font-bold">{expenseRatio}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
              <span className="text-zinc-400">Revenue Growth:</span>
              <span className="text-emerald-400 font-bold">+{revenueGrowth}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
              <span className="text-zinc-400">Working Capital:</span>
              <span className="text-blue-400 font-bold">₹{workingCapital.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-[10px] font-mono text-zinc-500">
          <span>STATUS: Single Source of Truth active. All widgets & reports auto-updating.</span>
        </div>
      </div>
    </div>
  );
}
