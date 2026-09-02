"use client";

import React, { useState, useEffect } from "react";
import { dashboardApi } from "../api/dashboardApi";

export interface TransactionRecord {
  id: string;
  date: string;
  account_code: string;
  account_name: string;
  category: string;
  debit: number;
  credit: number;
  net_amount: number;
  description: string;
  reference_id: string;
}

interface TransactionInspectorDrawerProps {
  isOpen: boolean;
  initialCategory?: string;
  onClose: () => void;
}

const CATEGORIES = ["ALL", "REVENUE", "COGS", "OPEX", "ASSET"];

export function TransactionInspectorDrawer({
  isOpen,
  initialCategory = "ALL",
  onClose,
}: TransactionInspectorDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync category state when user clicks different KPI cards
  useEffect(() => {
    setSelectedCategory(initialCategory || "ALL");
  }, [initialCategory]);

  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const data = await dashboardApi.getTransactions({
          category: selectedCategory === "ALL" ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          limit: 100,
        });

        if (isSubscribed) {
          setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
          setTotalCount(Number(data?.total_count ?? 0));
        }
      } catch (err) {
        console.warn("[Transaction Inspector] Fetch error:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchLedger, 150);
    return () => {
      isSubscribed = false;
      clearTimeout(debounceTimer);
    };
  }, [isOpen, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Calculate sum of visible drill-down items
  const netTotal = transactions.reduce((acc, t) => acc + (t.net_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-950 border-l border-white/10 h-full shadow-2xl p-6 flex flex-col z-10 space-y-5">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Transaction Ledger Inspector
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Audit underlying journal entries for the active dataset.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            ✕
          </button>
        </div>

        {/* Category Filter Tabs & Search Bar */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by account name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-400">
            Showing <strong className="text-white">{transactions.length}</strong> of {totalCount} records
          </span>
          <div className="text-right">
            <span className="text-[10px] uppercase text-zinc-500 block">Filtered Net Total</span>
            <span className="text-sm font-bold text-white">
              ₹{netTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="flex-1 overflow-y-auto border border-white/5 rounded-xl bg-zinc-900/30">
          {loading && transactions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-16 text-center font-mono">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-16 text-center">No transactions match your search or filter.</p>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm text-zinc-400 text-[11px] uppercase border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Account & Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5 px-3">
                      <p className="text-white font-medium truncate max-w-[200px]">{t.account_name}</p>
                      <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{t.account_code} • {t.reference_id}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        t.category === "REVENUE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : t.category === "COGS"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {t.debit > 0 ? `₹${t.debit.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {t.credit > 0 ? `₹${t.credit.toLocaleString("en-IN")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionInspectorDrawer;
