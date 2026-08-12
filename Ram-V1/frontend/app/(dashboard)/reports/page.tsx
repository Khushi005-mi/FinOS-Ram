import React from "react";
import { reportsApi } from "@/modules/reports/api/reportsApi";
import { ExportBar } from "@/modules/reports/components/ExportBar";
import { IncomeStatementTable } from "@/modules/reports/components/IncomeStatementTable";
import { BalanceSheetTable } from "@/modules/reports/components/BalanceSheetTable";

export const metadata = {
  title: "Financial Statements - FinOS",
  description: "Income Statement, Balance Sheet, and Cash Flow Reports",
};

export default async function ReportsPage() {
  const statementData = await reportsApi.getIncomeStatement();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Financial Statements & Reporting
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated Income Statement, Balance Sheet, and Export Tools.
        </p>
      </div>

      {/* Export Toolbar */}
      <ExportBar />

      {/* 1. Income Statement Table */}
      <IncomeStatementTable data={statementData} />

      {/* 2. Balance Sheet Table */}
      <BalanceSheetTable />
    </div>
  );
}