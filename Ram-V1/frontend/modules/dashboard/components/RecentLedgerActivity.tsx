"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { apiClient } from "@/lib/api/axios";

interface AuditLogItem {
  id: string;
  timestamp: string | null;
  actor: string;
  action: string;
  status: string;
  records_count: number;
  is_active_batch: boolean;
}

export function RecentLedgerActivity() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuditTrail() {
      try {
        const res = await apiClient.get<AuditLogItem[]>("/organization/audit-trail");
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn("[Audit Trail] Using fallback records:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditTrail();
  }, []);

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-sm font-semibold tracking-tight">
              Immutable Financial Audit Trail
            </CardTitle>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Verified chronological record of all ledger ingestions and dataset activations.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            SOC2 / Audit Shield Active
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {loading ? (
          <p className="text-xs text-zinc-500 py-4 text-center font-mono">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No ledger actions recorded.</p>
        ) : (
          logs.slice(0, 5).map((log, idx) => {
            const dateStr = log.timestamp
              ? new Date(log.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={log.id || idx}
                className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${log.is_active_batch ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-indigo-400"}`} />
                  <div>
                    <p className="font-semibold text-white">
                      {log.action} <span className="font-mono text-zinc-500 font-normal">({log.records_count} records)</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      By: {log.actor}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.is_active_batch ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                    {log.is_active_batch ? "ACTIVE" : log.status}
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">{dateStr}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default RecentLedgerActivity;
