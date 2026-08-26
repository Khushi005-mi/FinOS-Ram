import React from "react";

export function Footer() {
  return (
    <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      FinOS Operating System &copy; {new Date().getFullYear()} • Automated Financial Intelligence
    </footer>
  );
}