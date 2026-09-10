"use client";

import React, { useState, useEffect } from "react";

export interface TelemetryLog {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  status: "INFO" | "SUCCESS" | "WARN" | "ERROR";
}

interface StarkTelemetryHUDProps {
  logs: TelemetryLog[];
  isProcessing: boolean;
  title?: string;
}

export default function StarkTelemetryHUD({
  logs,
  isProcessing,
  title = "STARK_CORE // LIVE_TELEMETRY_FEED"
}: StarkTelemetryHUDProps) {
  return (
    <div className="glass-panel rounded-xl border border-blue-500/30 overflow-hidden flex flex-col h-full shadow-2xl font-mono text-xs">
      {/* HUD Header */}
      <div className="bg-black/60 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={} />
          <span className="font-bold tracking-wider text-blue-400">{title}</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
          <span>SECURE_SOCKET: 0x99A</span>
          <span className="text-emerald-400">{isProcessing ? "STREAMING..." : "IDLE_STANDBY"}</span>
        </div>
      </div>

      {/* Telemetry Stream Body */}
      <div className="p-4 flex-1 bg-black/40 overflow-y-auto space-y-2.5 max-h-[320px] min-h-[220px]">
        {logs.length === 0 ? (
          <div className="text-zinc-600 text-center py-12 italic">
            // Waiting for operational telemetry stream... Upload a batch or run a report to engage core.
          </div>
        ) : (
          logs.map((log) => {
            const statusColor = 
              log.status === "SUCCESS" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
              log.status === "WARN" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
              log.status === "ERROR" ? "text-red-400 bg-red-500/10 border-red-500/20" :
              "text-blue-400 bg-blue-500/10 border-blue-500/20";

            return (
              <div key={log.id} className="flex items-start space-x-3 p-2 rounded bg-white/[0.02] border border-white/5 animate-fadeIn">
                <span className="text-zinc-500 text-[10px] pt-0.5">[{log.timestamp}]</span>
                <span className={}>
                  {log.module}
                </span>
                <span className="text-zinc-300 flex-1 leading-relaxed">{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* HUD Footer Status */}
      <div className="bg-black/60 px-4 py-2 border-t border-white/10 flex justify-between items-center text-[10px] text-zinc-500">
        <span>ENCRYPTION: AES-256-GCM</span>
        <span className="text-blue-400 font-semibold">FINOS ENTERPRISE ENGINE v10</span>
      </div>
    </div>
  );
}
