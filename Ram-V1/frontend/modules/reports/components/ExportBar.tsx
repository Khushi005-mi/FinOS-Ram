"use client";

import React, { useState } from "react";
import { Button, Select } from "@/components/ui";

const PERIOD_OPTIONS = [
  { label: "Q1 2024 (Jan - Mar)", value: "Q1_2024" },
  { label: "Q2 2024 (Apr - Jun)", value: "Q2_2024" },
  { label: "Full Fiscal Year 2023-2024", value: "FY_2023_2024" },
];

export function ExportBar() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q1_2024");
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      alert("Financial Statement PDF report downloaded successfully.");
    }, 1200);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    setTimeout(() => {
      setIsExportingExcel(false);
      alert("Financial Statement Excel model downloaded successfully.");
    }, 1200);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Fiscal Period Selector */}
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <span className="text-sm font-semibold text-slate-700 shrink-0">
          Reporting Period:
        </span>
        <div className="w-64">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          isLoading={isExportingExcel}
          onClick={handleExportExcel}
        >
          Export Excel (.xlsx)
        </Button>

        <Button
          variant="primary"
          size="sm"
          isLoading={isExportingPdf}
          onClick={handleExportPdf}
        >
          Export PDF Report
        </Button>
      </div>
    </div>
  );
}