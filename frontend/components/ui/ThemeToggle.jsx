"use client";

import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ variant = "icon", className = "" }) {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-full bg-stone-100 ${className}`} aria-hidden="true" />
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold transition-all ${
          isDark
            ? "bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-750"
            : "bg-white text-stone-700 hover:bg-stone-50"
        } ${className}`}
        aria-label="Toggle Dark / Light Mode"
      >
        <span className="material-symbols-outlined text-base">
          {isDark ? "dark_mode" : "light_mode"}
        </span>
        <span>{isDark ? "Dark" : "Light"}</span>
      </button>
    );
  }

  // Default compact icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-95 ${
        isDark
          ? "bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700"
          : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className="material-symbols-outlined text-[17px]">
        {isDark ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
}
