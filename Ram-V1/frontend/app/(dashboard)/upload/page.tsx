"use client";

import React, { useState } from "react";
import { MultiFileDropzone } from "@/modules/upload/components/MultiFileDropzone";
import {
  MultiFileQueue,
  QueueFileItem,
  FinancialCategory,
  detectFileType,
} from "@/modules/upload/components/MultiFileQueue";
import { ColumnMapper } from "@/modules/upload/components/ColumnMapper";
import { ValidationPreview } from "@/modules/upload/components/ValidationPreview";

export default function UploadPage() {
  const [queue, setQueue] = useState<QueueFileItem[]>([]);

  const handleFilesSelect = (newFiles: File[]) => {
    setQueue((prev) => {
      // Append new files avoiding duplicate names
      const existingNames = new Set(prev.map((item) => item.file.name));
      const additions: QueueFileItem[] = newFiles
        .filter((f) => !existingNames.has(f.name))
        .map((f) => ({
          file: f,
          detectedType: detectFileType(f.name),
        }));
      return [...prev, ...additions];
    });
  };

  const handleRemoveFile = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateType = (index: number, newType: FinancialCategory) => {
    setQueue((prev) =>
      prev.map((item, i) => (i === index ? { ...item, detectedType: newType } : item))
    );
  };

  const filesArray = queue.map((item) => item.file);
  const metadata = queue.map((item) => ({
    fileName: item.file.name,
    sourceType: item.detectedType,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
          Upload Financial Ledger
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Upload single files or multi-file financial environments (Revenue, COGS, Expenses, Bank statements, AR/AP).
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl space-y-6">
        {/* Step 1: Dropzone */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-300 font-mono mb-2">
            1. Select Financial Files
          </h2>
          <MultiFileDropzone
            onFilesSelect={handleFilesSelect}
            onFileSelect={(single) => handleFilesSelect([single])}
          />
        </div>

        {/* Step 2: Queue & Category Detection (Shown when 1 or more files are selected) */}
        {queue.length > 0 && (
          <div className="border-t border-zinc-800/80 pt-6">
            <h2 className="text-sm font-semibold text-zinc-300 font-mono mb-2">
              2. Dataset Structure & Type Detection
            </h2>
            <MultiFileQueue
              files={queue}
              onRemoveFile={handleRemoveFile}
              onUpdateType={handleUpdateType}
              onAddMoreClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
            />
          </div>
        )}

        {/* Step 3: Preview (Shown for single-file validation inspectability) */}
        {queue.length === 1 && (
          <div className="border-t border-zinc-800/80 pt-6">
            <h2 className="text-sm font-semibold text-zinc-300 font-mono mb-2">
              3. Data Preview & Inspectability
            </h2>
            <ValidationPreview file={queue[0].file} />
          </div>
        )}

        {/* Step 4: Single Unified Ingestion Action */}
        {queue.length > 0 && (
          <div className="border-t border-zinc-800/80 pt-6">
            <h2 className="text-sm font-semibold text-zinc-300 font-mono mb-2">
              {queue.length === 1 ? "4. Confirm & Ingest" : "3. Process Financial Environment"}
            </h2>
            <ColumnMapper files={filesArray} fileMetadata={metadata} />
          </div>
        )}
      </div>
    </div>
  );
}
