"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 md:p-8 max-w-6xl mx-auto">
      {/* Top Navbar */}
      <header className="flex justify-between items-center py-3 px-2 border-b border-stone-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            🌱
          </div>
          <div>
            <span className="font-display text-xl font-bold text-brand-900 tracking-tight">
              FasalAI
            </span>
            <span className="hidden sm:inline-block text-xs text-content-muted ml-2 pl-2 border-l border-stone-300">
              Digital Farming Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white text-content text-xs md:text-sm rounded-lg px-3 py-1.5 border border-stone-200 shadow-subtle outline-none cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>

          <Link
            href="/login"
            className="px-4 py-1.5 text-xs md:text-sm font-semibold text-brand-900 hover:text-brand-950 transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col lg:flex-row items-center justify-between gap-10 my-10 md:my-14">
        <div className="flex flex-col gap-5 max-w-xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-center lg:self-start px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-900 text-xs font-semibold border border-brand-100">
            <span className="material-symbols-outlined text-[15px] text-brand-700">spa</span>
            PR·FUSION · Personalized Farming Support
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content leading-[1.2] tracking-tight">
            Clear, actionable farming decisions for <span className="text-brand-900">your land.</span>
          </h1>

          <p className="text-content-muted text-sm sm:text-base leading-relaxed font-normal">
            FasalAI turns soil characteristics, weather forecasts, leaf disease diagnostics, and local mandi prices into simple daily recommendations you can trust.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Get Started / Sign In
            </Link>

            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-50 text-content font-semibold text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Register Your Farm
            </Link>
          </div>

          {/* Practical Value Points */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200 text-center lg:text-left">
            <div>
              <p className="text-xl font-bold text-brand-900">30+ Diseases</p>
              <p className="text-xs text-content-muted">Instant leaf diagnosis</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand-900">Live Mandis</p>
              <p className="text-xs text-content-muted">Net profit comparison</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand-900">Daily Checklist</p>
              <p className="text-xs text-content-muted">Stage-wise farm plan</p>
            </div>
          </div>
        </div>

        {/* Clean Farm Status Card Preview */}
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center text-xl">
                🌾
              </div>
              <div>
                <h3 className="font-bold text-content text-sm">Farm Decision Preview</h3>
                <p className="text-xs text-content-muted">Real-time Soil, Weather & Market Synthesis</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full">
              Healthy
            </span>
          </div>

          {/* Status Note */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content mb-1">
              <span className="material-symbols-outlined text-brand-800 text-[16px]">checklist</span>
              Today's Key Priority
            </div>
            <p className="text-xs text-content-muted leading-relaxed">
              Light morning watering scheduled for Crown Root stage. Postpone foliar spraying due to Saturday's rainfall forecast.
            </p>
          </div>

          {/* Quick Tools */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/scanner"
              className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-brand-800 text-xl">photo_camera</span>
              <div>
                <p className="text-xs font-semibold text-content">Plant Doctor</p>
                <p className="text-[10px] text-content-muted">Scan crop leaf</p>
              </div>
            </Link>

            <Link
              href="/market"
              className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-brand-800 text-xl">storefront</span>
              <div>
                <p className="text-xs font-semibold text-content">Mandi Rates</p>
                <p className="text-[10px] text-content-muted">Pimpalgaon (+₹130/q)</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-stone-200 text-center text-xs text-content-muted flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 FasalAI · Team Genzcoderz (NXH036) · NEXORA Innovation Hackathon</p>
        <p className="text-brand-900 font-medium">Simple, reliable farming support for Indian farmers</p>
      </footer>
    </div>
  );
}
