"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedCurrency, formatFinancialValue, CURRENCY_SYMBOLS } from "@/lib/currency";

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (curr: SupportedCurrency) => void;
  format: (amountInBaseInr: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  setCurrency: () => {},
  format: (amt) => `₹${amt.toLocaleString("en-IN")}`,
  symbol: "₹",
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("INR");

  // Load persisted user currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem("finos_user_currency") as SupportedCurrency;
    if (savedCurrency && ["INR", "USD", "EUR", "GBP", "AED"].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("finos_user_currency", newCurrency);
  };

  const format = (amountInBaseInr: number) => {
    return formatFinancialValue(amountInBaseInr, currency);
  };

  const symbol = CURRENCY_SYMBOLS[currency] || "₹";

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default CurrencyProvider;
