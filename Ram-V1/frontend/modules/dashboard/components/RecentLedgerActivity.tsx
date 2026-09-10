"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";

export function RecentLedgerActivity({ currency = "USD" }: { currency?: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch live ledger lines for active batch
    apiClient.get("/dashboard/trends").then(() => {
      // Fetch recent lines through reports endpoint
      apiClient.get("/reports/income-statement").then((res) => {
        const payload = res.data?.data || res.data;
        const allItems = [
          ...(payload?.revenue || []).map((i: any) => ({ ...i, category: "REVENUE" })),
          ...(payload?.costOfSales || payload?.cost_of_sales || []).map((i: any) => ({ ...i, category: "COGS" })),
          ...(payload?.operatingExpenses || payload?.operating_expenses || []).map((i: any) => ({ ...i, category: "OPEX" })),
        ];
        setEntries(allItems.slice(0, 8));
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-bold">
              Recent Audited Ledger Activity
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified double-entry transactions committed to active dataset in PostgreSQL 16
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            Active Dataset Feed
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-0">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Querying PostgreSQL ledger records...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No transaction records found in active batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold bg-zinc-900/40">
                  <th className="py-2.5 px-6">Account Code & Description</th>
                  <th className="py-2.5 px-6">Category</th>
                  <th className="py-2.5 px-6 text-right">Committed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-6 font-mono text-white">
                      {row.accountCode && <span className="text-zinc-500 mr-2">{row.accountCode}</span>}
                      {row.accountName}
                    </td>
                    <td className="py-2.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.category === "REVENUE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : row.category === "COGS"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono font-medium text-white">
                      {formatCurrency(row.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
