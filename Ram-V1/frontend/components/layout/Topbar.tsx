"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api/axios";
import { Button } from "@/components/ui";

const AVAILABLE_CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "AED", symbol: "AED", label: "AED - UAE Dirham" },
];

export function Topbar() {
  const { user, signOut } = useAuth();
  const [currency, setCurrency] = useState<string>("USD");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    // Fetch active organization profile to load currency
    apiClient.get("/organization/me").then((res) => {
      const org = res.data;
      if (org?.currency) {
        setCurrency(org.currency.toUpperCase());
      }
    }).catch(() => {});
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsUpdating(true);
    try {
      setCurrency(newCurrency);
      // Persist to PostgreSQL 16
      await apiClient.patch("/organization/me", { currency: newCurrency });
      // Reload dashboard data seamlessly
      window.location.reload();
    } catch (err) {
      console.error("Failed to update organization currency:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="h-16 bg-zinc-950 border-b border-white/10 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
          Org: {user?.organization_id ? `${user.organization_id.slice(0, 8)}...` : "FinOS Global"}
        </span>

        {/* Live Currency Selector Dropdown */}
        <div className="relative flex items-center">
          <label htmlFor="currency-select" className="sr-only">Select Currency</label>
          <select
            id="currency-select"
            value={currency}
            disabled={isUpdating}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="text-xs font-mono font-semibold bg-white/5 text-emerald-400 border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer hover:bg-white/10 transition"
          >
            {AVAILABLE_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-zinc-900 text-white font-sans">
                {c.label}
              </option>
            ))}
          </select>
          {isUpdating && (
            <span className="text-[10px] text-zinc-500 font-mono ml-2 animate-pulse">
              Syncing DB...
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
            {user?.email ? user.email.slice(0, 1) : "C"}
          </div>
          <span className="text-sm font-medium text-zinc-200 hidden sm:inline">
            {user?.email || "cfo@finos.com"}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => signOut()}
          className="text-xs text-zinc-400 hover:text-red-400 border border-white/10 bg-transparent hover:bg-white/5"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}

export default Topbar;
