"use client";

import React, { useState } from "react";
import { Button, Select } from "@/components/ui";

const PERIOD_OPTIONS = [
  { label: "Active Dataset Period", value: "Active Dataset Period" },
  { label: "Q1 2024 (Jan - Mar)", value: "Q1 2024 (Jan - Mar)" },
  { label: "Q2 2024 (Apr - Jun)", value: "Q2 2024 (Apr - Jun)" },
  { label: "Full Fiscal Year 2023-2024", value: "Full Fiscal Year 2023-2024" },
];

interface ExportBarProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function ExportBar({ selectedPeriod, onPeriodChange }: ExportBarProps) {
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
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <span className="text-sm font-semibold text-slate-700 shrink-0">
          Reporting Period:
        </span>
        <div className="w-64">
          <Select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>

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
