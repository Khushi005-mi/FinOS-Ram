"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "../api/authApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-warm the dashboard bundle in background while user types credentials
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await authApi.login({ email: email.trim().toLowerCase(), password });
      // High-performance SPA navigation: Instant sub-50ms handoff
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-white/10 bg-zinc-950/90 text-white">
      <CardHeader className="text-center space-y-1 pb-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm mx-auto shadow-md shadow-indigo-600/30">
          F
        </div>
        <CardTitle className="text-xl font-bold text-white mt-2">
          Sign In to FinOS
        </CardTitle>
        <p className="text-xs text-zinc-400">
          Enter your financial credentials to access your workspace
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800 font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              WORK EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cfo@finos.com"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono text-zinc-400">PASSWORD</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 font-mono"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500 pt-4 border-t border-white/5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
