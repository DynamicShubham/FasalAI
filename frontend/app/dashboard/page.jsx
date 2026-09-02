"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";
import { fetchApi } from "../../lib/api";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { farmData } = useFarm();

  const [dailyPlan, setDailyPlan] = useState(null);
  const [weather, setWeather] = useState(null);
  const [market, setMarket] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [planRes, weatherRes, marketRes, schemeRes] = await Promise.all([
          fetchApi("/decisions/daily-plan?crop=Wheat&sowing_days_ago=22"),
          fetchApi(`/weather/forecast?district=${farmData.district}`),
          fetchApi(`/market/compare?crop=Onion&quantity=20&district=${farmData.district}`),
          fetchApi(`/schemes/matched?acres=${farmData.acreage}&crop=Wheat`),
        ]);

        setDailyPlan(planRes);
        setWeather(weatherRes);
        setMarket(marketRes);
        setSchemes(schemeRes.schemes || []);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [farmData.district, farmData.acreage]);

  const toggleTaskComplete = (taskId) => {
    if (!dailyPlan) return;
    const updatedTasks = dailyPlan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    const completedCount = updatedTasks.filter((t) => t.completed).length;
    setDailyPlan({
      ...dailyPlan,
      tasks: updatedTasks,
      completionRate: `${completedCount} of ${updatedTasks.length} done`,
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-6xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* 1 & 2. Farmer Greeting & Farm Location */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-0.5">
              <span className="flex items-center gap-0.5 text-brand-800">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                {farmData.district}, {farmData.state}
              </span>
              <span>·</span>
              <span>{farmData.acreage} Acres</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Good morning, {user?.name ? user.name.split(" ")[0] : "Ramesh"}
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Here is what you need to know about your farm today.
            </p>
          </div>

          <Link
            href="/scanner"
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            Check Crop Disease
          </Link>
        </section>

        {/* 3. Current Standing Crop Status (Farm-First Card) */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-stone-100">
            <div>
              <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Standing Crop</span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-content mt-0.5">
                {farmData.currentCrop}
              </h2>
              <p className="text-xs text-content-muted">Day 22 · Crown Root Initiation (Vegetative Stage)</p>
            </div>

            <Link
              href="/crops/wheat"
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              View Crop Details →
            </Link>
          </div>

          {/* Key Indicators in Simple Plain Language */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-content-muted font-medium">Crop Health</span>
              <p className="text-sm font-bold text-brand-800 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-brand-700">check_circle</span>
                Good (No Disease)
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-content-muted font-medium">Soil Moisture</span>
              <p className="text-sm font-bold text-content mt-0.5">62% (Optimal)</p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-content-muted font-medium">Next Watering</span>
              <p className="text-sm font-bold text-content mt-0.5">Tomorrow Morning</p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-content-muted font-medium">Spray Condition</span>
              <p className="text-sm font-bold text-amber-700 mt-0.5">Avoid before rain</p>
            </div>
          </div>

          {/* What to do note */}
          <div className="bg-brand-50/60 p-3.5 rounded-xl border border-brand-100/80 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-brand-800 text-lg mt-0.5">lightbulb</span>
            <p className="text-xs text-brand-950 leading-relaxed">
              <strong className="font-semibold text-brand-900">Farm Advice:</strong> Your wheat is at a critical root-forming stage. Give a light watering tomorrow morning. Hold off on any spray until after Saturday's rain.
            </p>
          </div>
        </section>

        {/* 4 & 5. Weather & Today's Farm Plan Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Farm Plan (Clear Daily Checklist) */}
          <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-800">checklist</span>
                <h3 className="font-display text-lg font-bold text-content">Today's Farm Plan</h3>
              </div>
              <span className="text-xs font-semibold text-content-muted bg-stone-100 px-2.5 py-1 rounded-full">
                {dailyPlan?.completionRate || "1 of 3 done"}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {dailyPlan?.tasks?.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskComplete(task.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                    task.completed
                      ? "bg-stone-50/70 border-stone-200 text-content-muted"
                      : "bg-white border-stone-200 hover:border-brand-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-brand-900 accent-brand-900 cursor-pointer"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs md:text-sm font-semibold ${task.completed ? "line-through text-content-muted" : "text-content"}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        {task.timing}
                      </span>
                    </div>
                    <p className="text-xs text-content-muted mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Weather Widget */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-amber-600">wb_sunny</span>
                Weather
              </span>
              <span className="text-xs text-content-muted">{weather?.location || "Nashik"}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold text-content">{weather?.currentTemp || 28}°C</p>
                <p className="text-xs text-content-muted font-medium mt-0.5">{weather?.condition || "Partly Sunny"}</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-amber-500">
                wb_sunny
              </span>
            </div>

            {/* Practical Action Note */}
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-950">
              <p className="font-semibold text-amber-900 flex items-center gap-1 mb-0.5">
                <span className="material-symbols-outlined text-[14px]">water_drop</span>
                Rain Expected Saturday (75%)
              </p>
              <p className="text-[11px] text-amber-900/90 leading-normal">
                Avoid foliar spraying on Friday. Ensure water drainage in low-lying parcels.
              </p>
            </div>

            {/* Mini 4-day forecast */}
            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-stone-100 text-center text-xs">
              {weather?.forecast?.slice(0, 4).map((f, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] text-content-muted">{f.day}</span>
                  <span className="material-symbols-outlined text-[16px] text-amber-600 my-0.5">{f.icon || "wb_sunny"}</span>
                  <span className="text-xs font-bold text-content">{f.tempMax}°</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 & 7. Market & Government Schemes Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Nearby Market */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-brand-800">storefront</span>
                Best Nearby Market
              </span>
              <Link href="/market" className="text-xs text-brand-800 font-semibold hover:underline">
                View All Markets →
              </Link>
            </div>

            <div>
              <p className="text-xs text-content-muted">Top recommendation for Onion (20 quintals):</p>
              <div className="flex justify-between items-baseline mt-1">
                <h4 className="text-base font-bold text-content">
                  {market?.bestMandi?.mandiName || "Pimpalgaon Baswant APMC"}
                </h4>
                <span className="text-xs text-content-muted">
                  {market?.bestMandi?.distanceKm || 34} km away
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-brand-900">
                  ₹{market?.bestMandi?.modalPrice || 2280}/q
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ▲ +6.2% price increase
                </span>
              </div>
            </div>

            <p className="text-xs text-content-muted bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              Prices are currently favorable. Even after ₹65/q transport, you gain approximately ₹2,000 more net.
            </p>
          </div>

          {/* Government Support & Subsidies */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-brand-800">account_balance</span>
                Government Support
              </span>
              <Link href="/schemes" className="text-xs text-brand-800 font-semibold hover:underline">
                View Schemes ({schemes.length}) →
              </Link>
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Eligible for your {farmData.acreage} Acre farm
              </span>
              <h4 className="text-base font-bold text-content mt-1">
                PMKSY Micro-Irrigation (Drip Subsidy)
              </h4>
              <p className="text-xs text-content-muted mt-0.5 leading-relaxed">
                Up to 55% government subsidy for installing drip irrigation on small and marginal farm land.
              </p>
            </div>

            <Link
              href="/schemes"
              className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 text-brand-900 font-semibold text-xs rounded-xl border border-stone-200 text-center transition-colors"
            >
              Check Required Documents & Apply
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
