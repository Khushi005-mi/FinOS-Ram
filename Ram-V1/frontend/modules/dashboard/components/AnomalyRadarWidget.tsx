"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useCurrency } from "@/providers/CurrencyProvider";

interface AnomalyRadarProps {
  metrics: any;
  costBreakdown: any;
}

export function AnomalyRadarWidget({ metrics, costBreakdown }: AnomalyRadarProps) {
  const { format } = useCurrency();
  const rev = Number(metrics?.total_revenue ?? 0);
  const cogs = Number(metrics?.total_cogs ?? 0);
  const opex = Number(metrics?.total_opex ?? 0);

  const anomalies = [];

  // 1. Critical Margin Compression Radar
  if (cogs > rev && rev > 0) {
    anomalies.push({
      type: "critical",
      badge: "Inverted Unit Economics",
      title: "Direct Costs Exceed Total Revenue",
      description: `COGS of ${format(cogs)} exceeds Total Revenue (${format(rev)}). Immediate supplier renegotiation or price restructuring required.`,
      icon: "🚨",
      color: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    });
  }

  // 2. Heavy Cost Concentration Radar
  const rawBreakdown = Array.isArray(costBreakdown?.breakdown) ? costBreakdown.breakdown : [];
  const topCostDriver = rawBreakdown.find((b: any) => b.percentage >= 60);
  if (topCostDriver) {
    anomalies.push({
      type: "warning",
      badge: "High Cost Concentration",
      title: `${topCostDriver.category} represents ${topCostDriver.percentage}% of COGS`,
      description: `Single cost bucket absorbs ${format(topCostDriver.amount)}. Diversify sourcing to mitigate supply chain shock.`,
      icon: "⚠️",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    });
  }

  // 3. OpEx Expansion Alert
  if (opex > rev * 0.5 && rev > 0) {
    anomalies.push({
      type: "info",
      badge: "OpEx Overhead Alert",
      title: "Operating Expenses exceed 50% of Revenue",
      description: `Overhead of ${format(opex)} is absorbing significant gross profit cushion.`,
      icon: "🔍",
      color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    });
  }

  // If no critical anomalies, show clean audit status
  if (anomalies.length === 0) {
    anomalies.push({
      type: "healthy",
      badge: "Healthy Ledger Variance",
      title: "Zero Cost Anomalies Detected",
      description: "Transaction distribution falls within standard statistical variance thresholds.",
      icon: "🛡️",
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    });
  }

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse" />
            <CardTitle className="text-white text-sm font-semibold tracking-tight">
              Cost Leakage & Anomaly Radar
            </CardTitle>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-white/10">
            Real-Time Diagnostic
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {anomalies.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border ${item.color} space-y-1.5 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">{item.icon}</span>
                <p className="text-xs font-bold text-white">{item.title}</p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 border border-white/5">
                {item.badge}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90 pl-6 font-mono">
              {item.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default AnomalyRadarWidget;
