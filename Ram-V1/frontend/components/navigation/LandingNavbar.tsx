"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 bg-[#07090E]/90 backdrop-blur-md border-b ${scrolled ? "border-zinc-800 shadow-lg" : "border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-600" />
          <span className="font-mono tracking-[0.2em] font-bold text-white text-base">FINOS</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
          <a href="#product" className="hover:text-white transition">Product</a>
          <a href="#problem" className="hover:text-white transition">Solutions</a>
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#security" className="hover:text-white transition">Security</a>
          <a href="#vision" className="hover:text-white transition">Resources</a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition px-4 py-2">
            Log in
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition shadow-sm">
            Get Started
          </Link>
        </div>

        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#07090E] border-b border-zinc-800 px-6 py-6 space-y-4 font-medium text-sm">
          <a href="#product" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-white">Product</a>
          <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-white">Solutions</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-white">How It Works</a>
          <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-white">Security</a>
          <a href="#vision" onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-white">Resources</a>
          <div className="pt-4 border-t border-zinc-800 flex flex-col space-y-3">
            <Link href="/login" className="text-center py-2.5 text-zinc-300">Log in</Link>
            <Link href="/signup" className="text-center py-2.5 bg-blue-600 text-white rounded-lg">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
