"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

interface BalanceSheetTableProps {
  data: any;
  currency?: string;
}

export function BalanceSheetTable({ data, currency = "INR" }: BalanceSheetTableProps) {
  const currencyCode = data?.currency || currency;
  
  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || [];

  const totalAssets = data?.totalAssets ?? data?.total_assets ?? assets.reduce((s: number, a: any) => s + (a.amount || 0), 0);
  const totalLiabilities = data?.totalLiabilities ?? data?.total_liabilities ?? liabilities.reduce((s: number, l: any) => s + (l.amount || 0), 0);
  const totalEquity = data?.totalEquity ?? data?.total_equity ?? equity.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalLiabilitiesAndEquity = data?.totalLiabilitiesAndEquity ?? data?.total_liabilities_and_equity ?? (totalLiabilities + totalEquity);

  const renderAmount = (amount: number) => formatCurrency(amount, currencyCode);

  return (
    <Card className="w-full apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-white text-lg font-bold">
          Statement of Financial Position (Balance Sheet)
        </CardTitle>
        <p className="text-xs text-zinc-400 mt-0.5">
          Assets = Liabilities + Owner Equity Verification ({currencyCode})
        </p>
      </CardHeader>

      <CardContent className="pt-4 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/80 text-zinc-400 font-semibold text-[11px]">
                <th className="py-2.5 px-6">Account Code & Description</th>
                <th className="py-2.5 px-6 text-right">Amount ({currencyCode})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {/* ASSETS SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>Total Assets</td>
              </tr>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 px-6 text-zinc-500 italic text-center">No asset records found in active dataset.</td>
                </tr>
              ) : (
                assets.map((item: any, idx: number) => (
                  <tr key={item.accountCode || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                      <span className="text-zinc-500 mr-2">{item.accountCode || item.code}</span>
                      {item.accountName || item.name}
                    </td>
                    <td className="py-2 px-6 text-right font-mono font-medium text-white">
                      {renderAmount(item.amount)}
                    </td>
                  </tr>
                ))
              )}
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
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 px-6 text-zinc-500 italic text-center">No liability records found.</td>
                </tr>
              ) : (
                liabilities.map((item: any, idx: number) => (
                  <tr key={item.accountCode || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                      <span className="text-zinc-500 mr-2">{item.accountCode || item.code}</span>
                      {item.accountName || item.name}
                    </td>
                    <td className="py-2 px-6 text-right font-mono font-medium text-white">
                      {renderAmount(item.amount)}
                    </td>
                  </tr>
                ))
              )}

              {/* EQUITY SECTION */}
              <tr className="bg-zinc-900/60 font-semibold text-white">
                <td className="py-2.5 px-6" colSpan={2}>Stockholder Equity</td>
              </tr>
              {equity.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 px-6 text-zinc-500 italic text-center">No equity records found.</td>
                </tr>
              ) : (
                equity.map((item: any, idx: number) => (
                  <tr key={item.accountCode || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-6 text-zinc-300 pl-10 font-mono">
                      <span className="text-zinc-500 mr-2">{item.accountCode || item.code}</span>
                      {item.accountName || item.name}
                    </td>
                    <td className="py-2 px-6 text-right font-mono font-medium text-white">
                      {renderAmount(item.amount)}
                    </td>
                  </tr>
                ))
              )}

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
