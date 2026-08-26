import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export const metadata = {
  title: "System Settings - FinOS",
  description: "API keys, security configuration, and integrations",
};

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Settings & API Keys
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage integration API keys, database connection pooling, and security options.
        </p>
      </div>

      <Card className="apple-glass">
        <CardHeader>
          <CardTitle className="text-white text-base font-semibold">
            API & Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-zinc-300">
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-zinc-500 font-medium">API Endpoint Gateway</span>
            <span className="font-mono text-indigo-400">https://finosv1-backend-api.onrender.com/api/v1</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-zinc-500 font-medium">Multi-Tenant Isolation</span>
            <span className="font-semibold text-emerald-400">Enforced (JWT Middleware)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-500 font-medium">Audit Logging</span>
            <span className="text-zinc-300">Enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}