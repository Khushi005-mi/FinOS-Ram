"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/axios";

interface CompanyEntity {
  id: string;
  name: string;
  industry_type: string;
  currency: string;
  is_active_entity: boolean;
}

export function CompanySwitcher() {
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [activeCompany, setActiveCompany] = useState<string>("Apex Manufacturing Ltd.");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const res = await apiClient.get<CompanyEntity[]>("/organization/portfolio");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCompanies(res.data);
          const active = res.data.find((c) => c.is_active_entity) || res.data[0];
          setActiveCompany(active.name);
        }
      } catch (err) {
        console.warn("[Company Switcher] Using default entity:", err);
      }
    }
    loadPortfolio();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white shadow-sm transition"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="truncate max-w-[180px]">{activeCompany}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-150">
            <p className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Switch Portfolio Entity
            </p>
            {companies.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => {
                  setActiveCompany(comp.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                  comp.name === activeCompany
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <div className="truncate">
                  <p className="truncate font-medium">{comp.name}</p>
                  <p className="text-[10px] text-zinc-500">{comp.industry_type}</p>
                </div>
                {comp.name === activeCompany && (
                  <span className="text-emerald-400 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CompanySwitcher;
