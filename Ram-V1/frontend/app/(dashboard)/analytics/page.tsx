import React from "react";
import {
  UniversalCostBreakdownWidget,
  ExecutiveInsightsWidget,
  dashboardApi,
} from "@/modules/dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manufacturing Analytics - FinOS",
  description: "Unit economics, COGS tri-breakdown, and variance analysis",
};

export default async function AnalyticsPage() {
  const [cogs, insights] = await Promise.all([
    dashboardApi.getCostBreakdown(),
    dashboardApi.getInsights(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Unit Economics & Manufacturing Analytics
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Detailed cost breakdown across Direct Materials, Direct Labor, and Overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UniversalCostBreakdownWidget data={cogs} />
        <ExecutiveInsightsWidget insights={insights} />
      </div>
    </div>
  );
}