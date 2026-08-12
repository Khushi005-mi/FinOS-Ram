import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export const metadata = {
  title: "User Profile - FinOS",
  description: "User profile preferences and session credentials",
};

export default function ProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your personal account credentials and notification preferences.
        </p>
      </div>

      <Card className="apple-glass">
        <CardHeader>
          <CardTitle className="text-white text-base font-semibold">
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-zinc-300">
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-zinc-500 font-medium">Role</span>
            <span className="font-semibold text-indigo-400">Chief Financial Officer (CFO)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-zinc-500 font-medium">Email</span>
            <span className="font-mono text-white">cfo@apexmanufacturing.com</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-500 font-medium">Session Status</span>
            <span className="text-emerald-400 font-semibold">Active Verified Session</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}