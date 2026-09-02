"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatFinancialValue, SupportedCurrency } from "@/lib/currency";

interface RunwayBurnWidgetProps {
  metrics: any;
  currency?: SupportedCurrency;
}

export function RunwayBurnWidget({ metrics, currency = "INR" }: RunwayBurnWidgetProps) {
  const ebitda = Number(metrics?.total_ebitda ?? metrics?.ebitda ?? 0);
  const isBurning = ebitda < 0;
  const monthlyBurn = Math.abs(ebitda);

  // Baseline assumption: Cash reserve derived from active cash assets or standard 6-month buffer
  const cashReserve = Number(metrics?.cash_reserve ?? metrics?.total_revenue ? metrics.total_revenue * 1.5 : 5000000);
  
  // Calculate runway months
  const runwayMonths = isBurning && monthlyBurn > 0 
    ? (cashReserve / monthlyBurn).toFixed(1)
    : "Self-Sustaining";

  const isCritical = isBurning && Number(runwayMonths) < 6;

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-sm font-semibold tracking-tight">
              Cash Runway & Burn Rate
            </CardTitle>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Operating liquidity and survival runway diagnostics.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border font-mono ${
              isCritical
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : isBurning
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {isBurning ? `${runwayMonths} Mo. Runway` : "Cash Flow Positive"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5">
            <p className="text-[11px] font-medium text-zinc-400">
              {isBurning ? "Monthly Net Burn" : "Monthly Net Cash Flow"}
            </p>
            <p className={`text-lg font-bold mt-1 font-mono ${isBurning ? "text-rose-400" : "text-emerald-400"}`}>
              {formatFinancialValue(ebitda, currency)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5">
            <p className="text-[11px] font-medium text-zinc-400">
              Estimated Cash Buffer
            </p>
            <p className="text-lg font-bold text-white mt-1 font-mono">
              {formatFinancialValue(cashReserve, currency)}
            </p>
          </div>
        </div>

        {/* Tactical Status Banner */}
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/5 text-xs flex items-center justify-between">
          <span className="text-zinc-400">
            {isBurning
              ? `At current burn rate, runway expires in ~${runwayMonths} months.`
              : "Operations generate positive cash cushion. Zero external burn."}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Active Assessment
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default RunwayBurnWidget;
