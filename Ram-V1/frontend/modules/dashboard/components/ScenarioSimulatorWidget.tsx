"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatFinancialValue, SupportedCurrency } from "@/lib/currency";

interface ScenarioSimulatorWidgetProps {
  metrics: any;
  currency?: SupportedCurrency;
}

export function ScenarioSimulatorWidget({ metrics, currency = "INR" }: ScenarioSimulatorWidgetProps) {
  // Baseline numbers from active dataset
  const baseRevenue = Number(metrics?.total_revenue ?? 0);
  const baseCogs = Number(metrics?.total_cogs ?? 0);
  const baseOpex = Number(metrics?.total_opex ?? 0);

  // Simulation Sliders (Percentage adjustments)
  const [revenueShift, setRevenueShift] = useState<number>(0);       // -50% to +50%
  const [cogsShift, setCogsShift] = useState<number>(0);             // -30% to +50%
  const [opexShift, setOpexShift] = useState<number>(0);             // -20% to +40%

  // Real-Time Simulated Calculations
  const simRevenue = Math.max(0, baseRevenue * (1 + revenueShift / 100));
  const simCogs = Math.max(0, baseCogs * (1 + cogsShift / 100));
  const simOpex = Math.max(0, baseOpex * (1 + opexShift / 100));

  const simGrossProfit = simRevenue - simCogs;
  const simGrossMargin = simRevenue > 0 ? (simGrossProfit / simRevenue) * 100 : 0;
  const simEbitda = simGrossProfit - simOpex;

  const baseEbitda = baseRevenue - baseCogs - baseOpex;
  const ebitdaDelta = simEbitda - baseEbitda;

  const handleReset = () => {
    setRevenueShift(0);
    setCogsShift(0);
    setOpexShift(0);
  };

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-sm font-semibold tracking-tight">
              Executive "What-If" Scenario Simulator
            </CardTitle>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Simulate pricing shifts, supply chain inflation, and hiring impact in real time.
            </p>
          </div>
          {(revenueShift !== 0 || cogsShift !== 0 || opexShift !== 0) && (
            <button
              onClick={handleReset}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Reset to Actuals
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Sliders Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue Growth Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Revenue Growth</span>
              <span className={`font-mono font-bold ${revenueShift > 0 ? "text-emerald-400" : revenueShift < 0 ? "text-rose-400" : "text-zinc-400"}`}>
                {revenueShift > 0 ? `+${revenueShift}%` : `${revenueShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={revenueShift}
              onChange={(e) => setRevenueShift(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* COGS Inflation Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">COGS Inflation</span>
              <span className={`font-mono font-bold ${cogsShift > 0 ? "text-rose-400" : cogsShift < 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                {cogsShift > 0 ? `+${cogsShift}%` : `${cogsShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="5"
              value={cogsShift}
              onChange={(e) => setCogsShift(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* OpEx Expansion Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">OpEx Expansion</span>
              <span className={`font-mono font-bold ${opexShift > 0 ? "text-rose-400" : opexShift < 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                {opexShift > 0 ? `+${opexShift}%` : `${opexShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              step="5"
              value={opexShift}
              onChange={(e) => setOpexShift(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Real-Time Simulated Comparison Cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Simulated Revenue</p>
            <p className="text-base font-extrabold text-white mt-1 font-mono">
              {formatFinancialValue(simRevenue, currency)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Simulated Margin %</p>
            <p className={`text-base font-extrabold mt-1 font-mono ${simGrossMargin >= 40 ? "text-emerald-400" : "text-amber-400"}`}>
              {simGrossMargin.toFixed(1)}%
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Simulated EBITDA</p>
            <p className={`text-base font-extrabold mt-1 font-mono ${simEbitda >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatFinancialValue(simEbitda, currency)}
            </p>
            {ebitdaDelta !== 0 && (
              <span className={`text-[10px] font-mono font-bold block mt-0.5 ${ebitdaDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {ebitdaDelta > 0 ? `+${formatFinancialValue(ebitdaDelta, currency)} delta` : `${formatFinancialValue(ebitdaDelta, currency)} delta`}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ScenarioSimulatorWidget;
