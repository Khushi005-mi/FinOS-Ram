"use client";

import React from "react";

export type FinancialCategory =
  | "REVENUE"
  | "COGS"
  | "OPEX"
  | "BANK_TRANSACTIONS"
  | "ACCOUNTS_RECEIVABLE"
  | "ACCOUNTS_PAYABLE"
  | "PAYROLL"
  | "INVENTORY"
  | "BALANCE_SHEET"
  | "GENERAL_LEDGER";

export interface QueueFileItem {
  file: File;
  detectedType: FinancialCategory;
}

export interface MultiFileQueueProps {
  files: QueueFileItem[];
  onRemoveFile: (index: number) => void;
  onUpdateType: (index: number, newType: FinancialCategory) => void;
  onAddMoreClick: () => void;
}

const CATEGORY_LABELS: Record<FinancialCategory, string> = {
  REVENUE: "Revenue / Invoices",
  COGS: "Cost of Goods Sold (COGS)",
  OPEX: "Operating Expenses (OpEx)",
  BANK_TRANSACTIONS: "Bank Statement / Transactions",
  ACCOUNTS_RECEIVABLE: "Accounts Receivable (AR)",
  ACCOUNTS_PAYABLE: "Accounts Payable (AP)",
  PAYROLL: "Payroll / Salaries",
  INVENTORY: "Inventory / Stock",
  BALANCE_SHEET: "Balance Sheet",
  GENERAL_LEDGER: "General Ledger",
};

export function detectFileType(fileName: string): FinancialCategory {
  const lower = fileName.toLowerCase();
  if (lower.includes("revenue") || lower.includes("sales") || lower.includes("invoice")) return "REVENUE";
  if (lower.includes("cogs") || lower.includes("cost_of_goods") || lower.includes("direct_cost")) return "COGS";
  if (lower.includes("payroll") || lower.includes("salary") || lower.includes("wages") || lower.includes("staff")) return "PAYROLL";
  if (lower.includes("inventory") || lower.includes("stock")) return "INVENTORY";
  if (lower.includes("bank") || lower.includes("statement") || lower.includes("cash") || lower.includes("deposit")) return "BANK_TRANSACTIONS";
  if (lower.includes("ar") || lower.includes("receivable")) return "ACCOUNTS_RECEIVABLE";
  if (lower.includes("ap") || lower.includes("payable") || lower.includes("vendor") || lower.includes("bill")) return "ACCOUNTS_PAYABLE";
  if (lower.includes("expense") || lower.includes("opex") || lower.includes("spending")) return "OPEX";
  if (lower.includes("balance_sheet") || lower.includes("balancesheet") || lower.includes("assets")) return "BALANCE_SHEET";
  return "GENERAL_LEDGER";
}

export function MultiFileQueue({ files, onRemoveFile, onUpdateType, onAddMoreClick }: MultiFileQueueProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white font-mono">
            FILES SELECTED ({files.length})
          </h3>
          <p className="text-xs text-zinc-400">
            {files.length === 1
              ? "Single financial record ready for processing"
              : `${files.length} financial datasets will be unified under one ingestion session`}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddMoreClick}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
        >
          + Add More Files
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {files.map((item, idx) => (
          <div
            key={`${item.file.name}-${idx}`}
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs hover:border-zinc-700 transition"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-emerald-400 font-bold">✓</span>
              <div className="min-w-0">
                <p className="text-white font-medium truncate font-mono">{item.file.name}</p>
                <p className="text-[11px] text-zinc-400">{formatBytes(item.file.size)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {/* Type Detection Selector */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-zinc-300 font-mono">Type:</span>
                <select
                  value={item.detectedType}
                  onChange={(e) => onUpdateType(idx, e.target.value as FinancialCategory)}
                  className="bg-zinc-800 border border-zinc-700 text-indigo-300 rounded-lg px-2 py-1 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove file button */}
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                title="Remove file"
                className="text-zinc-400 hover:text-red-400 p-1 rounded transition"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MultiFileQueue;
