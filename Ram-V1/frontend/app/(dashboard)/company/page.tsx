import React from "react";
import { CompanyProfileForm } from "@/modules/company/components/CompanyProfileForm";

export const metadata = {
  title: "Company Profile - FinOS",
  description: "Organization profile and country currency localization settings",
};

export default function CompanyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Company Settings & Localization
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure country standards, base currency, and industry unit economics.
        </p>
      </div>

      <CompanyProfileForm />
    </div>
  );
}