import React from "react";
import { dashboardApi } from "@/modules/dashboard/api/dashboardApi";
import { KpiSummaryGrid } from "@/modules/dashboard/components/KpiSummaryGrid";
import { RevenueVsCostChart } from "@/modules/dashboard/components/RevenueVsCostChart";
import { UniversalCostBreakdownWidget } from "@/modules/dashboard/components/UniversalCostBreakdownWidget";
import { ExecutiveInsightsWidget } from "@/modules/dashboard/components/ExecutiveInsightsWidget";
import { RunwayBurnWidget } from "@/modules/dashboard/components/RunwayBurnWidget";
import { ScenarioSimulatorWidget } from "@/modules/dashboard/components/ScenarioSimulatorWidget";
import { DatasetVaultDrawer } from "@/modules/dashboard/components/DatasetVaultDrawer";
import { RecentLedgerActivity } from "@/modules/dashboard/components/RecentLedgerActivity";
import { AnomalyRadarWidget } from "@/modules/dashboard/components/AnomalyRadarWidget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  let metrics: any = null;
  let trends: any[] = [];
  let costBreakdown: any = null;
  let insights: any[] = [];

  try {
    const results = await Promise.allSettled([
      dashboardApi.getMetrics(),
      dashboardApi.getMonthlyTrends(),
      dashboardApi.getCostBreakdown(),
      dashboardApi.getInsights(),
    ]);

    if (results[0].status === "fulfilled") metrics = results[0].value;
    if (results[1].status === "fulfilled") trends = Array.isArray(results[1].value) ? results[1].value : [];
    if (results[2].status === "fulfilled") costBreakdown = results[2].value;
    if (results[3].status === "fulfilled") insights = Array.isArray(results[3].value) ? results[3].value : [];
  } catch (err) {
    console.warn("[Dashboard Page] Fetch fallback applied:", err);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      {/* Top Header with Dataset Vault Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Executive Command Center</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time margins, predictive scenario modeling, and enterprise dataset governance.
          </p>
        </div>
        <DatasetVaultDrawer />
      </div>

      {/* Top Row: Executive KPI Cards */}
      <KpiSummaryGrid metrics={metrics} />

      {/* Second Row: What-If Simulator & Cash Runway */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScenarioSimulatorWidget metrics={metrics} />
        </div>
        <div>
          <RunwayBurnWidget metrics={metrics} />
        </div>
      </div>

      {/* Third Row: Charts & COGS Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueVsCostChart data={trends} />
        </div>
        <div>
          <UniversalCostBreakdownWidget data={costBreakdown} />
        </div>
      </div>

      {/* Fourth Row: Cost Leakage Anomaly Radar & CFO Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnomalyRadarWidget metrics={metrics} costBreakdown={costBreakdown} />
        <ExecutiveInsightsWidget insights={insights} />
      </div>

      {/* Bottom Section: Immutable SOC2 Audit Trail Shield */}
      <RecentLedgerActivity />
    </div>
  );
}
