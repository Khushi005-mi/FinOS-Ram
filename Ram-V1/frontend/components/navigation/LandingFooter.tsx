"use client";
import React from "react";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#04060A] border-t border-zinc-800/80 text-zinc-400 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            <span className="font-mono tracking-[0.2em] font-bold text-white text-base">FINOS</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">Financial intelligence for modern businesses. Bringing clarity and precision to your financial reality.</p>
          <p className="text-xs font-mono text-zinc-600">© 2026 FinOS. All rights reserved.</p>
        </div>
        <div>
          <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Product</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#product" className="hover:text-white transition">Overview</a></li>
            <li><a href="#product" className="hover:text-white transition">Financial Intelligence</a></li>
            <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
            <li><a href="#security" className="hover:text-white transition">Security</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Solutions</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/signup" className="hover:text-white transition">Finance Teams</Link></li>
            <li><Link href="/signup" className="hover:text-white transition">Business Leaders</Link></li>
            <li><Link href="/signup" className="hover:text-white transition">Founders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-xs text-zinc-300 uppercase tracking-wider mb-4">Resources</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#how-it-works" className="hover:text-white transition">Documentation</a></li>
            <li><a href="#problem" className="hover:text-white transition">Blog</a></li>
            <li><a href="#security" className="hover:text-white transition">Help Center</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
