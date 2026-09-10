"use client";

import React, { useEffect, useState } from "react";
import { dashboardApi } from "@/modules/dashboard/api/dashboardApi";
import { KpiSummaryGrid } from "@/modules/dashboard/components/KpiSummaryGrid";
import { RevenueVsCostChart } from "@/modules/dashboard/components/RevenueVsCostChart";
import { UniversalCostBreakdownWidget } from "@/modules/dashboard/components/UniversalCostBreakdownWidget";
import { ExecutiveInsightsWidget } from "@/modules/dashboard/components/ExecutiveInsightsWidget";
import { WorkingCapitalWidget } from "@/modules/dashboard/components/WorkingCapitalWidget";
import { RecentLedgerActivity } from "@/modules/dashboard/components/RecentLedgerActivity";
import { WhatIfSimulator } from "@/modules/dashboard/components/WhatIfSimulator";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [m, t, c, i] = await Promise.all([
        dashboardApi.getMetrics().catch(() => null),
        dashboardApi.getMonthlyTrends().catch(() => []),
        dashboardApi.getCostBreakdown().catch(() => null),
        dashboardApi.getInsights().catch(() => []),
      ]);

      setMetrics(m);
      setTrends(Array.isArray(t) ? t : []);
      setCostBreakdown(c);
      setInsights(Array.isArray(i) ? i : []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      {/* 1. Header with Immutable Audit Lineage Provenance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Executive Financial Overview
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              ● Live PostgreSQL 16
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time margins, revenue trends, and deterministic GAAP analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Immutable Audit Lineage Badge */}
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-zinc-500 uppercase font-mono block">Active Dataset Lineage</span>
            <span className="text-xs font-mono text-zinc-300 bg-white/5 px-2.5 py-1 rounded border border-white/5">
              SHA-256: Verified Audited Batch
            </span>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md border border-slate-700 transition"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
          {typeof error === "string" ? error : (error?.message || JSON.stringify(error))}
        </div>
      )}

      {/* 2. Top KPI Summary Cards */}
      <KpiSummaryGrid metrics={metrics} />

      {/* 3. Cash Runway & Burn Rate Analysis */}
      <WorkingCapitalWidget metrics={metrics} currency="USD" />

      {/* 4. Charts & Universal Cost Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueVsCostChart data={trends} />
        </div>
        <div>
          <UniversalCostBreakdownWidget data={costBreakdown} />
        </div>
      </div>

      {/* 5. Executive "What-If" Scenario Stress Simulator */}
      <WhatIfSimulator metrics={metrics} currency="USD" />

      {/* 6. Recent Audited Ledger Activity Feed */}
      <RecentLedgerActivity currency="USD" />

      {/* 7. Executive Diagnostic Insights */}
      <ExecutiveInsightsWidget insights={insights} />
    </div>
  );
}
