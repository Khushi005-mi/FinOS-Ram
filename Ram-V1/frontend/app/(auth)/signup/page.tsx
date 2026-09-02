"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: "",
    full_name: "",
    email: "",
    password: "",
    industry_type: "MANUFACTURING",
    currency: "INR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/auth/signup", formData);
      if (res.data?.access_token) {
        localStorage.setItem("finos_auth_token", res.data.access_token);
        localStorage.setItem("finos_org_name", res.data.organization?.name || formData.company_name);
        localStorage.setItem("finos_user_email", res.data.user?.email || formData.email);
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err?.response?.data?.detail || err?.message || "Failed to create company workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-indigo-500">
      <div className="w-full max-w-md space-y-8 bg-zinc-950 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg mx-auto shadow-lg shadow-indigo-600/30">
            F
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Company Workspace</h2>
          <p className="text-xs text-zinc-400">Set up your company's executive financial operating system.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Company / Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Nova Robotics Ltd."
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Industry</label>
              <select
                value={formData.industry_type}
                onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="SAAS_ENTERPRISE">SaaS / Software</option>
                <option value="ECOMMERCE_RETAIL">D2C / E-Commerce</option>
                <option value="SERVICES_AGENCY">Agency / Services</option>
                <option value="GENERAL_SMB">General Business</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Your Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Connor"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="cfo@novarobotics.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Password</label>
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
            {loading ? "Creating Workspace..." : "Create Company Workspace →"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Already have a company account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
