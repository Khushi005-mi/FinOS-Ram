"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function PeakCelestialLanding() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [cursorMode, setCursorMode] = useState<"sun" | "moon">("sun");
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const bubbles = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 7 + 2,
      baseAlpha: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -Math.random() * 0.9 - 0.3,
      repulsionRadius: 160,
      color: Math.random() > 0.5 ? "59, 130, 246" : "16, 185, 129",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;

        if (b.y < -20) b.y = height + 20;
        if (b.x < 0) b.x = width;
        if (b.x > width) b.x = 0;

        const dx = b.x - mousePos.x;
        const dy = b.y - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.repulsionRadius) {
          const force = (1 - dist / b.repulsionRadius) * 7;
          b.x += (dx / dist) * force * 4.5;
          b.y += (dy / dist) * force * 4.5;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${b.color}, ${b.baseAlpha * 1.8})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${b.color}, 0.9)`;
        ctx.fill();
        ctx.closePath();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return (
    <div className="min-h-screen bg-[#010308] text-zinc-100 flex flex-col justify-between relative overflow-hidden cursor-none selection:bg-blue-500 selection:text-white">
      {/* Floating Dense Quantum Bubbles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Custom Celestial Cursor (Sun / Moon Toggleable Orb) */}
      <div
        className={`fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out flex items-center justify-center ${
          isMouseDown ? "scale-75" : "scale-100"
        }`}
        style={{ left: mousePos.x, top: mousePos.y }}
      >
        <div
          className={`relative rounded-full transition-all duration-500 flex items-center justify-center ${
            cursorMode === "sun"
              ? "w-12 h-12 bg-amber-400 shadow-[0_0_35px_#fbbf24,0_0_70px_#f59e0b]"
              : "w-10 h-10 bg-slate-200 shadow-[0_0_30px_#e2e8f0,0_0_60px_#94a3b8]"
          }`}
        >
          {cursorMode === "moon" && (
            <div className="absolute w-7 h-7 rounded-full bg-slate-900 -top-1 -right-1 opacity-90" />
          )}
        </div>
      </div>

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between z-20 border-b border-white/10 backdrop-blur-xl sticky top-0 bg-[#010308]/70">
        <div className="flex items-center space-x-3">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-pulse" />
          <span className="font-mono tracking-widest font-bold text-sm text-zinc-100">
            FINOS // CELESTIAL OS
          </span>
        </div>

        <div className="flex items-center space-x-5">
          <button
            onClick={() => setCursorMode(cursorMode === "sun" ? "moon" : "sun")}
            className="px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-mono text-zinc-200 hover:bg-white/10 transition flex items-center space-x-1.5 bg-white/5"
          >
            <span>{cursorMode === "sun" ? "☀️ Sun Cursor" : "🌙 Moon Cursor"}</span>
          </button>
          <Link href="/login" className="text-xs font-medium text-zinc-300 hover:text-white transition">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition shadow-[0_0_25px_rgba(37,99,235,0.5)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-28 text-center z-10 flex flex-col items-center">
        <div
          className={`transition-all duration-1000 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono tracking-wider backdrop-blur-2xl mb-8 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <span>ENTERPRISE FINANCIAL OPERATING SYSTEM // V10</span>
          </span>
        </div>

        <h1
          className={`text-6xl md:text-9xl font-extrabold tracking-tight text-white mb-8 leading-[1.04] transition-all duration-1000 delay-200 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          Absolute Financial Truth. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Rendered in Quantum Glass.
          </span>
        </h1>

        <p
          className={`text-lg md:text-2xl text-zinc-300 max-w-3xl mb-14 font-normal leading-relaxed transition-all duration-1000 delay-400 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          Bank-secure multi-tenant infrastructure, cryptographic audit ledgers, and real-time exact-decimal GAAP reporting designed for world-class enterprises.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 w-full max-w-md transition-all duration-1000 delay-600 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-sm transition-all duration-300 shadow-[0_0_45px_rgba(37,99,235,0.6)] transform hover:scale-105"
          >
            Deploy Core Engine
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/15 font-bold text-sm transition-all duration-300 backdrop-blur-xl"
          >
            Tenant Gateway
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-36 w-full text-left z-10">
          <div className="p-8 rounded-3xl bg-zinc-950/90 border border-white/10 backdrop-blur-2xl hover:border-blue-500/60 transition duration-500 group shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl mb-6 group-hover:scale-110 transition">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Quantum Ingestion</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Magic-byte secure parsing with automated formula injection defenses and exact-decimal quantization streams.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-950/90 border border-white/10 backdrop-blur-2xl hover:border-emerald-500/60 transition duration-500 group shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mb-6 group-hover:scale-110 transition">
              🛡️
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cryptographic Lineage</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              SHA-256 audit ledgers tracking every single transaction back to its immutable genesis record in PostgreSQL.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-950/90 border border-white/10 backdrop-blur-2xl hover:border-indigo-500/60 transition duration-500 group shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl mb-6 group-hover:scale-110 transition">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Dynamic GAAP Reporting</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Instant multi-tenant Balance Sheets, Income Statements, and Cash Flows isolated via PostgreSQL Row-Level Security.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-8 py-10 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 z-20 backdrop-blur-md bg-[#010308]/40">
        <span>FinOS Core Engine. Designed for absolute financial dominance.</span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-300 font-semibold">All Datacenters Nominal</span>
        </div>
      </footer>
    </div>
  );
}