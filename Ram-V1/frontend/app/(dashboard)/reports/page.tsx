"use client";

import React, { useEffect, useState, useCallback } from "react";
import { reportsApi } from "@/modules/reports/api/reportsApi";
import { IncomeStatementTable } from "@/modules/reports/components/IncomeStatementTable";
import { BalanceSheetTable } from "@/modules/reports/components/BalanceSheetTable";
import { CashFlowTable } from "@/modules/reports/components/CashFlowTable";
import { ExportBar } from "@/modules/reports/components/ExportBar";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Active Dataset Period");
  const [incomeStatement, setIncomeStatement] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (period: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [pnl, bs, cf] = await Promise.all([
        reportsApi.getIncomeStatement(period).catch(() => null),
        reportsApi.getBalanceSheet(period).catch(() => null),
        reportsApi.getCashFlow(period).catch(() => null),
      ]);
      setIncomeStatement(pnl);
      setBalanceSheet(bs);
      setCashFlow(cf);
    } catch (err: any) {
      setError(err.message || "Failed to load financial statements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(selectedPeriod);
  }, [selectedPeriod, fetchReports]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports & Statements</h1>
          <p className="text-sm text-slate-400 mt-1">
            Standard GAAP/IFRS financial statements dynamically generated from your active dataset.
          </p>
        </div>
        <ExportBar selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
      </div>

      {isLoading && (
        <div className="p-8 text-center text-slate-400">
          Generating audited financial statements from PostgreSQL...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
          {typeof error === "string" ? error : (error?.message || JSON.stringify(error))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-8">
          <IncomeStatementTable data={incomeStatement} />
          <BalanceSheetTable data={balanceSheet} currency={incomeStatement?.currency || "INR"} />
          <CashFlowTable data={cashFlow} />
        </div>
      )}
    </div>
  );
}
