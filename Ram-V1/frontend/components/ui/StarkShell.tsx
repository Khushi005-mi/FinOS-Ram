"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StarkShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Data Ingestion", href: "/ingestion" },
    { name: "Financial Reports", href: "/reports" },
    { name: "Team & RBAC", href: "/company" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background ambient neon glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top HUD Header */}
      <header className="glass-panel border-b border-white/10 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse neon-glow-blue" />
            <span className="font-mono tracking-wider font-bold text-lg bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              FINOS // STARK HUD v10.0
            </span>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            SECURE_TLS_1.3 // LIVE
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono text-zinc-400">LEDGER INTEGRITY</p>
            <p className="text-xs font-mono text-emerald-400 font-semibold">100% VERIFIED</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs">
            🛡️
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full z-10">
        {children}
      </main>

      {/* Footer HUD Bar */}
      <footer className="glass-panel border-t border-white/5 py-3 px-6 text-center text-xs font-mono text-zinc-500 flex justify-between items-center">
        <span>SYS_ID: 0x94FA-STARK-SECURE</span>
        <span>LATENCY: 0.8ms // DB: POSTGRESQL 16 RLS ACTIVE</span>
      </footer>
    </div>
  );
}
