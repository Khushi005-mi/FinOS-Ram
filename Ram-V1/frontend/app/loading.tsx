import React from "react";
import { Spinner } from "@/components/ui";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Loading FinOS...</p>
      </div>
    </div>
  );
}