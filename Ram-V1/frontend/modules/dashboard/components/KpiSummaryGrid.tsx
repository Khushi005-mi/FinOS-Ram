"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui";
import { useCurrency } from "@/providers/CurrencyProvider";
import { TransactionInspectorDrawer } from "./TransactionInspectorDrawer";

interface KpiSummaryGridProps {
  metrics?: any;
}

export function KpiSummaryGrid({ metrics }: KpiSummaryGridProps) {
  const { format, symbol } = useCurrency();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const totalRev = Number(metrics?.total_revenue ?? 0);
  const totalCogs = Number(metrics?.total_cogs ?? 0);
  const grossMarginPct = Number(metrics?.gross_margin_pct ?? 0);
  const totalEbitda = Number(metrics?.total_ebitda ?? 0);

  const handleCardClick = (category: string) => {
    setSelectedCategory(category);
    setInspectorOpen(true);
  };

  const cards = [
    {
      title: "Total Revenue",
      value: format(totalRev),
      changePercentage: 0,
      description: "Active dataset total",
      category: "REVENUE",
    },
    {
      title: "Cost of Goods / Sales",
      value: format(totalCogs),
      changePercentage: 0,
      description: totalRev > 0 ? `${((totalCogs / totalRev) * 100).toFixed(1)}% of revenue` : "0.0% of revenue",
      category: "COGS",
    },
    {
      title: "Gross Margin %",
      value: `${grossMarginPct.toFixed(1)}%`,
      changePercentage: 0,
      description: "Target: 40.0% benchmark",
      category: "ALL",
    },
    {
      title: "Operating EBITDA",
      value: format(totalEbitda),
      changePercentage: 0,
      description: totalRev > 0 ? `${((totalEbitda / totalRev) * 100).toFixed(1)}% margin` : "0.0% margin",
      category: "OPEX",
    },
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
                  Active
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 pt-1 border-t border-white/5 truncate">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <TransactionInspectorDrawer
        isOpen={inspectorOpen}
        initialCategory={selectedCategory}
        onClose={() => setInspectorOpen(false)}
      />
    </>
  );
}

export default KpiSummaryGrid;
