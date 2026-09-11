"use client";

import React from "react";
import { FinancialStatementPayload } from "../types/reportsTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface IncomeStatementTableProps {
  data: FinancialStatementPayload;
}

export function IncomeStatementTable({ data }: IncomeStatementTableProps) {
  const currency = data?.currency || "INR";

  const renderAmount = (amount: number) => formatCurrency(amount, currency);

  return (
    <Card className="w-full apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-white text-lg font-bold">
              Income Statement (Profit & Loss)
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              {data?.organizationName || "FinOS Enterprise"} • Reporting Period: {data?.periodName || "Active Period"} ({currency})
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/80 text-zinc-400 font-semibold text-[11px]">
                <th className="py-2.5 px-6">Account Code & Description</th>
                <th className="py-2.5 px-6 text-right">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {/* 1. REVENUE SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>
                  Operating Revenue
                </td>
              </tr>
              {(data?.revenue || []).map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    {row.accountCode && <span className="text-zinc-500 mr-2">{row.accountCode}</span>}
                    {row.accountName}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(row.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-zinc-900 font-bold border-t border-white/10">
                <td className="py-2.5 px-6 text-white">Total Operating Revenue</td>
                <td className="py-2.5 px-6 text-right font-mono text-emerald-400">
                  {renderAmount(data?.totalRevenue ?? (data as any)?.total_revenue ?? 0)}
                </td>
              </tr>

              {/* 2. COST OF SALES / COGS SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>
                  Cost of Goods / Direct Sales Expense
                </td>
              </tr>
              {(data?.costOfSales || (data as any)?.cost_of_sales || []).map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    {row.accountCode && <span className="text-zinc-500 mr-2">{row.accountCode}</span>}
                    {row.accountName}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(row.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-zinc-900 font-bold border-t border-white/10">
                <td className="py-2.5 px-6 text-white">Total Cost of Sales</td>
                <td className="py-2.5 px-6 text-right font-mono text-rose-400">
                  {renderAmount(data?.totalCostOfSales ?? data?.totalCostOfSales ?? 0)}
                </td>
              </tr>

              {/* GROSS PROFIT HIGHLIGHT ROW */}
              <tr className="bg-indigo-950/50 font-bold text-indigo-200 border-y border-indigo-500/30">
                <td className="py-3 px-6 text-sm">GROSS PROFIT</td>
                <td className="py-3 px-6 text-right font-mono text-sm text-indigo-300">
                  {renderAmount(data?.grossProfit ?? data?.grossProfit ?? 0)}
                </td>
              </tr>

              {/* 3. OPERATING EXPENSES (OPEX) */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>
                  Operating Expenses (OpEx)
                </td>
              </tr>
              {(data?.operatingExpenses || data?.operatingExpenses || []).map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    {row.accountCode && <span className="text-zinc-500 mr-2">{row.accountCode}</span>}
                    {row.accountName}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(row.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-zinc-900 font-bold border-t border-white/10">
                <td className="py-2.5 px-6 text-white">Total Operating Expenses</td>
                <td className="py-2.5 px-6 text-right font-mono text-amber-400">
                  {renderAmount(data?.totalOperatingExpenses ?? data?.totalOperatingExpenses ?? 0)}
                </td>
              </tr>

              {/* NET INCOME FINAL ROW */}
              <tr className="bg-zinc-900 font-extrabold text-white text-sm border-t-2 border-white/20">
                <td className="py-3.5 px-6 tracking-wide">NET OPERATING INCOME</td>
                <td className="py-3.5 px-6 text-right font-mono text-emerald-400">
                  {renderAmount(data?.netIncome ?? data?.netIncome ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}