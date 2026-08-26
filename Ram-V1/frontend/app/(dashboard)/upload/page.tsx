// app/(dashboard)/upload/page.tsx
"use client";

import React, { useState } from "react";
import { MultiFileDropzone } from "@/modules/upload/components/MultiFileDropzone";
import { ColumnMapper } from "@/modules/upload/components/ColumnMapper";
import { ValidationPreview } from "@/modules/upload/components/ValidationPreview";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<number>(1);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Upload Financial Ledger</h1>
        <p className="text-sm text-gray-500">
          Upload your CSV/Excel transactions to update the active dashboard dataset.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm space-y-6">
        {/* Step 1: Dropzone */}
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Select File</h2>
          <MultiFileDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />
        </div>

        {/* Step 2: Preview (Only shown when file is selected) */}
        {file && (
          <div>
            <h2 className="text-lg font-semibold mb-2">2. Data Preview</h2>
            <ValidationPreview file={file} />
          </div>
        )}

        {/* Step 3: Column Mapping & Ingest Button */}
        {file && (
          <div>
            <h2 className="text-lg font-semibold mb-2">3. Confirm & Submit</h2>
            <ColumnMapper file={file} />
          </div>
        )}
      </div>
    </div>
  );
}