import React from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export const metadata = {
  title: "Reset Password - FinOS",
  description: "Reset your FinOS account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <Card className="w-full max-w-md apple-glass">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <p className="text-xs text-zinc-400">
            Enter your work email address to receive password reset instructions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Work Email Address" type="email" placeholder="cfo@company.com" />
          <Button variant="primary" className="w-full">
            Send Reset Instructions
          </Button>
          <div className="text-center text-xs text-zinc-400 pt-2">
            Remember your password?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}