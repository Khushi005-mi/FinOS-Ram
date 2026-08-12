import React from "react";
import {
  KpiSummaryGrid,
  RevenueVsCostChart,
  UniversalCostBreakdownWidget,
  ExecutiveInsightsWidget,
  dashboardApi,
} from "@/modules/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Executive Dashboard - FinOS",
  description: "Financial performance overview and business analytics",
};

export default async function DashboardPage() {
  const [metrics, trends, costBreakdown, insights] = await Promise.all([
    dashboardApi.getMetrics(),
    dashboardApi.getMonthlyTrends(),
    dashboardApi.getCostBreakdown(),
    dashboardApi.getInsights(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Executive Financial Overview
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Real-time margins, revenue trends, and diagnostic cost analytics.
        </p>
      </div>

      <KpiSummaryGrid metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueVsCostChart data={trends} />
        </div>
        <div className="lg:col-span-1">
          <UniversalCostBreakdownWidget data={costBreakdown} />
        </div>
      </div>

      <ExecutiveInsightsWidget insights={insights} />
    </div>
  );
}