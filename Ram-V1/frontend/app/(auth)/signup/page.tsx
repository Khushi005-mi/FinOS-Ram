import React from "react";
import { SignupForm } from "@/modules/authentication/components/SignupForm";

export const metadata = {
  title: "Create Workspace - FinOS",
  description: "Create a new FinOS account for your organization",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <SignupForm />
    </div>
  );
}