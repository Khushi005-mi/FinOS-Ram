"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RoleNavigationProps {
  userRole?: "ADMIN" | "USER" | "CFO" | "AUDITOR" | string;
}

export default function RoleNavigation({ userRole = "USER" }: RoleNavigationProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN" || userRole === "CFO";

  const adminNav = [
    { name: "System Control & Health", href: "/admin/control" },
    { name: "Advanced Analytics", href: "/admin/analytics" },
    { name: "Audit & Compliance Logs", href: "/admin/audit" },
    { name: "Global Financial Config", href: "/admin/config" },
  ];

  const userNav = [
    { name: "Executive Dashboard", href: "/dashboard" },
    { name: "Unified KPI Input", href: "/kpis/input" },
    { name: "Financial Reports (GAAP)", href: "/reports" },
    { name: "Data Ingestion Matrix", href: "/ingestion" },
  ];

  const currentNav = isAdmin ? adminNav : userNav;

  return (
    <aside className="w-64 border-r border-zinc-800 bg-[#020408] p-6 flex flex-col justify-between hidden md:flex min-h-screen">
      <div>
        <div className="flex items-center space-x-3 mb-10">
          <div className={`w-3 h-3 rounded-full ${isAdmin ? "bg-amber-500 shadow-[0_0_12px_#f59e0b]" : "bg-blue-500 shadow-[0_0_12px_#3b82f6]"}`} />
          <div>
            <span className="font-mono tracking-wider font-bold text-xs text-white block">
              FINOS // {isAdmin ? "ADMIN_CONTROL" : "EXECUTIVE_SUITE"}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{isAdmin ? "Operational Tier" : "Decision Tier"}</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3 px-3">
            {isAdmin ? "System Operations" : "Core Modules"}
          </p>
          {currentNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? isAdmin
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg"
                      : "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
        <p className="text-[10px] text-zinc-500">ACTIVE SESSION ROLE</p>
        <p className={`font-bold mt-0.5 ${isAdmin ? "text-amber-400" : "text-blue-400"}`}>
          {userRole.toUpperCase()} // SECURE
        </p>
      </div>
    </aside>
  );
}
