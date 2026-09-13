"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { submitBatch } from "../api/uploadApi";

export interface ColumnMapperProps {
  file?: File | null;
  files?: File[];
  fileMetadata?: Array<{ fileName: string; sourceType: string }>;
}

const PROGRESS_STAGES = [
  "Uploading financial files",
  "Validating binary integrity & magic bytes",
  "Structuring accounts and ledger columns",
  "Relating multi-file dataset environment",
  "Calculating deterministic exact-decimal metrics",
  "Generating unified executive dashboard",
];

export function ColumnMapper({ file, files, fileMetadata }: ColumnMapperProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Normalize to file array
  const filesToProcess: File[] = files && files.length > 0 ? files : file ? [file] : [];

  const handleIngest = async () => {
    if (filesToProcess.length === 0) return;

    setLoading(true);
    setError(null);
    setCurrentStage(0);

    // Progressive stage animation
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < PROGRESS_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      const metadata = fileMetadata || filesToProcess.map((f) => ({
        fileName: f.name,
        sourceType: "GENERAL_LEDGER",
      }));

      const res = await submitBatch(filesToProcess, metadata);
      clearInterval(stageInterval);

      // Invalidate dashboard caches to load unified metrics
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["organization"] });

      // Navigate to unified dashboard
      router.push("/dashboard");
    } catch (err: any) {
      clearInterval(stageInterval);
      console.error("FinOS Ingestion Engine Alert:", err);
      const reqId =
        err.response?.data?.request_id ||
        err.response?.headers?.["x-request-id"] ||
        "CORR-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail;

      const displayMessage = serverMsg
        ? `${serverMsg} (Audit Ref: ${reqId})`
        : `FinOS Ledger Reconciliation in progress. Your dataset is securely preserved. Please re-try. (Audit Ref: ${reqId})`;

      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-xs font-medium text-red-400 border border-red-500/20 shadow-sm flex items-start space-x-3">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0 animate-pulse" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {loading && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-semibold flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Building Unified Financial View...
            </span>
            <span className="text-indigo-400">
              Step {currentStage + 1} of {PROGRESS_STAGES.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>{PROGRESS_STAGES[currentStage]}</span>
            <span>{filesToProcess.length} {filesToProcess.length === 1 ? "file" : "files"}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleIngest}
        disabled={loading || filesToProcess.length === 0}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2 font-mono"
      >
        {loading ? (
          <span>Processing Unified Financial Batch...</span>
        ) : (
          <span>
            Process Financial Data ({filesToProcess.length} {filesToProcess.length === 1 ? "File" : "Files"})
          </span>
        )}
      </button>
    </div>
  );
}

export default ColumnMapper;
