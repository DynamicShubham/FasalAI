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
    <header className="md:hidden w-full top-0 sticky bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 flex justify-between items-center h-14 px-3 z-50 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <Link href="/dashboard" className="flex items-center gap-1.5 flex-shrink-0">
        <img
          src="/logo.png"
          alt="FasalAI"
          className="w-7 h-7 rounded-lg object-contain"
        />
        <span className="font-display text-base text-brand-900 dark:text-emerald-400 font-extrabold tracking-tight">
          FasalAI
        </span>
      </Link>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link
          href="/my-farm"
          className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-full text-[11px] text-content-muted border border-stone-200 dark:border-stone-700 max-w-[80px]"
        >
          <span className="material-symbols-outlined text-[14px] text-brand-700 dark:text-emerald-400">location_on</span>
          <span className="truncate">{farmData?.district || "My Farm"}</span>
        </Link>

        {/* Language Button */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-brand-900 dark:text-emerald-400 border border-stone-200 dark:border-stone-700 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
          </button>

          {showLangMenu && (
            <>
              {/* Backdrop to close menu on tap */}
              <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-stone-900 rounded-xl shadow-dropdown border border-stone-200 dark:border-stone-700 py-1.5 z-50">
                <button
                  onClick={() => { setLanguage("English"); setShowLangMenu(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800 text-content touch-target-auto"
                >
                  English
                </button>
                <button
                  onClick={() => { setLanguage("Hindi"); setShowLangMenu(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800 text-content touch-target-auto"
                >
                  हिंदी (Hindi)
                </button>
                <button
                  onClick={() => { setLanguage("Marathi"); setShowLangMenu(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800 text-content touch-target-auto"
                >
                  मराठी (Marathi)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Alerts Notification Bell */}
        <Link
          href="/alerts"
          className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-content border border-stone-200 dark:border-stone-700 relative"
        >
          <span className="material-symbols-outlined text-[16px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
        </Link>
      </div>
    </header>
  );
}
