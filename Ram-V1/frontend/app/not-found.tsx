import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl border border-white/10 shadow-2xl text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-indigo-400">404</h1>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Page Not Found</h2>
          <p className="text-xs text-zinc-400">
            The financial dashboard page you are looking for does not exist.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-block w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
