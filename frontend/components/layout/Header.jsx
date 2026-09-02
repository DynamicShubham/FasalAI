"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { useFarm } from "../../context/FarmContext";
import ThemeToggle from "../ui/ThemeToggle";

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const { farmData } = useFarm();
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="md:hidden w-full top-0 sticky bg-white/95 backdrop-blur-sm border-b border-stone-200 flex justify-between items-center h-14 px-4 z-50 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="FasalAI"
          className="w-8 h-8 rounded-lg object-contain"
        />
        <span className="font-display text-lg text-brand-900 font-extrabold tracking-tight">
          FasalAI
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/my-farm"
          className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-full text-xs text-content-muted border border-stone-200"
        >
          <span className="material-symbols-outlined text-[15px] text-brand-700">location_on</span>
          <span className="max-w-[70px] truncate">{farmData?.district || "My Farm"}</span>
        </Link>

        {/* Language Button */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-brand-900 border border-stone-200 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-dropdown border border-stone-200 py-1.5 z-50">
              <button
                onClick={() => { setLanguage("English"); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-stone-50 text-content"
              >
                English
              </button>
              <button
                onClick={() => { setLanguage("Hindi"); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-stone-50 text-content"
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => { setLanguage("Marathi"); setShowLangMenu(false); }}
                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-stone-50 text-content"
              >
                मराठी (Marathi)
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Alerts Notification Bell */}
        <Link
          href="/alerts"
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-content border border-stone-200 relative"
        >
          <span className="material-symbols-outlined text-[16px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
        </Link>
      </div>
    </header>
  );
}
