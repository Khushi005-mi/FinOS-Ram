"use client";

import React, { useState } from "react";
import { useUploadStore } from "../store/uploadStore";
import { FINOS_STANDARD_FIELDS } from "../types/uploadTypes";
import { Button, Select, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

// Mock extracted headers for preview/testing
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

  // If no files were uploaded, return to step 1
  if (!activeFile) {
    setStep(1);
    return null;
  }

  // Get raw extracted headers for the active file
  const rawHeaders =
    activeFile.detectedHeaders.length > 0
      ? activeFile.detectedHeaders
      : MOCK_EXTRACTED_HEADERS[activeFile.sourceType] || MOCK_EXTRACTED_HEADERS.GENERAL_LEDGER;

  const currentMapping = activeFile.columnMapping || {};

  // Handle mapping selection change
  const handleMappingChange = (finosFieldKey: string, selectedHeader: string) => {
    const updated = { ...currentMapping, [finosFieldKey]: selectedHeader };
    updateColumnMapping(activeFile.id, updated);
  };

  // Heuristic Auto-Mapper Algorithm
  const handleAutoMap = () => {
    const autoMapped: Record<string, string> = {};

    FINOS_STANDARD_FIELDS.forEach((field) => {
      const match = rawHeaders.find((header) => {
        const h = header.toLowerCase();
        const k = field.key.toLowerCase();
        const l = field.label.toLowerCase();

        if (k.includes("date") && h.includes("date")) return true;
        if (k.includes("debit") && (h.includes("debit") || h.includes("dr") || h.includes("withdrawal"))) return true;
        if (k.includes("credit") && (h.includes("credit") || h.includes("cr") || h.includes("deposit"))) return true;
        if (k.includes("account_name") && (h.includes("account") || h.includes("category") || h.includes("supplier"))) return true;
        if (k.includes("account_code") && (h.includes("code") || h.includes("gl") || h.includes("id"))) return true;
        if (k.includes("amount") && (h.includes("amount") || h.includes("total") || h.includes("cost"))) return true;
        if (k.includes("reference_id") && (h.includes("ref") || h.includes("voucher") || h.includes("po"))) return true;
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
      {/* File Selector Tabs (For Multi-File Batches) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={file.id}
            onClick={() => setActiveFileIndex(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              idx === activeFileIndex
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📄 {file.name}
          </button>
        ))}
      </div>

      {/* Mapping Container Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Map Columns: {activeFile.name}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Match your Excel headers to FinOS canonical fields.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleAutoMap}>
            ⚡ Auto-Match Headers
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
            {FINOS_STANDARD_FIELDS.map((field) => (
              <div
                key={field.key}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
              >
                {/* Canonical Target Field */}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{field.key}</p>
                </div>

                {/* Dropdown mapping to Raw Excel Headers */}
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

      {/* Wizard Navigation Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          ← Back to Files
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            // If there are more files in the batch, move to next file tab; else go to Step 3
            if (activeFileIndex < files.length - 1) {
              setActiveFileIndex((prev) => prev + 1);
            } else {
              setStep(3); // Move to Step 3: Validation & Preview
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