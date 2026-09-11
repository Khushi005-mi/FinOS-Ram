"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import LandingNavbar from "@/components/navigation/LandingNavbar";
import LandingFooter from "@/components/navigation/LandingFooter";

export default function FinOSVisualMasterpiece() {
  const [theme, setTheme] = useState<"night" | "day">("night");
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

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

    const bubbles = Array.from({ length: 85 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 14 + 4,
      baseAlpha: Math.random() * 0.35 + 0.1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.7 - 0.2,
      repulsionRadius: 180,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;

        if (b.y < -30) b.y = height + 30;
        if (b.x < 0) b.x = width;
        if (b.x > width) b.x = 0;

        const dx = b.x - mousePos.x;
        const dy = b.y - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.repulsionRadius) {
          const force = (1 - dist / b.repulsionRadius) * 8;
          b.x += (dx / dist) * force * 4;
          b.y += (dy / dist) * force * 4;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        
        if (theme === "night") {
          ctx.fillStyle = `rgba(255, 255, 255, ${b.baseAlpha})`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        } else {
          ctx.fillStyle = `rgba(0, 0, 0, ${b.baseAlpha * 0.8})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        }

        ctx.fill();
        ctx.closePath();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos, theme]);

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans transition-colors duration-700 relative overflow-hidden ${
      theme === "night" ? "bg-[#020408] text-zinc-100" : "bg-[#F8FAFC] text-zinc-900"
    }`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      <div
        className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out z-0 ${
          theme === "night" ? "bg-white/[0.04]" : "bg-black/[0.03]"
        }`}
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      <div className="z-20">
        <LandingNavbar />
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setTheme(theme === "night" ? "day" : "night")}
          className={`px-5 py-3 rounded-full backdrop-blur-2xl border font-mono text-xs font-semibold shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
            theme === "night" 
              ? "bg-zinc-900/80 border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)]" 
              : "bg-white/90 border-black/15 text-black shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
          }`}
        >
          <span>{theme === "night" ? "🌙 Night Mode Active" : "☀️ Day Mode Active"}</span>
        </button>
      </div>

      <section className="relative pt-24 pb-32 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-6 space-y-8">
          <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border font-mono text-xs tracking-wider uppercase backdrop-blur-md ${
            theme === "night" ? "bg-white/5 border-white/10 text-zinc-300" : "bg-black/5 border-black/10 text-zinc-700"
          }`}>
            <span>FINANCIAL INTELLIGENCE, BUILT FOR BUSINESS</span>
          </div>

          <h1 className={`text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] ${
            theme === "night" ? "text-white" : "text-zinc-950"
          }`}>
            Turn financial data into decisions.
          </h1>

          <p className={`text-lg font-normal leading-relaxed max-w-xl ${
            theme === "night" ? "text-zinc-400" : "text-zinc-600"
          }`}>
            FINOS brings your financial data together, turns it into a trusted view of your business, and helps you understand what is happening, why it matters, and where to look next.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm text-center transition shadow-lg shadow-blue-600/30"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className={`px-8 py-3.5 rounded-xl font-medium text-sm text-center transition border ${
                theme === "night" ? "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm"
              }`}
            >
              See How It Works
            </a>
          </div>

          <p className={`text-xs font-mono pt-2 ${theme === "night" ? "text-zinc-500" : "text-zinc-500"}`}>
            Built around a simple principle: financial decisions should start with trusted financial data.
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className={`rounded-3xl p-6 shadow-2xl border relative backdrop-blur-xl ${
            theme === "night" ? "bg-zinc-950/80 border-zinc-800" : "bg-white/90 border-zinc-200 shadow-xl"
          }`}>
            <div className={`absolute top-4 right-4 px-2.5 py-0.5 rounded border text-[10px] font-mono ${
              theme === "night" ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"
            }`}>
              Illustrative data
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase">Executive Overview</p>
                <h3 className={`text-lg font-semibold mt-1 ${theme === "night" ? "text-white" : "text-zinc-900"}`}>Q1 Financial Performance</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${theme === "night" ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <p className="text-xs text-zinc-400">Revenue</p>
                  <p className={`text-xl font-bold mt-1 font-mono ${theme === "night" ? "text-white" : "text-zinc-900"}`}>₹12.4M</p>
                  <span className="text-[10px] text-emerald-500 font-mono">↑ 5.7% vs prior</span>
                </div>
                <div className={`p-4 rounded-2xl border ${theme === "night" ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <p className="text-xs text-zinc-400">Gross Profit</p>
                  <p className={`text-xl font-bold mt-1 font-mono ${theme === "night" ? "text-white" : "text-zinc-900"}`}>₹7.8M</p>
                  <span className="text-[10px] text-emerald-500 font-mono">Margin 62.9%</span>
                </div>
                <div className={`p-4 rounded-2xl border ${theme === "night" ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                  <p className="text-xs text-zinc-400">Cash Position</p>
                  <p className={`text-xl font-bold mt-1 font-mono ${theme === "night" ? "text-white" : "text-zinc-900"}`}>₹18.6M</p>
                  <span className="text-[10px] text-blue-500 font-mono">Stable</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${theme === "night" ? "bg-blue-950/20 border-blue-900/30 text-zinc-300" : "bg-blue-50 border-blue-100 text-zinc-700"}`}>
                <p className="text-xs font-mono text-blue-500 uppercase tracking-wider">Key Financial Insight</p>
                <p className="text-sm">
                  "Operating expenses increased 8.4% this period, primarily driven by personnel and technology costs."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`border-y py-10 px-6 z-10 ${theme === "night" ? "border-zinc-800/80 bg-zinc-950/50" : "border-zinc-200 bg-white/50"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono text-xs">
          <div className="space-y-1">
            <p className={`font-bold text-sm ${theme === "night" ? "text-white" : "text-zinc-900"}`}>Trusted Data</p>
            <p className="text-zinc-500">Normalized inputs</p>
          </div>
          <div className="space-y-1">
            <p className={`font-bold text-sm ${theme === "night" ? "text-white" : "text-zinc-900"}`}>Deterministic Calculations</p>
            <p className="text-zinc-500">Exact-decimal math</p>
          </div>
          <div className="space-y-1">
            <p className={`font-bold text-sm ${theme === "night" ? "text-white" : "text-zinc-900"}`}>Clear Insights</p>
            <p className="text-zinc-500">Actionable context</p>
          </div>
          <div className="space-y-1">
            <p className={`font-bold text-sm ${theme === "night" ? "text-white" : "text-zinc-900"}`}>Auditability</p>
            <p className="text-zinc-500">SHA-256 lineage</p>
          </div>
        </div>
      </section>

      <section id="problem" className="py-28 px-6 max-w-7xl mx-auto w-full z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
            Your financial data is everywhere.<br />
            <span className="text-zinc-400">Your financial reality shouldn't be.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { title: "Fragmented data", desc: "Financial information often lives across multiple systems, files, and workflows." },
            { title: "Manual analysis", desc: "Teams spend valuable time collecting, cleaning, reconciling, and interpreting information." },
            { title: "Slow decisions", desc: "When financial context is scattered, understanding what is happening becomes harder and slower." }
          ].map((card, i) => (
            <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
              theme === "night" ? "bg-zinc-950/80 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme === "night" ? "text-white" : "text-zinc-900"}`}>{card.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center font-mono text-xs text-blue-500 font-semibold">
          FINOS is designed to bring the pieces together.
        </p>
      </section>

      <section id="product" className={`py-28 px-6 max-w-7xl mx-auto w-full border-t z-10 ${theme === "night" ? "border-zinc-800/80" : "border-zinc-200"}`}>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
            One place to understand your financial reality.
          </h2>
          <p className="text-zinc-500 text-base">
            FINOS organizes financial information into a clearer operating view of the business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            { title: "Financial Overview", desc: "See the financial metrics that matter most in one place." },
            { title: "Revenue & Cost Intelligence", desc: "Understand where revenue comes from, where costs are going, and how margins are changing." },
            { title: "Financial Insights", desc: "Surface meaningful changes and patterns across your financial data." },
            { title: "Financial Data Foundation", desc: "Structure financial information so calculations and analysis are based on a consistent underlying dataset." }
          ].map((card, i) => (
            <div key={i} className={`p-8 rounded-3xl border ${
              theme === "night" ? "bg-zinc-950/80 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme === "night" ? "text-white" : "text-zinc-900"}`}>{card.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="inline-block px-8 py-3.5 rounded-xl font-medium text-sm border transition bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800">
            Explore FinOS
          </Link>
        </div>
      </section>

      <section id="how-it-works" className={`py-28 px-6 max-w-7xl mx-auto w-full border-t z-10 ${theme === "night" ? "border-zinc-800/80" : "border-zinc-200"}`}>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
            From financial data to financial clarity.
          </h2>
          <p className="text-zinc-500 text-base">
            FINOS is designed around a simple flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "STEP 01", title: "Connect", desc: "Bring your financial information into FinOS through supported data sources and workflows." },
            { step: "STEP 02", title: "Structure", desc: "Organize and normalize financial information into a consistent representation." },
            { step: "STEP 03", title: "Understand", desc: "Calculate financial metrics and identify meaningful patterns across the business." },
            { step: "STEP 04", title: "Decide", desc: "Use clearer financial context to investigate issues and make better-informed decisions." }
          ].map((s, i) => (
            <div key={i} className={`p-6 rounded-2xl border space-y-2 ${
              theme === "night" ? "bg-zinc-950/80 border-zinc-800" : "bg-white border-zinc-200 shadow-lg"
            }`}>
              <span className="font-mono text-xs text-blue-500 font-bold">{s.step}</span>
              <h3 className={`text-base font-semibold ${theme === "night" ? "text-white" : "text-zinc-900"}`}>{s.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className={`py-28 px-6 max-w-7xl mx-auto w-full border-t z-10 ${theme === "night" ? "border-zinc-800/80" : "border-zinc-200"}`}>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
            Financial software should be built around trust.
          </h2>
          <p className="text-zinc-500 text-base">
            Security, access control, data integrity, and transparency are foundational to the product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            { title: "Access Control", desc: "Users should only access the financial information they are authorized to see." },
            { title: "Data Integrity", desc: "Financial calculations should be based on structured and validated data." },
            { title: "Transparency", desc: "Important financial outputs should be explainable and traceable to their underlying data." },
            { title: "Isolation", desc: "Business data should remain separated according to organizational boundaries." }
          ].map((card, i) => (
            <div key={i} className={`p-8 rounded-3xl border ${
              theme === "night" ? "bg-zinc-950/80 border-zinc-800" : "bg-white border-zinc-200 shadow-xl"
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme === "night" ? "text-white" : "text-zinc-900"}`}>{card.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`py-28 px-6 max-w-5xl mx-auto w-full text-center border-t z-10 ${theme === "night" ? "border-zinc-800/80" : "border-zinc-200"}`}>
        <div className={`p-12 rounded-3xl border space-y-6 shadow-2xl ${
          theme === "night" ? "bg-gradient-to-b from-blue-950/30 to-zinc-950 border-blue-950" : "bg-blue-50/50 border-blue-100"
        }`}>
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
            Start with a clearer view of your finances.
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto">
            Bring your financial data into one place and start understanding your business with greater clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/30">
              Get Started
            </Link>
            <Link href="/login" className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-sm transition border ${
              theme === "night" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800" : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm"
            }`}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      <div className="z-20">
        <LandingFooter />
      </div>
    </div>
  );
}
