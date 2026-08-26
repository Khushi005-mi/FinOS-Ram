"use client";

import React from "react";
import { Button } from "@/components/ui";

export function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
          Organization: Apex Manufacturing Ltd.
        </span>
        <span className="text-xs font-medium text-emerald-600">
          Status: Active Session
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          E
        </div>
        <span className="text-sm font-medium text-slate-800 hidden sm:inline">
          cfo@apexmanufacturing.com
        </span>
      </div>
    </header>
  );
}