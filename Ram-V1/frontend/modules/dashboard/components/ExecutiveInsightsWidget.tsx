"use client";

import React from "react";
import { ExecutiveInsight } from "../types/dashboardTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ExecutiveInsightsWidgetProps {
  insights: ExecutiveInsight[];
}

export function ExecutiveInsightsWidget({ insights }: ExecutiveInsightsWidgetProps) {
  return (
    <Card className="apple-glass">
      <CardHeader>
        <CardTitle className="text-white text-base font-semibold">
          Executive Diagnostic Insights
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {insights?.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex items-start space-x-3.5 hover:border-white/10 transition-colors"
          >
            {/* High-Contrast Status Indicator Dot */}
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                item.type === "warning"
                  ? "bg-amber-400 shadow-sm shadow-amber-400/50"
                  : item.type === "positive"
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "bg-indigo-400 shadow-sm shadow-indigo-400/50"
              }`}
            />
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {item.summary}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}