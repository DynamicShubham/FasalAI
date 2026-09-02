"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { farmData } = useFarm();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/my-farm", label: "My Farm", icon: "potted_plant" },
    { href: "/scanner", label: "Plant Doctor", icon: "photo_camera" },
    { href: "/crops/recommendations", label: "Crop Advice", icon: "eco" },
    { href: "/market", label: "Mandi Prices", icon: "storefront" },
    { href: "/schemes", label: "Govt Schemes", icon: "account_balance" },
    { href: "/assistant", label: "Farm Advisor", icon: "support_agent" },
    { href: "/alerts", label: "Alerts", icon: "notifications" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-24px)] w-64 left-0 top-0 sticky bg-white border border-stone-200/80 m-3 rounded-2xl p-5 gap-2 z-40 flex-shrink-0 shadow-subtle">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 border-b border-stone-100">
        <img
          src="/logo.png"
          alt="FasalAI Logo"
          className="w-10 h-10 rounded-xl object-contain shadow-sm"
        />
        <div>
          <h1 className="font-display text-lg font-bold text-brand-900 leading-tight">
            FasalAI
          </h1>
          <p className="text-[12px] text-content-muted flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px] text-brand-700">location_on</span>
            {farmData.district}, {farmData.state}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-900 font-bold border border-brand-100"
                  : "text-content-muted hover:text-content hover:bg-stone-50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? "fill text-brand-800" : "text-stone-400"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Language & Profile Footer */}
      <div className="mt-auto pt-3 border-t border-stone-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[12px] text-content-muted px-1">
          <span>Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-stone-100 text-brand-900 font-medium rounded-lg px-2.5 py-1 text-[12px] outline-none border border-stone-200 cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 flex items-center justify-center font-bold text-xs">
            👨‍🌾
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-content truncate">{user?.name || "Farmer Profile"}</p>
            {farmData?.acreage && farmData?.currentCrop ? (
              <p className="text-[10px] text-content-muted truncate">{farmData.acreage} Acres · {farmData.currentCrop}</p>
            ) : (
              <p className="text-[10px] text-brand-800 font-semibold">Farm Setup Needed</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
