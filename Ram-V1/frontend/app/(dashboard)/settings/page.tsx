"use client";

import React from "react";
import { TeamManagementCard } from "@/modules/company/components/TeamManagementCard";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Workspace Settings & Administration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage team member invitations, role-based access control, and workspace security
        </p>
      </div>

      <TeamManagementCard />
    </div>
  );
}
