"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface CostBreakdownProps {
  data?: any;
  currency?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Direct Raw Materials": "bg-indigo-500",
  "Direct Labor / Payroll": "bg-emerald-500",
  "Overhead & Facilities": "bg-amber-500",
};

export function UniversalCostBreakdownWidget({ data, currency = "INR" }: CostBreakdownProps) {
  const totalCogs = Number(data?.total_cogs ?? data?.totalCost ?? 0);
  const formattedTotal = data?.total_cogs_formatted || `₹${totalCogs.toLocaleString("en-IN")}`;

  // Direct resolution from backend breakdown array
  const rawBreakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];

  const items = [
    {
      label: "Direct Raw Materials",
      amount: Number(rawBreakdown.find((b: any) => b.category === "Direct Raw Materials")?.amount ?? data?.materials_costs ?? 0),
      percentage: Number(rawBreakdown.find((b: any) => b.category === "Direct Raw Materials")?.percentage ?? 0),
      color: "bg-indigo-500",
    },
    {
      label: "Direct Labor / Payroll",
      amount: Number(rawBreakdown.find((b: any) => b.category === "Direct Labor / Payroll")?.amount ?? data?.labor_costs ?? 0),
      percentage: Number(rawBreakdown.find((b: any) => b.category === "Direct Labor / Payroll")?.percentage ?? 0),
      color: "bg-emerald-500",
    },
    {
      label: "Overhead & Facilities",
      amount: Number(rawBreakdown.find((b: any) => b.category === "Overhead & Facilities")?.amount ?? data?.overhead_costs ?? 0),
      percentage: Number(rawBreakdown.find((b: any) => b.category === "Overhead & Facilities")?.percentage ?? 0),
      color: "bg-amber-500",
    },
  ];

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm font-semibold tracking-tight">
          COGS Tri-Breakdown
        </CardTitle>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Raw Materials, Factory Labor, and Plant Overhead.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Total Cost Box */}
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/5">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Cost of Goods Sold (COGS)
          </p>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">
            {formattedTotal}
          </p>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex ring-1 ring-white/5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`h-full ${item.color} transition-all duration-300`}
              style={{ width: `${item.percentage}%` }}
            />
          ))}
        </div>

        {/* Breakdown Sub-Items */}
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const formattedAmt = `₹${item.amount.toLocaleString("en-IN")}`;
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="font-medium text-zinc-300">{item.label}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-white">{formattedAmt}</span>
                  <span className="text-zinc-500 ml-1.5 text-[11px]">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default UniversalCostBreakdownWidget;
