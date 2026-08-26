"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signupSchema, SignupInput } from "../schemas/authSchemas";
import { authApi } from "../api/authApi";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await authApi.signup(data);
      // Redirect to onboarding or login page after successful registration
      router.push("/login?registered=true");
    } catch (error: any) {
      setServerError(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200 my-8">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Create your FinOS Workspace
        </CardTitle>
        <p className="text-sm text-slate-500">
          Start automating financial intelligence for your manufacturing company
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

          {/* Full Name Field */}
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          {/* Company Name Field */}
          <Input
            label="Company / Manufacturing SME Name"
            type="text"
            placeholder="Apex Manufacturing Ltd."
            error={errors.companyName?.message}
            {...register("companyName")}
          />

          {/* Email Field */}
          <Input
            label="Work Email Address"
            type="email"
            placeholder="john@apexmanufacturing.com"
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

          {/* Confirm Password Field */}
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Create Workspace
          </Button>

          {/* Footer Link */}
          <div className="text-center text-sm text-slate-600 pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}