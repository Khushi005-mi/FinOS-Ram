"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/login", formData);
      if (res.data?.access_token) {
        localStorage.setItem("finos_auth_token", res.data.access_token);
        localStorage.setItem("finos_org_name", res.data.organization?.name || "My Workspace");
        localStorage.setItem("finos_user_email", res.data.user?.email || formData.email);
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({
      email: "cfo@apexmanufacturing.com",
      password: "admin123",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-indigo-500">
      <div className="w-full max-w-md space-y-6 bg-zinc-950 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg mx-auto shadow-lg shadow-indigo-600/30">
            F
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to FinOS</h2>
          <p className="text-xs text-zinc-400">Access your company's executive analytics command center.</p>
        </div>

        {/* Quick Demo Pill */}
        <div
          onClick={handleFillDemo}
          className="cursor-pointer p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between hover:bg-indigo-900/40 transition"
        >
          <div>
            <span className="font-bold">⚡️ Demo Account:</span> cfo@apexmanufacturing.com
          </div>
          <span className="text-[10px] font-mono bg-indigo-600 text-white px-2 py-0.5 rounded">
            Click to Auto-fill
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="cfo@yourcompany.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-300 font-semibold">Password</label>
              <Link href="/forgot-password" className="text-indigo-400 hover:underline text-[11px]">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace →"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Need a company workspace?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline font-semibold">
            Create Workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
