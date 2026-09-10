"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Executive Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Data Ingestion & Upload", href: "/upload", icon: "📁" },
  { label: "Financial Statements", href: "/reports", icon: "📑" },
  { label: "Team & Permissions", href: "/settings", icon: "👥" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/10 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
            F
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block">FinOS Core</span>
            <span className="text-[10px] font-mono text-zinc-400 block -mt-0.5">Enterprise Platform</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-semibold px-3 block mb-2">
            Navigation
          </span>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <span>Engine Status</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Healthy
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <span>Database</span>
          <span className="text-zinc-300">PostgreSQL 16</span>
        </div>
        <div className="text-[10px] font-mono text-zinc-300 text-center pt-2">
          FinOS Enterprise v1.0.0
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
