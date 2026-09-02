import React from "react";
import { reportsApi } from "@/modules/reports/api/reportsApi";
import { IncomeStatementTable } from "@/modules/reports/components/IncomeStatementTable";
import { BalanceSheetTable } from "@/modules/reports/components/BalanceSheetTable";
import { CashFlowTable } from "@/modules/reports/components/CashFlowTable";
import { ExportBar } from "@/modules/reports/components/ExportBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  let incomeStatement: any = null;
  let balanceSheet: any = null;
  let cashFlow: any = null;

  try {
    const [pnl, bs, cf] = await Promise.allSettled([
      reportsApi.getIncomeStatement(),
      reportsApi.getBalanceSheet(),
      reportsApi.getCashFlow(),
    ]);

    if (pnl.status === "fulfilled") incomeStatement = pnl.value;
    if (bs.status === "fulfilled") balanceSheet = bs.value;
    if (cf.status === "fulfilled") cashFlow = cf.value;
  } catch (error) {
    console.warn("[Reports Page] Fetch fallback applied:", error);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8">
      {/* Header & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports & Statements</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Standard GAAP/IFRS financial statements and board deck exports dynamically derived from your active dataset.
          </p>
        </div>
        <ExportBar />
      </div>

      {/* Financial Statement Tables */}
      <div className="space-y-8">
        <IncomeStatementTable data={incomeStatement} />
        <BalanceSheetTable data={balanceSheet} />
        <CashFlowTable data={cashFlow} />
      </div>
    </div>
  );
}
