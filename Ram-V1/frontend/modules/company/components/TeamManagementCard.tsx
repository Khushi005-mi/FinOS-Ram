"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";

export function TeamManagementCard() {
  const [members, setMembers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ANALYST");
  const [generatedInvite, setGeneratedInvite] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = async () => {
    try {
      const res = await apiClient.get("/organization/team");
      const data = res.data?.data || res.data;
      setMembers(data?.members || []);
      setPending(data?.pendingInvitations || []);
    } catch {
      // Ignore initial load error if not admin
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedInvite(null);

    try {
      const res = await apiClient.post("/organization/invitations", { email, role });
      const data = res.data?.data || res.data;
      setGeneratedInvite(data);
      setEmail("");
      loadTeam();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to send invitation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="apple-glass border-white/10">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-bold">
              Workspace Team & Role Directory
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage enterprise member access, assign roles, and issue invitation tokens
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            RBAC Enabled
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Invite New Colleague
          </h3>

          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/40 rounded-lg border border-rose-800">
              {typeof error === "string" ? error : (error?.message || JSON.stringify(error))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-zinc-400 block mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="controller@company.com"
                className="w-full text-xs font-mono bg-zinc-900 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs font-mono bg-zinc-900 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                <option value="ANALYST">ANALYST</option>
                <option value="AUDITOR">AUDITOR</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="text-xs">
            Generate Secure Invitation Token
          </Button>
        </form>

        {/* Display Generated Invitation Link */}
        {generatedInvite && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">✓ Invitation Created Successfully</span>
              <span className="text-[10px] font-mono text-zinc-400">(Expires in 48 hours)</span>
            </div>
            <p className="text-xs text-zinc-300">
              Share this secure single-use registration link with <strong className="text-white">{generatedInvite.email}</strong>:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInvite.inviteUrl}
                className="w-full text-xs font-mono bg-black/60 text-emerald-300 border border-emerald-800/40 rounded px-2.5 py-1.5 selection:bg-emerald-500 selection:text-black"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(generatedInvite.inviteUrl)}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-black rounded transition shrink-0"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Active Workspace Roster ({members.length} Members)
          </h3>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-4">Member Name & Email</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5">
                    <td className="py-2.5 px-4 text-white">
                      <span className="font-semibold block">{m.fullName}</span>
                      <span className="text-zinc-500 text-[11px]">{m.email}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.role === "ADMIN" 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : m.role === "FINANCE_MANAGER"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-emerald-400 font-semibold">{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
