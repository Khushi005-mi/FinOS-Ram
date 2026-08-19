"use client";

import React, { useRef, useState } from "react";

export interface MultiFileDropzoneProps {
  onFileSelect?: (file: File) => void;
}

// 1️⃣ NAMED EXPORT
export function MultiFileDropzone({ onFileSelect }: MultiFileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selected = files[0];
      setFileName(selected.name);
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

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="text-gray-600">
        {fileName ? (
          <p className="font-semibold text-blue-600">Selected: {fileName}</p>
        ) : (
          <div>
            <p className="text-sm font-medium">Drag & drop your CSV file here, or click to browse</p>
            <p className="mt-1 text-xs text-gray-500">Supports .csv, .xlsx</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 2️⃣ DEFAULT EXPORT at the bottom
export default MultiFileDropzone;
