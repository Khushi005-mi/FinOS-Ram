"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface BalanceSheetTableProps {
  data?: any;
  currency?: string;
}

export function BalanceSheetTable({ data, currency = "INR" }: BalanceSheetTableProps) {
  const totalAssets = Number(data?.total_assets ?? 0);
  const totalLiabilities = Number(data?.total_liabilities ?? 0);
  const totalEquity = Number(data?.total_equity ?? 0);
  const isBalanced = Boolean(data?.is_balanced);

  const formatAmt = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-bold">
              Balance Sheet Statement
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Financial position: Assets = Liabilities + Stockholder's Equity.
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
              isBalanced
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            {isBalanced ? "Balanced Position" : "Active Ledger Position"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 font-mono text-xs">
        {/* Assets Section */}
        <div className="space-y-4">
          <div className="flex justify-between font-bold text-zinc-400 uppercase text-[11px] pb-2 border-b border-white/5">
            <span>Assets</span>
            <span>Amount</span>
          </div>
          <div className="space-y-1.5 text-zinc-300">
            {Array.isArray(data?.assets) && data.assets.length > 0 ? (
              data.assets.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between pl-3 hover:text-white">
                  <span className="text-zinc-400">{item.name}</span>
                  <span>{formatAmt(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-600 pl-3 italic">Derived from operational cash reserves</p>
            )}
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5 bg-zinc-900/40 px-3 py-1.5 rounded-lg">
            <span>Total Assets</span>
            <span>{formatAmt(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities & Equity Section */}
        <div className="space-y-4">
          <div className="flex justify-between font-bold text-zinc-400 uppercase text-[11px] pb-2 border-b border-white/5">
            <span>Liabilities & Equity</span>
            <span>Amount</span>
          </div>
          <div className="space-y-1.5 text-zinc-300">
            {Array.isArray(data?.liabilities) && data.liabilities.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between pl-3 hover:text-white">
                <span className="text-zinc-400">{item.name}</span>
                <span>{formatAmt(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5 bg-zinc-900/40 px-3 py-1.5 rounded-lg">
            <span>Total Liabilities & Equity</span>
            <span>{formatAmt(totalLiabilities + totalEquity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BalanceSheetTable;
