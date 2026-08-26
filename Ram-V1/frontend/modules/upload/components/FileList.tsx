"use client";

import React from "react";
import { useUploadStore } from "../store/uploadStore";
import { SourceType } from "../types/uploadTypes";
import { Button, Select } from "@/components/ui";

const SOURCE_TYPE_OPTIONS: { label: string; value: SourceType }[] = [
  { label: "General Ledger / Trial Balance", value: "GENERAL_LEDGER" },
  { label: "Bank Account Statement", value: "BANK_STATEMENT" },
  { label: "Raw Materials & COGS Invoices", value: "RAW_MATERIALS_COGS" },
  { label: "Payroll & Direct Labor", value: "PAYROLL_LABOR" },
];

export function FileList() {
  const { files, removeFile, updateSourceType } = useUploadStore();

  if (files.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 mt-6">
      <h4 className="text-sm font-semibold text-slate-800">
        Attached Data Sources ({files.length})
      </h4>

      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        {files.map((item) => (
          <div
            key={item.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
          >
            {/* File Metadata */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                EXCEL
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </div>

            {/* Source Type Selector & Delete Action */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-64">
                <Select
                  value={item.sourceType}
                  onChange={(e) =>
                    updateSourceType(item.id, e.target.value as SourceType)
                  }
                  options={SOURCE_TYPE_OPTIONS}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(item.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}