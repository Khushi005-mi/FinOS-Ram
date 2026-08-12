"use client";

import React from "react";
import { useUploadStore } from "@/modules/upload/store/uploadStore";
import { MultiFileDropzone } from "@/modules/upload/components/MultiFileDropzone";
import { ColumnMapper } from "@/modules/upload/components/ColumnMapper";
import { ValidationPreview } from "@/modules/upload/components/ValidationPreview";

export default function UploadPage() {
  const { currentStep } = useUploadStore();

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Financial Multi-Source Data Ingestion
        </h1>
        <p className="text-slate-500 text-sm">
          Upload and reconcile General Ledgers, Bank Statements, Raw Material Invoices, and Payroll sheets into FinOS.
        </p>
      </div>

      {/* Step Indicator Wizard Bar */}
      <div className="flex items-center justify-center space-x-4 max-w-xl mx-auto">
        <div className={`flex items-center space-x-2 text-sm font-semibold ${
          currentStep >= 1 ? "text-indigo-600" : "text-slate-400"
        }`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${
            currentStep >= 1 ? "bg-indigo-600" : "bg-slate-300"
          }`}>1</span>
          <span>Upload Files</span>
        </div>

        <div className="w-12 h-0.5 bg-slate-200" />

        <div className={`flex items-center space-x-2 text-sm font-semibold ${
          currentStep >= 2 ? "text-indigo-600" : "text-slate-400"
        }`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${
            currentStep >= 2 ? "bg-indigo-600" : "bg-slate-300"
          }`}>2</span>
          <span>Map Columns</span>
        </div>

        <div className="w-12 h-0.5 bg-slate-200" />

        <div className={`flex items-center space-x-2 text-sm font-semibold ${
          currentStep >= 3 ? "text-indigo-600" : "text-slate-400"
        }`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${
            currentStep >= 3 ? "bg-indigo-600" : "bg-slate-300"
          }`}>3</span>
          <span>Validate & Save</span>
        </div>
      </div>

      {/* Dynamic Wizard Step Content */}
      <div className="pt-4">
        {currentStep === 1 && <MultiFileDropzone />}
        {currentStep === 2 && <ColumnMapper />}
        {currentStep === 3 && <ValidationPreview />}
      </div>
    </div>
  );
}