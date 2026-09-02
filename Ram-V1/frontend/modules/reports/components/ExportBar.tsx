"use client";

import React, { useState } from "react";
import { env } from "@/config/env";

export function ExportBar() {
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const exportUrl = `${env.NEXT_PUBLIC_API_URL}/reports/export/excel`;
      // Trigger native browser download stream
      window.location.href = exportUrl;
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setTimeout(() => setIsDownloadingExcel(false), 2000);
    }
  };

  const handlePrintPdf = () => {
    setIsGeneratingPdf(true);
    // Uses browser vector print engine (Cmd + P / Print to PDF) formatted for financial statements
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 300);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Download Excel Button */}
      <button
        type="button"
        onClick={handleDownloadExcel}
        disabled={isDownloadingExcel}
        className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-200 hover:text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
      >
        <span>📊</span>
        <span>{isDownloadingExcel ? "Exporting Excel..." : "Export Excel (.xlsx)"}</span>
      </button>

      {/* Print / Export Vector PDF Button */}
      <button
        type="button"
        onClick={handlePrintPdf}
        disabled={isGeneratingPdf}
        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-50"
      >
        <span>📄</span>
        <span>{isGeneratingPdf ? "Preparing Deck..." : "Download Board PDF"}</span>
      </button>
    </div>
  );
}

export default ExportBar;
