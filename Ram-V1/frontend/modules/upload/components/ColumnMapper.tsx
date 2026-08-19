"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { submitBatch } from "../api/uploadApi";

export interface ColumnMapperProps {
  file?: File | null;
}

// 1️⃣ NAMED EXPORT
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
      // 1. Submit the actual file payload
      await submitBatch([file]);

      // 2. Invalidate stale dashboard cache
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      // 3. Navigate smoothly to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.detail || err.message || "Failed to process batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleIngest}
        disabled={loading || !file}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Processing & Ingesting Dataset..." : "Confirm & Ingest"}
      </button>
    </div>
  );
}

// 2️⃣ DEFAULT EXPORT at the bottom
export default ColumnMapper;