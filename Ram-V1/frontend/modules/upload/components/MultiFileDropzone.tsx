"use client";

import React, { useState, DragEvent, ChangeEvent } from "react";
import { useUploadStore } from "../store/uploadStore";
import { FileList } from "./FileList";
import { Button } from "@/components/ui";

export function MultiFileDropzone() {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { files, addFiles, setStep } = useUploadStore();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv")
      );

      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files);
      addFiles(validFiles);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-white/15 bg-zinc-900/60 hover:border-white/30"
        }`}
      >
        <input
          type="file"
          id="file-upload-input"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />

        <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-2xl">
            📁
          </div>

          <div>
            <p className="text-base font-semibold text-white">
              Drag & drop your financial files here
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Upload 1 or multiple Excel (.xlsx, .xls) or CSV files simultaneously
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors">
              Browse Files
            </span>
          </div>
        </label>
      </div>

      <FileList />

      {files.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setStep(2)}
          >
            Next: Map Columns & Auto-Detect ({files.length} {files.length === 1 ? "File" : "Files"}) →
          </Button>
        </div>
      )}
    </div>
  );
}