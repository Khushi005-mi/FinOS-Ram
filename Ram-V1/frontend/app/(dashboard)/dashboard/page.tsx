import React from "react";
import { dashboardApi } from "@/modules/dashboard/api/dashboardApi";
import { KpiSummaryGrid } from "@/modules/dashboard/components/KpiSummaryGrid";
import { RevenueVsCostChart } from "@/modules/dashboard/components/RevenueVsCostChart";
import { UniversalCostBreakdownWidget } from "@/modules/dashboard/components/UniversalCostBreakdownWidget";
import { ExecutiveInsightsWidget } from "@/modules/dashboard/components/ExecutiveInsightsWidget";

// FORCE NEXT.JS TO DISABLE SERVER CACHING & FETCH LIVE FROM FASTAPI ON EVERY LOAD
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Executive Dashboard - FinOS",
  description: "Financial performance overview and business analytics",
};

export default async function DashboardPage() {
  // Fetch executive data concurrently from FastAPI backend
  const [metrics, trends, costBreakdown, insights] = await Promise.all([
    dashboardApi.getMetrics(),
    dashboardApi.getMonthlyTrends(),
    dashboardApi.getCostBreakdown(),
    dashboardApi.getInsights(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Executive Financial Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time margins, revenue trends, and diagnostic cost analytics.
          </p>
        </div>
      </div>

      {/* 1. Executive KPI Grid */}
      <KpiSummaryGrid metrics={metrics} />

      {/* 2. Charts and Cost Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueVsCostChart data={trends} />
        </div>
        <div className="lg:col-span-1">
          <UniversalCostBreakdownWidget data={costBreakdown} />
        </div>
      </div>

      {/* 3. Executive Automated Diagnostic Insights */}
      <ExecutiveInsightsWidget insights={insights} />
    </div>
  );
}