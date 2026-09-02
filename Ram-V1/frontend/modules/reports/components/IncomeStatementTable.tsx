"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface IncomeStatementProps {
  data?: any;
}

export function IncomeStatementTable({ data }: IncomeStatementProps) {
  const rev = Number(data?.total_revenue ?? 0);
  const cogs = Number(data?.total_cogs ?? 0);
  const gp = Number(data?.gross_profit ?? 0);
  const opex = Number(data?.total_opex ?? 0);
  const ebitda = Number(data?.net_operating_income ?? 0);
  const marginPct = Number(data?.gross_margin_pct ?? 0);

  const formatAmt = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-bold">
              Income Statement (Profit & Loss)
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              GAAP compliant multi-step operating performance.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {marginPct}% Gross Margin
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4 font-mono text-xs">
        {/* 1. Revenue Tier */}
        <div>
          <div className="flex justify-between font-bold text-zinc-400 uppercase text-[11px] pb-2 border-b border-white/5">
            <span>Operating Revenue</span>
            <span>Amount (INR)</span>
          </div>
          <div className="py-2 space-y-1.5 text-zinc-300">
            {Array.isArray(data?.revenue_items) && data.revenue_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between pl-3 hover:text-white">
                <span className="text-zinc-400">{item.name}</span>
                <span>{formatAmt(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5 bg-zinc-900/40 px-3 py-1.5 rounded-lg">
            <span>Total Revenue</span>
            <span>{formatAmt(rev)}</span>
          </div>
        </div>

        {/* 2. COGS Tier */}
        <div>
          <div className="flex justify-between font-bold text-zinc-400 uppercase text-[11px] pb-2 border-b border-white/5">
            <span>Cost of Goods Sold (COGS)</span>
            <span>Amount</span>
          </div>
          <div className="py-2 space-y-1.5 text-zinc-300">
            {Array.isArray(data?.cogs_items) && data.cogs_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between pl-3 hover:text-white">
                <span className="text-zinc-400">{item.name}</span>
                <span>{formatAmt(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5 bg-zinc-900/40 px-3 py-1.5 rounded-lg">
            <span>Total COGS</span>
            <span>{formatAmt(cogs)}</span>
          </div>
        </div>

        {/* Gross Profit Subtotal */}
        <div className="flex justify-between font-extrabold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
          <span>GROSS PROFIT</span>
          <span>{formatAmt(gp)}</span>
        </div>

        {/* 3. OpEx Tier */}
        <div>
          <div className="flex justify-between font-bold text-zinc-400 uppercase text-[11px] pb-2 border-b border-white/5">
            <span>Operating Expenses (OpEx)</span>
            <span>Amount</span>
          </div>
          <div className="py-2 space-y-1.5 text-zinc-300">
            {Array.isArray(data?.opex_items) && data.opex_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between pl-3 hover:text-white">
                <span className="text-zinc-400">{item.name}</span>
                <span>{formatAmt(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5 bg-zinc-900/40 px-3 py-1.5 rounded-lg">
            <span>Total Operating Expenses</span>
            <span>{formatAmt(opex)}</span>
          </div>
        </div>

        {/* Net Operating Income / EBITDA */}
        <div className="flex justify-between font-extrabold text-sm text-white bg-indigo-600/20 border border-indigo-500/30 px-3.5 py-2.5 rounded-xl">
          <span>NET OPERATING INCOME (EBITDA)</span>
          <span className={ebitda >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {formatAmt(ebitda)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default IncomeStatementTable;
