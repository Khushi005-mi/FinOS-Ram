import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
          <p className="text-sm text-slate-500">
            The financial dashboard page you are looking for does not exist.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}