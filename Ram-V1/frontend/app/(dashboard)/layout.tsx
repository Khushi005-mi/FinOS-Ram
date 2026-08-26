import React, { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-black text-zinc-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}