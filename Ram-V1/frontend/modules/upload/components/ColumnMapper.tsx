"use client";

import React, { useState } from "react";
import { useUploadStore } from "../store/uploadStore";
import { FINOS_STANDARD_FIELDS } from "../types/uploadTypes";
import { Button, Select, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

// Default template fallback headers for preview
const MOCK_EXTRACTED_HEADERS: Record<string, string[]> = {
  GENERAL_LEDGER: ["Txn Date", "GL Account Code", "Account Name", "Debit ($)", "Credit ($)", "Voucher Ref"],
  BANK_STATEMENT: ["Posting Date", "Description", "Withdrawal (Dr)", "Deposit (Cr)", "Balance"],
  RAW_MATERIALS_COGS: ["Invoice Date", "Supplier Name", "Item Description", "Total Invoice Cost", "PO Number"],
  PAYROLL_LABOR: ["Pay Period", "Employee ID", "Department", "Gross Pay", "Net Pay"],
};

export function ColumnMapper() {
  const { files, updateColumnMapping, setStep } = useUploadStore();
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  const activeFile = files[activeFileIndex];

  // If no files were attached, return to Step 1
  if (!activeFile) {
    setStep(1);
    return null;
  }

  // Get raw extracted headers for the active file
  const rawHeaders =
    activeFile.detectedHeaders && activeFile.detectedHeaders.length > 0
      ? activeFile.detectedHeaders
      : MOCK_EXTRACTED_HEADERS[activeFile.sourceType] || MOCK_EXTRACTED_HEADERS.GENERAL_LEDGER;

  const currentMapping = activeFile.columnMapping || {};

  // Handle dropdown selection change
  const handleMappingChange = (finosFieldKey: string, selectedHeader: string) => {
    const updated = { ...currentMapping, [finosFieldKey]: selectedHeader };
    updateColumnMapping(activeFile.id, updated);
  };

  // Heuristic Token Auto-Mapper Algorithm
  const handleAutoMap = () => {
    const autoMapped: Record<string, string> = {};

    FINOS_STANDARD_FIELDS.forEach((field) => {
      const match = rawHeaders.find((header) => {
        const h = header.toLowerCase();
        const k = field.key.toLowerCase();

        if (k.includes("date") && h.includes("date")) return true;
        if (k.includes("debit") && (h.includes("debit") || h.includes("dr") || h.includes("withdrawal"))) return true;
        if (k.includes("credit") && (h.includes("credit") || h.includes("cr") || h.includes("deposit"))) return true;
        if (k.includes("account_name") && (h.includes("account") || h.includes("category") || h.includes("supplier") || h.includes("particulars"))) return true;
        if (k.includes("account_code") && (h.includes("code") || h.includes("gl") || h.includes("id"))) return true;
        if (k.includes("amount") && (h.includes("amount") || h.includes("total") || h.includes("cost"))) return true;
        if (k.includes("reference_id") && (h.includes("ref") || h.includes("voucher") || h.includes("po") || h.includes("inv"))) return true;
        return false;
      });

      if (match) {
        autoMapped[field.key] = match;
      }
    });

    updateColumnMapping(activeFile.id, autoMapped);
  };

  const headerOptions = [
    { label: "-- Ignore / Do Not Map --", value: "" },
    ...rawHeaders.map((h) => ({ label: h, value: h })),
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Multi-File Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3 overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={file.id}
            onClick={() => setActiveFileIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 ${
              idx === activeFileIndex
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            📄 {file.name}
          </button>
        ))}
      </div>

      {/* Mapping Card */}
      <Card className="apple-glass">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10">
          <div>
            <CardTitle className="text-white text-base font-semibold">
              Map Columns: {activeFile.name}
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Match your file headers to FinOS canonical target fields.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleAutoMap}>
            ⚡ Auto-Match Headers
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
            {FINOS_STANDARD_FIELDS.map((field) => (
              <div
                key={field.key}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/40 hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{field.key}</p>
                </div>

                <div className="w-full sm:w-72">
                  <Select
                    value={currentMapping[field.key] || ""}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    options={headerOptions}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setStep(1)}>
          ← Back to Upload Files
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            if (activeFileIndex < files.length - 1) {
              setActiveFileIndex((prev) => prev + 1);
            } else {
              setStep(3); // Advance to Step 3: Validation & Preview
            }
          }}
        >
          {activeFileIndex < files.length - 1
            ? `Next File (${activeFileIndex + 2}/${files.length}) →`
            : "Next: Validate & Preview →"}
        </Button>
      </div>
    </div>
  );
}