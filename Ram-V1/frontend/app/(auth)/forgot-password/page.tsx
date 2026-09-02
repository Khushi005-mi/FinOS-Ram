"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStep("RESET");
      setMessage(`Authorization confirmed for ${email}. Set your new password below.`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not process request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/reset-password", {
        email,
        new_password: newPassword,
      });
      setMessage(res.data?.message || "Password updated successfully!");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-indigo-500">
      <div className="w-full max-w-md space-y-6 bg-zinc-950 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg mx-auto shadow-lg shadow-indigo-600/30">
            F
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Account Password</h2>
          <p className="text-xs text-zinc-400">
            {step === "REQUEST"
              ? "Enter your registered work email to verify identity."
              : "Enter your new password below."}
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {step === "REQUEST" ? (
          <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="cfo@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Verifying..." : "Verify & Continue →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetNewPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Updating..." : "Save New Password & Sign In →"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-500">
          Remember your credentials?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
