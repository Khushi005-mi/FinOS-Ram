import React from "react";
import { LoginForm } from "@/modules/authentication/components/LoginForm";

export const metadata = {
  title: "Sign In - FinOS",
  description: "Sign in to your FinOS account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <LoginForm />
    </div>
  );
}