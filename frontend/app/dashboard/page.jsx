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
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { farmData, hasFarm } = useFarm();

  const [dailyPlan, setDailyPlan] = useState(null);
  const [weather, setWeather] = useState(null);
  const [market, setMarket] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!farmData?.district || !farmData?.currentCrop) {
        setLoading(false);
        return;
      }

      try {
        const [planRes, weatherRes, marketRes, schemeRes] = await Promise.all([
          fetchApi(`/decisions/daily-plan?crop=${encodeURIComponent(farmData.currentCrop)}&sowing_days_ago=${farmData.sowingDaysAgo || 0}`),
          fetchApi(`/weather/forecast?district=${encodeURIComponent(farmData.district)}`),
          fetchApi(`/market/compare?crop=${encodeURIComponent(farmData.currentCrop)}&quantity=20&district=${encodeURIComponent(farmData.district)}`),
          fetchApi(`/schemes/matched?acres=${farmData.acreage || 1}&crop=${encodeURIComponent(farmData.currentCrop)}`),
        ]);

        setDailyPlan(planRes);
        setWeather(weatherRes);
        setMarket(marketRes);
        setSchemes(schemeRes.schemes || []);
        
        const anyOffline = [planRes, weatherRes, marketRes, schemeRes].some(r => r?.isOfflineFallback);
        setIsOffline(anyOffline);
      } catch (e) {
        console.error("Dashboard data load error:", e);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [farmData]);

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

  const sprayCondition = (() => {
    if (!weather) return { text: "Checking...", color: "text-content-muted" };
    const rainProb = weather.rainProbability || 0;
    const wind = weather.windSpeedKm || 0;
    if (rainProb > 50 || wind > 15) return { text: "Avoid — rain/wind risk", color: "text-amber-700" };
    if (rainProb > 30) return { text: "Caution — monitor rain", color: "text-amber-600" };
    return { text: "Safe — calm conditions", color: "text-brand-800" };
  })();

  const nextWatering = (() => {
    if (!weather) return "Checking weather...";
    const rainProb = weather.rainProbability || 0;
    if (rainProb >= 70) return "Skip — rain expected";
    if (rainProb >= 40) return "Monitor — possible rain";
    return "Morning cycle recommended";
  })();

  const soilMoisture = weather?.soilMoistureIndex || "Optimal";

  const marketPriceChange = (() => {
    if (!market?.bestMandi) return null;
    const bestPrice = market.bestMandi.modalPrice || 0;
    const minPrice = market.bestMandi.minPrice || bestPrice;
    if (bestPrice && minPrice && bestPrice > minPrice) {
      const pctChange = (((bestPrice - minPrice) / minPrice) * 100).toFixed(1);
      return { text: `▲ +${pctChange}% above minimum`, isUp: true };
    }
    return { text: "● Stable pricing", isUp: false };
  })();

  const farmerDisplayName = user?.name ? user.name.split(" ")[0] : "Farmer";

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-6xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-medium">
            <span className="material-symbols-outlined text-base">cloud_off</span>
            <span>Working in offline mode — showing cached data. Some information may not be current.</span>
          </div>
        )}

        {/* Structural Skeleton Loading State */}
        {loading && <DashboardSkeleton />}

        {/* EMPTY STATE: If no farm parcel registered yet */}
        {!loading && !hasFarm && (
          <section className="bg-white p-8 md:p-12 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col items-center text-center gap-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center text-3xl shadow-xs">
              🌱
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-content">
                Welcome to FasalAI, {farmerDisplayName}!
              </h2>
              <p className="text-xs md:text-sm text-content-muted mt-1.5 max-w-md leading-relaxed">
                Your farm profile is not configured yet. Complete the quick 2-step setup to unlock personalized daily farming tasks, crop pathology diagnostics, and live mandi realizations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/onboarding"
                className="px-6 py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add_location_alt</span>
                Set Up My Farm (2 Steps)
              </Link>
              <Link
                href="/scanner"
                className="px-6 py-3 bg-white hover:bg-stone-50 text-content font-semibold text-xs md:text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Check Crop Leaf Health
              </Link>
            </div>
          </section>
        )}

        {/* REAL DASHBOARD (When farm is configured) */}
        {!loading && hasFarm && (
          <>
            {/* 1 & 2. Farmer Greeting & Farm Location */}
            <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-0.5">
                  <span className="flex items-center gap-0.5 text-brand-800">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    {farmData.district}{farmData.state ? `, ${farmData.state}` : ""}
                  </span>
                  <span>·</span>
                  <span>{farmData.acreage} Acres</span>
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
                  {getTimeGreeting()}, {farmerDisplayName}
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

            {/* 3. Current Standing Crop Status (Driven by Real Supabase Data) */}
            <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Standing Crop</span>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-content mt-0.5">
                    {farmData.currentCrop}
                  </h2>
                  <p className="text-xs text-content-muted">
                    {farmData.sowingDaysAgo ? `Day ${farmData.sowingDaysAgo} · Growing Stage` : "Active Crop Cycle"}
                  </p>
                </div>

                <Link
                  href={`/crops/${farmData.currentCrop.toLowerCase().split(" ")[0]}`}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  View Crop Details →
                </Link>
              </div>

              {/* Key Indicators driven from real weather/plan data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[11px] text-content-muted font-medium">Soil Profile</span>
                  <p className="text-sm font-bold text-content mt-0.5">{farmData.soilType || "Active Soil"}</p>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[11px] text-content-muted font-medium">Soil Moisture</span>
                  <p className="text-sm font-bold text-content mt-0.5">{soilMoisture}</p>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[11px] text-content-muted font-medium">Irrigation System</span>
                  <p className="text-sm font-bold text-content mt-0.5 truncate">{farmData.irrigationSource || "Active"}</p>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[11px] text-content-muted font-medium">Spray Condition</span>
                  <p className={`text-sm font-bold mt-0.5 ${sprayCondition.color}`}>{sprayCondition.text}</p>
                </div>
              </div>

              {/* What to do note */}
              <div className="bg-brand-50/60 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-brand-100/80 dark:border-emerald-800/60 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-brand-800 dark:text-emerald-400 text-lg mt-0.5">lightbulb</span>
                <p className="text-xs text-brand-950 dark:text-emerald-100 leading-relaxed">
                  <strong className="font-semibold text-brand-900 dark:text-emerald-300">Farm Advice:</strong> Your {farmData.currentCrop.toLowerCase()} in {farmData.district} is monitored. {sprayCondition.text.includes("Avoid") ? "Hold off on spraying until wind and rain conditions clear." : "Weather conditions are favorable for scheduled field management."}
                </p>
              </div>
            </section>

            {/* 4 & 5. Weather & Today's Farm Plan Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Farm Plan */}
              <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-800 dark:text-emerald-400">checklist</span>
                    <h3 className="font-display text-lg font-bold text-content">Today&apos;s Farm Plan</h3>
                  </div>
                  <span className="text-xs font-semibold text-content-muted bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
                    {dailyPlan?.completionRate || "Active"}
                  </span>
                </div>

                {dailyPlan?.tasks?.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {dailyPlan.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                          task.completed
                            ? "bg-stone-50/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-content-muted dark:text-stone-400"
                            : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-brand-700 dark:hover:border-emerald-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!task.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task.id);
                          }}
                          className="mt-0.5 w-4 h-4 rounded text-brand-900 accent-brand-900 cursor-pointer"
                          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs md:text-sm font-semibold ${task.completed ? "line-through text-content-muted dark:text-stone-400" : "text-content"}`}>
                              {task.title}
                            </p>
                            <span className="text-[10px] font-medium text-stone-500 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                              {task.timing}
                            </span>
                          </div>
                          <p className="text-xs text-content-muted dark:text-stone-400 mt-0.5 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-stone-300 mb-2">task_alt</span>
                    <p className="text-sm text-content-muted">No scheduled tasks for today.</p>
                  </div>
                )}
              </div>

              {/* Weather Widget */}
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <span className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">wb_sunny</span>
                    Weather
                  </span>
                  <span className="text-xs text-content-muted flex items-center gap-1">
                    {farmData.district}
                  </span>
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

                {weather && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-950 dark:text-amber-200">
                    <p className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                      <span className="material-symbols-outlined text-[14px]">water_drop</span>
                      {weather.rainProbability >= 60
                        ? `Rain Expected (${weather.rainProbability}%)`
                        : weather.rainProbability >= 30
                        ? `Possible Rain (${weather.rainProbability}%)`
                        : `Low Rain Chance (${weather.rainProbability}%)`}
                    </p>
                    <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-normal">
                      {weather.irrigationAdvice || "Monitor field moisture and adjust irrigation cycles."}
                    </p>
                  </div>
                )}

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
                    <span className="material-symbols-outlined text-[16px] text-brand-800 dark:text-emerald-400">storefront</span>
                    Nearby APMC Markets
                  </span>
                  <Link href="/market" className="text-xs text-brand-800 dark:text-emerald-400 font-semibold hover:underline">
                    View All Markets →
                  </Link>
                </div>

                <div>
                  <p className="text-xs text-content-muted">Realization for {farmData.currentCrop}:</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <h4 className="text-base font-bold text-content truncate">
                      {market?.bestMandi?.mandiName || "Regional APMC Mandi"}
                    </h4>
                    <span className="text-xs text-content-muted flex-shrink-0 ml-2">
                      {market?.bestMandi?.distanceKm || 25} km away
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="text-xl font-black text-brand-900 dark:text-emerald-400">
                      ₹{market?.bestMandi?.modalPrice || 2400}/q
                    </span>
                    {marketPriceChange && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        marketPriceChange.isUp
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60"
                          : "text-content-muted bg-stone-100 dark:bg-stone-800"
                      }`}>
                        {marketPriceChange.text}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-content-muted bg-stone-50 dark:bg-stone-850 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                  {market?.recommendationText || `Compare distance-adjusted net returns for ${farmData.currentCrop}.`}
                </p>
              </div>

              {/* Government Support & Subsidies */}
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <span className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-brand-800 dark:text-emerald-400">account_balance</span>
                    Government Support
                  </span>
                  <Link href="/schemes" className="text-xs text-brand-800 dark:text-emerald-400 font-semibold hover:underline">
                    View Schemes ({schemes.length || 3}) →
                  </Link>
                </div>

                {schemes.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Matched for your {farmData.acreage} Acre farm
                    </span>
                    <h4 className="text-base font-bold text-content mt-1">
                      {schemes[0]?.name || "PM-KISAN Scheme"}
                    </h4>
                    <p className="text-xs text-content-muted mt-0.5 leading-relaxed">
                      {schemes[0]?.benefit || "Direct income support and micro-irrigation subsidies."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <span className="material-symbols-outlined text-2xl text-stone-300 mb-1">search</span>
                    <p className="text-xs text-content-muted">Matching eligible central & state subsidies...</p>
                  </div>
                )}

                <Link
                  href="/schemes"
                  className="w-full py-2.5 bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-900 dark:text-emerald-400 font-semibold text-xs rounded-xl border border-stone-200 dark:border-stone-800 text-center transition-colors"
                >
                  Check Required Documents & Apply
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
