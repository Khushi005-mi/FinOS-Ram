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

      // Call live backend API contract with exact Pydantic v2 payload mapping
      const response = await authApi.signup({
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        currency: formData.currency || "USD",
      });

      // Extract and cache access token securely
      const token = response?.access_token || response?.data?.access_token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
        localStorage.setItem("token", token);
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Signup submission error:", err);
      const backendMessage = err?.response?.data?.error?.message || err?.message || "Organization creation failed.";
      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Set up your organization</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Create your administrator profile and enterprise workspace</p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Tony Stark"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Company / Entity Name</label>
          <input
            type="text"
            {...register("companyName")}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Flabos"
          />
          {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Operating Currency</label>
          <select
            {...register("currency")}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="USD">USD ($) - US Dollar</option>
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="EUR">EUR (€) - Euro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Work Email Address</label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="cfo@company.com"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Initializing Organization..." : "Create Enterprise Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
