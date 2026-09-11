"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupInput } from "../schemas/authSchemas";
import { authApi } from "../api/authApi";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      currency: "USD",
    },
  });

  const onSubmitForm = async (formData: SignupInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await authApi.signup({
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        currency: formData.currency || "USD",
      });

      const token = response?.access_token || response?.data?.access_token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
        localStorage.setItem("token", token);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Signup submission error:", err);
      
      // Professional-grade error extraction (Strict Type Safety)
      let backendMessage = "Organization creation failed.";
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
        backendMessage = 
          errorObj.response?.data?.error?.message || 
          errorObj.response?.data?.message || 
          errorObj.message || 
          String(err);
      } else if (typeof err === "string") {
        backendMessage = err;
      }

      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-2">Set up your organization</h2>
      <p className="text-sm text-zinc-400 mb-6">Create your administrator profile and enterprise workspace</p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
          {typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">FULL NAME</label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            placeholder="e.g. Tony Stark"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">COMPANY / ENTITY NAME</label>
          <input
            type="text"
            {...register("companyName")}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            placeholder="e.g. Flabos"
          />
          {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">OPERATING CURRENCY</label>
          <select
            {...register("currency")}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
          >
            <option value="USD">USD ($) - US Dollar</option>
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="EUR">EUR (€) - Euro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">WORK EMAIL ADDRESS</label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            placeholder="cfo@company.com"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1">PASSWORD</label>
          <input
            type="password"
            {...register("password")}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-blue-500 outline-none"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition disabled:opacity-50"
        >
          {isSubmitting ? "Initializing Organization..." : "Create Enterprise Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-400 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
