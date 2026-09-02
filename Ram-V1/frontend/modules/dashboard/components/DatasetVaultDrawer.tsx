"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardApi } from "../api/dashboardApi";

interface BatchRecord {
  id: string;
  status: string;
  file_count: number;
  total_records_ingested: number;
  created_at: string | null;
  is_active: boolean;
}

export function DatasetVaultDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadBatchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getBatches();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[Dataset Vault] Could not fetch batches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBatchHistory();
    }
  }, [isOpen]);

  const handleActivateDataset = async (batchId: string) => {
    setActivatingId(batchId);
    try {
      await dashboardApi.activateBatch(batchId);
      await loadBatchHistory();
      // Instantly re-run server-side queries for the new active dataset
      router.refresh();
    } catch (err) {
      console.error("[Dataset Vault] Failed to activate batch:", err);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <>
      {/* Sleek Apple-Glass Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-white/20 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800/90 transition-all duration-150 active:scale-[0.98]"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 animate-pulse" />
        <span>Dataset Vault</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5">
          {batches.length > 0 ? `${batches.length} Batches` : "History"}
        </span>
      </button>

      {/* Slide-Over Drawer Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-zinc-950 border-l border-white/10 h-full shadow-2xl p-6 flex flex-col z-10 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Dataset Version Control
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select any historical batch to drive the live dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Batch List Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoading && batches.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                  Loading dataset history...
                </div>
              ) : batches.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No historical batches found.
                </div>
              ) : (
                batches.map((batch, idx) => {
                  const formattedDate = batch.created_at
                    ? new Date(batch.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent Upload";

                  return (
                    <div
                      key={batch.id}
                      className={`p-4 rounded-xl border transition-all ${
                        batch.is_active
                          ? "bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/20"
                          : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              batch.is_active
                                ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                : "bg-zinc-600"
                            }`}
                          />
                          <span className="text-xs font-bold text-white font-mono">
                            BATCH #{batches.length - idx}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            batch.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {batch.is_active ? "ACTIVE" : batch.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400">
                        <span>{batch.total_records_ingested} records</span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                        {batch.is_active ? (
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Currently Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateDataset(batch.id)}
                            disabled={activatingId === batch.id}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            {activatingId === batch.id ? "Activating..." : "Set as Active Dataset"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Quick Action */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-mono">
                {batches.length} Total Batches
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/upload");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Ingest New Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DatasetVaultDrawer;
