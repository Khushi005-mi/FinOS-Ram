"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";
import { CurrencySwitcher } from "./CurrencySwitcher";

export function Topbar() {
  const router = useRouter();
  const [orgName, setOrgName] = useState<string>("Apex Manufacturing Ltd.");
  const [userEmail, setUserEmail] = useState<string>("cfo@apexmanufacturing.com");
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useEffect(() => {
    const cachedOrg = localStorage.getItem("finos_org_name");
    const cachedEmail = localStorage.getItem("finos_user_email");
    if (cachedOrg) setOrgName(cachedOrg);
    if (cachedEmail) setUserEmail(cachedEmail);

    async function fetchSession() {
      try {
        const res = await apiClient.get("/auth/me");
        if (res.data?.organization?.name) {
          setOrgName(res.data.organization.name);
          localStorage.setItem("finos_org_name", res.data.organization.name);
        }
        if (res.data?.user?.email) {
          setUserEmail(res.data.user.email);
          localStorage.setItem("finos_user_email", res.data.user.email);
        }
      } catch (err) {
        if (!cachedOrg) setOrgName("Apex Manufacturing Ltd.");
        if (!cachedEmail) setUserEmail("cfo@apexmanufacturing.com");
      }
    }
    fetchSession();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("finos_auth_token");
    localStorage.removeItem("finos_org_name");
    localStorage.removeItem("finos_user_email");
    router.push("/login");
  };

  const initial = (orgName[0] || "F").toUpperCase();

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-30">
      {/* Left: Active Organization Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-white shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate max-w-[200px]">{orgName}</span>
        </div>
        <span className="hidden sm:inline-block text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
          Active Workspace
        </span>
      </div>

      {/* Right: Currency Switcher & User Profile Menu */}
      <div className="flex items-center space-x-4">
        {/* Global Multi-Currency Switcher */}
        <CurrencySwitcher />

        <div className="relative flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-600/30">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-white block leading-tight">{orgName}</span>
              <span className="text-[10px] text-zinc-400 font-mono block truncate max-w-[180px]">{userEmail}</span>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-12 w-52 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs font-bold text-white truncate">{orgName}</p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">{userEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    router.push("/upload");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 transition"
                >
                  + Ingest Dataset
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
