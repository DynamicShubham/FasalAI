"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { farmData } = useFarm();

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
            Settings & Farm Profile
          </h1>
          <p className="text-xs md:text-sm text-content-muted mt-0.5">
            Manage your language preferences and land details
          </p>
        </section>

        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center text-xl font-bold">
              👨‍🌾
            </div>
            <div>
              <h3 className="font-bold text-content text-base">{user?.name || "Ramesh Patil"}</h3>
              <p className="text-xs text-content-muted">{user?.phone || "+91 98765 43210"} · {farmData.district}, {farmData.state}</p>
              <p className="text-[11px] text-brand-800 font-medium mt-0.5">{farmData.acreage} Acres · {farmData.soilType}</p>
            </div>
          </div>

          <Link
            href="/farm-setup"
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-semibold text-brand-900 transition-colors"
          >
            Edit Farm
          </Link>
        </div>

        {/* Language Selection */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-3">
          <h3 className="font-bold text-content text-sm">Preferred Language</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {["English", "Hindi", "Marathi"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`p-3 rounded-xl flex items-center justify-between border transition-colors ${
                  language === l
                    ? "bg-brand-50 border-brand-900 text-brand-900 font-bold"
                    : "bg-white border-stone-200 text-content hover:bg-stone-50"
                }`}
              >
                <span className="text-xs">{l === "Hindi" ? "हिंदी (Hindi)" : l === "Marathi" ? "मराठी (Marathi)" : "English"}</span>
                {language === l && <span className="material-symbols-outlined text-brand-900 text-base">check</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Information */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-2.5 text-xs text-content-muted">
          <div className="flex justify-between py-1 border-b border-stone-100">
            <span>Product</span>
            <span className="font-medium text-content">FasalAI — Digital Farming Companion</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100">
            <span>Hackathon</span>
            <span className="font-medium text-brand-900">NEXORA 2026 · Team Genzcoderz (NXH036)</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Version</span>
            <span className="font-medium text-content">1.0 Production Ready</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
