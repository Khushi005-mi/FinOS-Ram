"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
          !
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500">
            An unexpected error occurred while loading this page.
          </p>
        </div>

        <div className="pt-2">
          <Button variant="primary" className="w-full" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}