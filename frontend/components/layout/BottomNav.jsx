"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/my-farm", label: "My Farm", icon: "potted_plant" },
    { href: "/scanner", label: "Plant Doctor", icon: "photo_camera", isHighlight: true },
    { href: "/market", label: "Mandi", icon: "storefront" },
    { href: "/assistant", label: "Advisor", icon: "support_agent" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around px-2 z-50 shadow-dropdown">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        
        if (item.isHighlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-900 text-white flex items-center justify-center shadow-md border-2 border-white active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
              </div>
              <span className="text-[10px] font-bold text-brand-900 mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors ${
              isActive ? "text-brand-900 font-bold" : "text-content-muted hover:text-content"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isActive ? "fill text-brand-900" : "text-stone-400"
              }`}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] mt-0.5 ${isActive ? "font-bold text-brand-900" : "font-normal"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
