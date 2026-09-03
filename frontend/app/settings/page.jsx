"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();
  const { user, farmerProfile, saveFarmerProfile, logout, isSupabaseConfigured, hasProfile } = useAuth();
  const { farmData, hasFarm } = useFarm();
  const [loggingOut, setLoggingOut] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const handleLanguageSelect = async (l) => {
    setLanguage(l);
    setFeedbackMsg(l === "Hindi" ? "भाषा बदलकर हिंदी कर दी गई!" : l === "Marathi" ? "भाषा बदलून मराठी केली!" : "Language updated to English!");
    setTimeout(() => setFeedbackMsg(""), 3000);

    // Persist language to Supabase profile if authenticated
    if (user?.id) {
      try {
        await saveFarmerProfile({ language: l });
      } catch (err) {
        console.warn("Could not save language to Supabase:", err);
      }
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  };

  const displayName = farmerProfile?.name || user?.name || "Farmer";
  const displayPhone = farmerProfile?.phone || user?.phone || user?.email || (t.accountActive || "Account Active");
  const displayDistrict = farmData?.district || farmerProfile?.district || user?.district || "";
  const displayState = farmData?.state || farmerProfile?.state || user?.state || "";

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
            {t.settingsTitle || "Settings & Farm Profile"}
          </h1>
          <p className="text-xs md:text-sm text-content-muted mt-0.5">
            {t.settingsDesc || "Manage your language preferences and registered land details"}
          </p>
        </section>

        {/* Temporary Feedback Notification */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn shadow-subtle">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center text-xl font-bold">
              👨‍🌾
            </div>
            <div>
              <h3 className="font-bold text-content text-base">{displayName}</h3>
              <p className="text-xs text-content-muted">
                {displayPhone} {displayDistrict ? `· ${displayDistrict}${displayState ? `, ${displayState}` : ""}` : ""}
              </p>
              {hasFarm ? (
                <p className="text-[11px] text-brand-800 font-medium mt-0.5">
                  {farmData.acreage} Acres · {farmData.soilType || "Configured"} · Standing {farmData.currentCrop}
                </p>
              ) : (
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  {t.farmNotConfigured || "Farm not configured yet"}
                </p>
              )}
            </div>
          </div>

          <Link
            href={hasProfile ? "/farm-setup" : "/onboarding"}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-semibold text-brand-900 transition-colors"
          >
            {hasFarm ? (t.editFarm || "Edit Farm") : (t.configureFarm || "Configure Farm")}
          </Link>
        </div>

        {/* Language Selection */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-3">
          <h3 className="font-bold text-content text-sm">{t.preferredLanguage || "Preferred Language"}</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {["English", "Hindi", "Marathi"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLanguageSelect(l)}
                className={`p-3 rounded-xl flex items-center justify-between border transition-colors cursor-pointer ${
                  language === l
                    ? "bg-brand-50 dark:bg-emerald-950/60 border-brand-900 dark:border-emerald-500 text-brand-900 dark:text-emerald-300 font-bold shadow-xs"
                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-content hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}
              >
                <span className="text-xs">{l === "Hindi" ? "हिंदी (Hindi)" : l === "Marathi" ? "मराठी (Marathi)" : "English"}</span>
                {language === l && <span className="material-symbols-outlined text-brand-900 dark:text-emerald-400 text-base">check</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance / Theme Selection */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-3">
          <h3 className="font-bold text-content text-sm">{t.appearance || "Appearance"}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-3 rounded-xl flex items-center justify-between border transition-colors cursor-pointer ${
                !isDark
                  ? "bg-brand-50 dark:bg-emerald-950/60 border-brand-900 dark:border-emerald-500 text-brand-900 dark:text-emerald-300 font-bold shadow-xs"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-content hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <span className="text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-amber-600">light_mode</span>
                {t.lightMode || "Light Mode"}
              </span>
              {!isDark && <span className="material-symbols-outlined text-brand-900 dark:text-emerald-400 text-base">check</span>}
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-3 rounded-xl flex items-center justify-between border transition-colors cursor-pointer ${
                isDark
                  ? "bg-brand-50 dark:bg-emerald-950/60 border-brand-800 dark:border-emerald-500 text-brand-900 dark:text-emerald-300 font-bold shadow-xs"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-content hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <span className="text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-amber-500">dark_mode</span>
                {t.darkMode || "Dark Mode"}
              </span>
              {isDark && <span className="material-symbols-outlined text-brand-900 dark:text-emerald-400 text-base">check</span>}
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <h4 className="font-bold text-content text-sm">{t.accountSession || "Account Session"}</h4>
            <p className="text-xs text-content-muted mt-0.5">
              {user?.email ? `Signed in as ${user.email}` : isSupabaseConfigured ? "Connected to Supabase Auth" : "Guest Mode"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>{loggingOut ? "Signing Out..." : (t.signOut || "Sign Out")}</span>
          </button>
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
            <span className="font-medium text-content">1.0 Production (Supabase Connected)</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
