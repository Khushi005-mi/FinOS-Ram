"use client";

import React, { useState } from "react";
import { useCurrency } from "@/providers/CurrencyProvider";
import { SupportedCurrency, CURRENCY_SYMBOLS } from "@/lib/currency";

const CURRENCIES: { code: SupportedCurrency; label: string }[] = [
  { code: "INR", label: "₹ INR (Indian Rupee)" },
  { code: "USD", label: "$ USD (US Dollar)" },
  { code: "EUR", label: "€ EUR (Euro)" },
  { code: "GBP", label: "£ GBP (British Pound)" },
  { code: "AED", label: "AED (UAE Dirham)" },
];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-200 transition shadow-sm font-mono"
      >
        <span className="text-indigo-400 font-bold">{CURRENCY_SYMBOLS[currency]}</span>
        <span>{currency}</span>
        <span className="text-[9px] text-zinc-500">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl p-1.5 z-50 space-y-0.5">
            <p className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Display Currency
            </p>
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between font-mono transition ${
                  currency === c.code
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                <span>{c.label}</span>
                {currency === c.code && <span>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CurrencySwitcher;
