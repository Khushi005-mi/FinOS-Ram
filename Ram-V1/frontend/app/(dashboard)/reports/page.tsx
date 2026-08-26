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
  let cashFlow: any = null;

  try {
    const [pnl, cf] = await Promise.allSettled([
      reportsApi.getIncomeStatement(),
      reportsApi.getCashFlow(),
    ]);

    if (pnl.status === "fulfilled") incomeStatement = pnl.value;
    if (cf.status === "fulfilled") cashFlow = cf.value;
  } catch (error) {
    console.warn("[Reports Page] Build-time or runtime fetch skipped:", error);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports & Statements</h1>
          <p className="text-sm text-slate-400 mt-1">
            Standard GAAP/IFRS financial statements dynamically generated from your active ledger.
          </p>
        </div>
        <ExportBar />
      </div>

      <div className="space-y-8">
        <IncomeStatementTable data={incomeStatement} />
        <BalanceSheetTable currency="INR" />
        <CashFlowTable data={cashFlow} />
      </div>
    </div>
  );
}
