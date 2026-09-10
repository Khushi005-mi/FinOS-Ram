"use client";

import React, { useState, useEffect } from "react";

const FINANCIER_QUOTES = [
  {
    quote: "Risk comes from not knowing what you're doing.",
    author: "Warren Buffett",
    title: "Oracle of Omaha"
  },
  {
    quote: "The four most dangerous words in investing are: 'This time it's different'.",
    author: "Sir John Templeton",
    title: "Pioneer of Global Investing"
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    title: "Founding Father & Economist"
  },
  {
    quote: "In investing, what is comfortable is rarely profitable.",
    author: "Robert Arnott",
    title: "Chairman, Research Affiliates"
  },
  {
    quote: "Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it.",
    author: "Albert Einstein",
    title: "Theoretical Physicist"
  },
  {
    quote: "Truth is singular. Its versions are mistook for the ledger of reality.",
    author: "Stark Core Architecture",
    title: "FinOS Immutable Engine"
  }
];

export default function DailyQuotePanel() {
  const [currentQuote, setCurrentQuote] = useState(FINANCIER_QUOTES[0]);

  useEffect(() => {
    // Select quote based on day of the year so it changes daily automatically
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % FINANCIER_QUOTES.length;
    setCurrentQuote(FINANCIER_QUOTES[quoteIndex]);
  }, []);

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-r border-white/10 relative overflow-hidden h-full min-h-[600px]">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center space-x-3 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-pulse" />
        <span className="font-mono tracking-widest text-xs text-zinc-400 uppercase">FINOS // DAILY COGNITION</span>
      </div>

      <div className="my-auto z-10 max-w-md">
        <span className="text-6xl text-blue-500/40 font-serif block mb-[-20px]">“</span>
        <blockquote className="text-2xl font-light text-white tracking-tight leading-snug mb-6">
          {currentQuote.quote}
        </blockquote>
        <div>
          <p className="font-semibold text-sm text-zinc-200">{currentQuote.author}</p>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">{currentQuote.title}</p>
        </div>
      </div>

      <div className="z-10 font-mono text-[10px] text-zinc-600 flex justify-between items-center">
        <span>ENCRYPTION: SECURE_HASH_256</span>
        <span>DAILY_ROTATION: ACTIVE</span>
      </div>
    </div>
  );
}
