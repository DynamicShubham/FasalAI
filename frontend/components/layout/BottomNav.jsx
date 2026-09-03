"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.navHome || "Home", icon: "home" },
    { href: "/my-farm", label: t.navMyFarm || "My Farm", icon: "potted_plant" },
    { href: "/scanner", label: t.navScanner || "Scan", icon: "photo_camera", isHighlight: true },
    { href: "/market", label: t.navMarket || "Mandi", icon: "storefront" },
    { href: "/assistant", label: t.navAssistant || "Advisor", icon: "support_agent" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-around px-1 z-50 shadow-dropdown"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        
        if (item.isHighlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-5 group touch-target-auto"
            >
              <div className="w-11 h-11 rounded-full bg-brand-900 dark:bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-stone-900 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
              </div>
              <span className="text-[9px] font-bold text-brand-900 dark:text-emerald-400 mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-1.5 min-w-0 transition-colors touch-target-auto ${
              isActive ? "text-brand-900 dark:text-emerald-400 font-bold" : "text-content-muted hover:text-content"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isActive ? "fill text-brand-900 dark:text-emerald-400" : "text-stone-400"
              }`}
            >
              {item.icon}
            </span>
            <span className={`text-[9px] mt-0.5 truncate max-w-[56px] ${isActive ? "font-bold text-brand-900 dark:text-emerald-400" : "font-normal"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
