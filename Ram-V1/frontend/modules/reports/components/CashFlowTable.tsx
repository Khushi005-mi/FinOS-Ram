"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface CashFlowTableProps {
  data?: any;
}

export function CashFlowTable({ data }: CashFlowTableProps) {
  if (!data) {
    return (
      <Card className="apple-glass">
        <CardHeader>
          <CardTitle className="text-white text-lg font-semibold">
            Statement of Cash Flows (Indirect Method)
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Operating, Investing, and Financing cash flows derived from active ledger activity.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-500 py-6 text-center">
            No cash flow records available for the active period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="apple-glass">
      <CardHeader>
        <CardTitle className="text-white text-lg font-semibold">
          Statement of Cash Flows (Indirect Method)
        </CardTitle>
        <p className="text-xs text-zinc-400">
          Operating, Investing, and Financing cash flows derived from active ledger activity.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono">
              <tr>
                <th className="py-2.5 px-4">Line Item</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
              {Array.isArray(data?.items) && data.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-2.5 px-4">{item.name || item.label}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-white">
                    {item.formatted || item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CashFlowTable;
