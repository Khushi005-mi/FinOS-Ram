"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface SimulatorProps {
  metrics?: any;
  currency?: string;
}

export function WhatIfSimulator({ metrics, currency = "USD" }: SimulatorProps) {
  const baseRevenue = metrics?.totalRevenue ?? metrics?.total_revenue ?? 3000000;
  const baseCogs = metrics?.totalCogs ?? metrics?.total_cogs ?? 700000;
  const baseOpex = metrics?.totalOpex ?? metrics?.total_opex ?? 1300000;

  // Sliders: Percentage deviations
  const [revenueDelta, setRevenueDelta] = useState<number>(0);
  const [cogsDelta, setCogsDelta] = useState<number>(0);

  // Projected Calculations
  const simRevenue = baseRevenue * (1 + revenueDelta / 100);
  const simCogs = baseCogs * (1 + cogsDelta / 100);
  const simGrossProfit = simRevenue - simCogs;
  const simGrossMarginPct = simRevenue > 0 ? ((simGrossProfit / simRevenue) * 100).toFixed(1) : "0.0";
  const simEbitda = simGrossProfit - baseOpex;
  const simEbitdaMarginPct = simRevenue > 0 ? ((simEbitda / simRevenue) * 100).toFixed(1) : "0.0";

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-bold">
              Executive "What-If" Scenario Stress Simulator
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate revenue expansions and supplier inflation impacts on operating EBITDA in real time
            </p>
          </div>
          <button
            onClick={() => { setRevenueDelta(0); setCogsDelta(0); }}
            className="text-xs text-zinc-400 hover:text-white underline"
          >
            Reset Scenarios
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
          {/* Revenue Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Revenue Sensitivity</span>
              <span className={`font-mono ${revenueDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {revenueDelta >= 0 ? `+${revenueDelta}%` : `${revenueDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={revenueDelta}
              onChange={(e) => setRevenueDelta(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>-25% Recession</span>
              <span>Baseline</span>
              <span>+25% Bull Case</span>
            </div>
          </div>

          {/* COGS Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">COGS / Supplier Inflation</span>
              <span className={`font-mono ${cogsDelta <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {cogsDelta >= 0 ? `+${cogsDelta}%` : `${cogsDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={cogsDelta}
              onChange={(e) => setCogsDelta(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>-20% Deflation</span>
              <span>Baseline</span>
              <span>+20% High Inflation</span>
            </div>
          </div>
        </div>

        {/* Projected Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Projected Revenue</span>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {formatCurrency(simRevenue, currency)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Projected COGS</span>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {formatCurrency(simCogs, currency)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Projected Gross Margin</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {simGrossMarginPct}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Projected EBITDA</span>
            <div className={`text-lg font-bold font-mono mt-1 ${simEbitda >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(simEbitda, currency)} ({simEbitdaMarginPct}%)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
