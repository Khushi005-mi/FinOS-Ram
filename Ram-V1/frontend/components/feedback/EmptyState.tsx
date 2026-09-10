"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title = "No Financial Ledger Detected",
  description = "Upload your enterprise trial balance or general ledger CSV/Excel to initialize deterministic GAAP analytics.",
  actionLabel = "Upload Ledger Batch",
  actionHref = "/upload",
}: EmptyStateProps) {
  return (
    <Card className="w-full apple-glass border-white/10 text-center py-16 px-6">
      <CardContent className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto text-xl font-bold">
          📊
        </div>
        <div className="space-y-1">
          <h3 className="text-white text-base font-semibold">{title}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
        </div>
        <div className="pt-2">
          <Link href={actionHref}>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition">
              {actionLabel}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
