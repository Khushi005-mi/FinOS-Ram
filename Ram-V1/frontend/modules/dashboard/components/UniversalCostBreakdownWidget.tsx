"use client";

import React from "react";
import { UniversalCostBreakdown, IndustryType } from "../types/dashboardTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface UniversalCostBreakdownWidgetProps {
  data?: UniversalCostBreakdown | any;
  currency?: string;
}

const INDUSTRY_TITLES: Record<string, { title: string; subtitle: string }> = {
  MANUFACTURING: {
    title: "COGS Tri-Breakdown",
    subtitle: "Raw Materials, Factory Labor, and Plant Overhead",
  },
  ECOMMERCE_RETAIL: {
    title: "Direct Cost of Sales Breakdown",
    subtitle: "Product Sourcing, Shipping/Logistics, and Ad Spend",
  },
  SERVICES_AGENCY: {
    title: "Operating Cost Breakdown",
    subtitle: "Direct Project Payroll, Software Tools, and Admin OpEx",
  },
  GENERAL_SMB: {
    title: "Direct Expenses vs. Operating Expenses",
    subtitle: "Direct Sales Cost, Marketing, and Administrative Expenses",
  },
};

export function UniversalCostBreakdownWidget({ data, currency = "INR" }: UniversalCostBreakdownWidgetProps) {
  const industryType: IndustryType = data?.industryType || data?.industry_type || "MANUFACTURING";
  const totalCost = Number(data?.totalCost ?? data?.total_cost ?? 1800000);
  const rawBuckets = data?.buckets || [];

  const defaultBuckets = [
    { label: "Direct Raw Materials", amount: 1040000, percentage: "57.8", color: "bg-indigo-600" },
    { label: "Direct Labor / Payroll", amount: 520000, percentage: "28.9", color: "bg-emerald-500" },
    { label: "Overhead & Facilities", amount: 240000, percentage: "13.3", color: "bg-amber-500" },
  ];

  const buckets = rawBuckets.length > 0 ? rawBuckets : defaultBuckets;
  const { title, subtitle } = INDUSTRY_TITLES[industryType] || INDUSTRY_TITLES.GENERAL_SMB;

  return (
    <Card className="apple-glass">
      <CardHeader>
        <CardTitle className="text-white text-base font-semibold">
          {title}
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Cost Summary Box */}
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/10">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Operating Expense
          </p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(totalCost, currency)}
          </p>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex ring-1 ring-white/10">
          {buckets.map((bucket: any, idx: number) => {
            const pct = bucket?.percentage ?? 0;
            return (
              <div
                key={idx}
                className={`h-full ${bucket?.color || "bg-indigo-600"}`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Buckets Breakdown List */}
        <div className="space-y-3">
          {buckets.map((bucket: any, idx: number) => {
            const amt = Number(bucket?.amount ?? 0);
            const pct = bucket?.percentage ?? "0";
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-2 h-2 rounded-full ${bucket?.color || "bg-indigo-600"}`} />
                  <span className="font-medium text-zinc-300">{bucket?.label || "Category"}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(amt, currency)}</span>
                  <span className="text-zinc-500 ml-2 font-mono">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}