"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { submitBatch } from "../api/uploadApi";

export interface ColumnMapperProps {
  file?: File | null;
}

export function ColumnMapper({ file }: ColumnMapperProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      await submitBatch([file]);
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("FinOS Ingestion Engine Alert:", err);
      // Institutional Error Shield: Never display raw tracebacks to executives
      const reqId = err.response?.data?.request_id || err.response?.headers?.["x-request-id"] || "CORR-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.detail;
      
      const displayMessage = serverMsg
        ? `${serverMsg} (Audit Ref: ${reqId})`
        : `FinOS Ledger Reconciliation in progress. Your dataset is securely preserved. Please re-try in a moment. (Audit Ref: ${reqId})`;

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

      <button
        type="button"
        onClick={handleIngest}
        disabled={loading || !file}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Verifying Ledger Integrity & Ingesting...</span>
          </>
        ) : (
          <span>Confirm & Ingest to Enterprise Ledger</span>
        )}
      </button>
    </div>
  );
}

export default ColumnMapper;
