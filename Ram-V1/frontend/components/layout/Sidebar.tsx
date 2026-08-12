"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVIGATION_ITEMS = [
  { label: "Executive Dashboard", href: "/dashboard" },
  { label: "Data Ingestion & Upload", href: "/upload" },
  { label: "Financial Reports (P&L)", href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
            F
          </div>
          <div>
            <span className="text-lg font-extrabold text-white">FinOS</span>
            <span className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
              Financial System
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Navigation
        </p>

        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-400">
          FinOS Enterprise v1.0.0
        </div>
      </div>
    </aside>
  );
}