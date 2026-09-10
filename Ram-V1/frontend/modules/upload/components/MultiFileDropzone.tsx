"use client";

import React, { useRef, useState } from "react";

export interface MultiFileDropzoneProps {
  onFileSelect?: (file: File) => void;
}

export function MultiFileDropzone({ onFileSelect }: MultiFileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selected = files[0];
      setFileName(selected.name);
      setFileSize(formatBytes(selected.size));
      if (onFileSelect) {
        onFileSelect(selected);
      }
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

  const getFileExtension = (name: string): string => {
    const ext = name.split(".").pop()?.toUpperCase() || "FILE";
    return ext;
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
        accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="space-y-4">
        {fileName ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
              {getFileExtension(fileName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white font-mono">{fileName}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{fileSize} • Ready for GAAP Validation</p>
            </div>
            <span className="text-[11px] text-indigo-400 hover:underline pt-1">
              Click to choose a different file
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl mx-auto text-zinc-300">
              📂
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag & drop financial records here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Ingests general ledgers, trial balances, P&L extracts, and bank statements
              </p>
            </div>

            {/* Omni-Parser Format Badges */}
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
              <span className="text-zinc-500">Max 25MB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiFileDropzone;
