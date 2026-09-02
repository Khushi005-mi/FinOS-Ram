"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui";
import { TransactionInspectorDrawer } from "./TransactionInspectorDrawer";

interface KpiSummaryGridProps {
  metrics?: any;
}

export function KpiSummaryGrid({ metrics }: KpiSummaryGridProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const defaultMetric = {
    title: "Metric",
    value: "₹0",
    changePercentage: 0,
    trend: "neutral" as const,
    isPositive: true,
    description: "No data available",
  };

  const revenue = metrics?.revenue || defaultMetric;
  const cogs = metrics?.cogs || defaultMetric;
  const grossMargin = metrics?.grossMargin || defaultMetric;
  const ebitda = metrics?.ebitda || defaultMetric;

  const handleCardClick = (category: string) => {
    setSelectedCategory(category);
    setInspectorOpen(true);
  };

  const cards = [
    { ...revenue, category: "REVENUE", subtitle: "Click to inspect revenue entries" },
    { ...cogs, category: "COGS", subtitle: "Click to inspect direct cost entries" },
    { ...grossMargin, category: "ALL", subtitle: "Click to inspect full P&L ledger" },
    { ...ebitda, category: "OPEX", subtitle: "Click to inspect operating expenses" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            onClick={() => handleCardClick(card.category)}
            className="apple-glass border-white/10 hover:border-white/25 hover:scale-[1.01] transition-all duration-150 cursor-pointer group shadow-sm"
          >
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                  {card.title}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Audit ↗
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-white tracking-tight font-mono">
                  {card.value}
                </p>
                <span className="text-xs font-mono text-zinc-400">
                  {card.changePercentage ? `${card.changePercentage}%` : "Active"}
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 pt-1 border-t border-white/5 truncate">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drill-down slide-over inspector */}
      <TransactionInspectorDrawer
        isOpen={inspectorOpen}
        initialCategory={selectedCategory}
        onClose={() => setInspectorOpen(false)}
      />
    </>
  );
}

export default KpiSummaryGrid;
