"use client";

import React from "react";
import { DashboardMetrics } from "../types/dashboardTypes";
import { Card, CardContent } from "@/components/ui";

interface KpiSummaryGridProps {
  metrics?: DashboardMetrics | any;
}

export function KpiSummaryGrid({ metrics }: KpiSummaryGridProps) {
  // Default fallback metric item
  const defaultMetric = {
    title: "Metric",
    value: "$0",
    changePercentage: 0,
    trend: "neutral" as const,
    isPositive: true,
    description: "No data available",
  };

  // Extract metrics safely supporting both camelCase and snake_case
  const revenue = metrics?.revenue || defaultMetric;
  const cogs = metrics?.cogs || defaultMetric;
  const grossMargin = metrics?.grossMargin || metrics?.gross_margin || defaultMetric;
  const ebitda = metrics?.ebitda || defaultMetric;

  const items = [revenue, cogs, grossMargin, ebitda];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        // Defensive check ensuring item is defined
        const safeItem = item || defaultMetric;
        const isPos = safeItem.isPositive ?? true;
        const pct = safeItem.changePercentage ?? 0;

        return (
          <Card key={index} className="apple-glass-interactive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {safeItem.title || "Metric"}
                </span>

                {/* High-Contrast Trend Badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isPos
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {safeItem.trend === "up" ? "+" : "-"}{Math.abs(pct)}%
                </span>
              </div>

              {/* Metric Value */}
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">
                  {safeItem.value || "$0"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5">
                  {safeItem.description || "vs. previous period"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}