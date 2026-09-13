"use client";

import React, { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-zinc-950 border-r border-white/10 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header with Collapse Button */}
        <div
          className={`h-16 flex items-center border-b border-white/10 transition-all duration-300 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30 shrink-0">
              F
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="text-sm font-bold text-white tracking-tight block truncate">
                  FinOS Core
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block -mt-0.5 truncate">
                  Enterprise Platform
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 ${
              isCollapsed ? "mt-1" : ""
            }`}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5">
          {!isCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-3 block mb-2 transition-opacity duration-200">
              Navigation
            </span>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-medium transition-all ${
                  isCollapsed
                    ? "justify-center px-2 py-2.5"
                    : "space-x-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div
        className={`border-t border-white/10 transition-all duration-300 ${
          isCollapsed ? "p-3 text-center" : "p-4 space-y-2"
        }`}
      >
        {isCollapsed ? (
          <div
            className="flex flex-col items-center gap-1.5 cursor-default"
            title="Engine Status: Healthy | Database: PostgreSQL 16"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-400">v1.0</span>
          </div>
        ) : (
          <>
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
            <div className="text-[10px] font-mono text-zinc-400 text-center pt-2">
              FinOS Enterprise v1.0.0
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
