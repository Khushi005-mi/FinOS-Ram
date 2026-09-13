"use client";

import React, { useRef, useState } from "react";

export interface MultiFileDropzoneProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
}

export function MultiFileDropzone({ onFileSelect, onFilesSelect }: MultiFileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    // Call multi-file handler
    if (onFilesSelect) {
      onFilesSelect(filesArray);
    }
    // Backward compatibility for single file
    if (onFileSelect && filesArray.length > 0) {
      onFileSelect(filesArray[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        dragOver
          ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
          : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/70"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset input value so the same file can be re-selected if removed
          if (e.target) e.target.value = "";
        }}
      />

      <div className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl mx-auto text-zinc-300">
          📂
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Select multiple financial files, or <span className="text-indigo-400 underline">browse</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Upload up to 25 files in one session (Revenue, COGS, Expenses, Bank statements, AR/AP, Payroll)
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
            .CSV
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            .XLSX / .XLS
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60">
            .PDF STATEMENTS
          </span>
          <span className="text-zinc-500">Max 25MB per file</span>
        </div>
      </div>
    </div>
  );
}

export default MultiFileDropzone;
