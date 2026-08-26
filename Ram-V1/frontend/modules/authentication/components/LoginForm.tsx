"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { loginSchema, LoginInput } from "../schemas/authSchemas";
import { authApi } from "../api/authApi";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await authApi.login(data);
      // Redirect to dashboard on successful login
      router.push("/dashboard");
    } catch (error: any) {
      setServerError(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Sign in to FinOS
        </CardTitle>
        <p className="text-sm text-slate-500">
          Enter your financial credentials to access your organization dashboard
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {serverError}
            </div>
          )}

          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            placeholder="cfo@manufacturing.com"
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>

          {/* Footer Link */}
          <div className="text-center text-sm text-slate-600 pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}