"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/axios";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/invitation/accept", {
        token,
        full_name: fullName,
        password,
      });
      const data = res.data;
      if (data?.access_token) {
        localStorage.setItem("finos_auth_token", data.access_token);
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to accept invitation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-white/10 bg-zinc-950 text-white">
        <CardHeader className="space-y-1 text-center border-b border-white/10 pb-4">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mx-auto block w-fit">
            Workspace Invitation
          </span>
          <CardTitle className="text-2xl font-bold text-white mt-2">
            Join Enterprise Workspace
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Set up your credentials to access your organization&apos;s financial ledger
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleAccept} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800 font-mono">
                {error}
              </div>
            )}

            {!token && (
              <div className="p-3 text-xs text-amber-300 bg-amber-950/40 rounded-lg border border-amber-800">
                Warning: No invitation token detected in URL query parameter.
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e: any) => setFullName(e.target.value)}
              placeholder="Arthur Pendelton"
            />

            <Input
              label="Choose Password"
              type="password"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!token}
              isLoading={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 text-xs shadow-lg shadow-indigo-600/20"
            >
              Accept Invitation & Enter Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
