"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import apiClient from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(API_ROUTES.AUTH.PASSWORD_CHANGE, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setMessage({ type: "success", text: response.data.message || "Password successfully changed. Active sessions rotated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User Profile & Security
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your personal account credentials, session security, and password rotation.
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
            <span className="font-semibold text-indigo-400">Enterprise Administrator / CFO</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-zinc-500 font-medium">Session Security</span>
            <span className="font-semibold text-emerald-400">HttpOnly Secure Cookie Enabled</span>
          </div>
        </CardContent>
      </Card>

      <Card className="apple-glass">
        <CardHeader>
          <CardTitle className="text-white text-base font-semibold">
            Credential Rotation & Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {message && (
              <div
                className={`p-3 text-xs rounded-lg ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                New Password (Min 8 Characters)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? "Rotating Credentials..." : "Update Password & Invalidate Sessions"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
