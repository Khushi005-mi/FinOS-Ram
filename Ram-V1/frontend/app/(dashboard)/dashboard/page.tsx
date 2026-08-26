import React from "react";
import { dashboardApi } from "@/modules/dashboard/api/dashboardApi";
import { KpiSummaryGrid } from "@/modules/dashboard/components/KpiSummaryGrid";
import { RevenueVsCostChart } from "@/modules/dashboard/components/RevenueVsCostChart";
import { UniversalCostBreakdownWidget } from "@/modules/dashboard/components/UniversalCostBreakdownWidget";
import { ExecutiveInsightsWidget } from "@/modules/dashboard/components/ExecutiveInsightsWidget";

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
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Executive Financial Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time margins, revenue trends, and diagnostic cost analytics.
        </p>
      </div>

      {/* Top KPI Cards Grid */}
      <KpiSummaryGrid metrics={metrics} />

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueVsCostChart data={trends} />
        </div>
        <div>
          <UniversalCostBreakdownWidget data={costBreakdown} />
        </div>
      </div>

      {/* Executive Insights Bottom Section */}
      <ExecutiveInsightsWidget insights={insights} />
    </div>
  );
}
