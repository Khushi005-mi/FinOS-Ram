"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { MonthlyTrendPoint } from "../types/dashboardTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface RevenueVsCostChartProps {
  data: MonthlyTrendPoint[];
  currency?: string;
}

export function RevenueVsCostChart({ data, currency = "INR" }: RevenueVsCostChartProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatAxis = (value: number) => formatCurrency(value, currency, true);

  return (
    <Card className="apple-glass">
      <CardHeader>
        <CardTitle className="text-white text-base font-semibold">
          Revenue vs. Operating Cost Trend
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-0.5">
          Monthly comparison of Gross Revenue, COGS, and Gross Profit Margin.
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full pt-4">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={formatAxis} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currency), ""]}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "11px", color: "#a1a1aa" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={26} />
                <Bar dataKey="cogs" name="Cost of Goods / Sales" fill="#3f3f46" radius={[6, 6, 0, 0]} barSize={26} />
                <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-zinc-900/40 animate-pulse rounded-xl flex items-center justify-center text-xs text-zinc-500">
              Loading High-Contrast Visualizer...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}