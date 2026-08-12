"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface BalanceSheetTableProps {
  currency?: string;
}

export function BalanceSheetTable({ currency = "INR" }: BalanceSheetTableProps) {
  const assets = [
    { code: "1010", name: "Operating Cash & Bank Balance", amount: 2450000 },
    { code: "1200", name: "Accounts Receivable (Trade)", amount: 1800000 },
    { code: "1400", name: "Raw Material & Finished Goods Inventory", amount: 3200000 },
    { code: "1700", name: "Plant Machinery & Equipment (Net)", amount: 6500000 },
  ];

  const liabilities = [
    { code: "2010", name: "Accounts Payable (Suppliers)", amount: 1400000 },
    { code: "2200", name: "Short-Term Working Capital Loan", amount: 1100000 },
    { code: "2500", name: "Long-Term Equipment Financing", amount: 2800000 },
  ];

  const equity = [
    { code: "3010", name: "Paid-in Founder Equity", amount: 5000000 },
    { code: "3300", name: "Retained Earnings", amount: 3650000 },
  ];

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const totalEquity = equity.reduce((s, e) => s + e.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const renderAmount = (amount: number) => formatCurrency(amount, currency);

  return (
    <Card className="w-full apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-white text-lg font-bold">
          Statement of Financial Position (Balance Sheet)
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-0.5">
          Assets = Liabilities + Owner Equity Verification ({currency})
        </p>
      </CardHeader>

      <CardContent className="pt-4 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/80 text-zinc-400 font-semibold text-[11px]">
                <th className="py-2.5 px-6">Account Code & Description</th>
                <th className="py-2.5 px-6 text-right">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {/* ASSETS SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>Total Assets</td>
              </tr>
              {assets.map((item) => (
                <tr key={item.code} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    <span className="text-zinc-500 mr-2">{item.code}</span>
                    {item.name}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-950/40 font-bold text-emerald-200 border-y border-emerald-500/30">
                <td className="py-3 px-6 text-sm">TOTAL ASSETS</td>
                <td className="py-3 px-6 text-right font-mono text-sm text-emerald-400">
                  {renderAmount(totalAssets)}
                </td>
              </tr>

              {/* LIABILITIES SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>Total Liabilities</td>
              </tr>
              {liabilities.map((item) => (
                <tr key={item.code} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    <span className="text-zinc-500 mr-2">{item.code}</span>
                    {item.name}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(item.amount)}
                  </td>
                </tr>
              ))}

              {/* EQUITY SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>Stockholder Equity</td>
              </tr>
              {equity.map((item) => (
                <tr key={item.code} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                    <span className="text-zinc-500 mr-2">{item.code}</span>
                    {item.name}
                  </td>
                  <td className="py-2 px-6 text-right font-mono font-medium text-white">
                    {renderAmount(item.amount)}
                  </td>
                </tr>
              ))}

              {/* TOTAL LIABILITIES & EQUITY */}
              <tr className="bg-zinc-900 font-extrabold text-white text-sm border-t-2 border-white/20">
                <td className="py-3.5 px-6">TOTAL LIABILITIES & EQUITY</td>
                <td className="py-3.5 px-6 text-right font-mono text-emerald-400">
                  {renderAmount(totalLiabilitiesAndEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}