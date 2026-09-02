"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../../components/layout/Sidebar";
import Header from "../../../components/layout/Header";
import BottomNav from "../../../components/layout/BottomNav";
import { useLanguage } from "../../../context/LanguageContext";
import { useFarm } from "../../../context/FarmContext";
import { fetchApi } from "../../../lib/api";

export default function CropRecommendationsPage() {
  const { farmData } = useFarm();

  const [crops, setCrops] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedSeason, setSelectedSeason] = useState("Rabi");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      try {
        const res = await fetchApi(
          `/crops/recommendations?soil_type=${encodeURIComponent(farmData.soilType)}&ph=${farmData.soilPh}&irrigation=${encodeURIComponent(farmData.irrigationSource)}&season=${selectedSeason}&acreage=${farmData.acreage}`
        );
        setCrops(res.crops || []);
      } catch (e) {
        console.error("Crops load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, [farmData.soilType, farmData.soilPh, farmData.irrigationSource, selectedSeason, farmData.acreage]);

  const filteredCrops = crops.filter((crop) => {
    if (activeFilter === "HIGH_PROFIT") return crop.roiPercentage >= 70;
    if (activeFilter === "LOW_WATER") return crop.waterEfficiency.includes("High");
    if (activeFilter === "SUSTAINABLE") return crop.sustainabilityScore >= 85;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-6xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Crop Advice & Suitability Ranking
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Ranked specifically for your {farmData.soilType} soil · {farmData.acreage} Acres · {farmData.district}
            </p>
          </div>

          <Link
            href="/crops/compare"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-xl border border-stone-200 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">balance</span>
            Compare Crops Side-by-Side
          </Link>
        </section>

        {/* Season & Category Tabs */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          {/* Season Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            {["Rabi", "Kharif", "Multi-season"].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSelectedSeason(season)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedSeason === season
                    ? "bg-white text-brand-900 shadow-sm"
                    : "text-content-muted hover:text-content"
                }`}
              >
                {season} Season
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "All Options" },
              { id: "HIGH_PROFIT", label: "Higher Return (>70%)" },
              { id: "LOW_WATER", label: "Low Water Need" },
              { id: "SUSTAINABLE", label: "Good for Soil" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f.id
                    ? "bg-brand-900 text-white font-semibold"
                    : "bg-white text-content-muted hover:text-content border border-stone-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-content-muted font-medium">Analyzing soil and seasonal suitability...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-stone-300">eco</span>
            <h3 className="font-bold text-content text-base">No Crops Match the Current Filter</h3>
            <p className="text-xs text-content-muted max-w-md">
              Try switching the season tab or selecting &quot;All Options&quot; to see available recommendations for your soil type.
            </p>
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className="mt-2 px-4 py-2 bg-brand-900 text-white text-xs font-semibold rounded-xl"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          /* Crop Recommendations Cards Grid */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCrops.map((crop) => (
              <div
                key={crop.cropId}
                className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-card flex flex-col justify-between gap-4 hover:border-brand-700 transition-colors"
              >
                {/* Header */}
                <div className="flex justify-between items-start pb-2 border-b border-stone-100">
                  <div>
                    <span className="text-[11px] font-semibold text-content-muted">
                      {crop.category} · {crop.growthDurationDays} Days
                    </span>
                    <h3 className="font-display text-lg font-bold text-content mt-0.5">
                      {crop.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-brand-50 text-brand-900 font-bold text-xs">
                      {crop.suitabilityScore}% Match
                    </span>
                  </div>
                </div>

                {/* Estimates */}
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                  <div>
                    <span className="text-content-muted text-[11px]">Est. Net Return</span>
                    <p className="font-bold text-brand-900 text-sm mt-0.5">
                      ₹{crop.estimatedNetProfit?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-content-muted text-[11px]">Return on Investment</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">
                      +{crop.roiPercentage}%
                    </p>
                  </div>
                  <div>
                    <span className="text-content-muted text-[11px]">Cultivation Cost</span>
                    <p className="font-medium text-content mt-0.5">
                      ₹{crop.estimatedCost?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-content-muted text-[11px]">Current Mandi</span>
                    <p className="font-medium text-content mt-0.5">
                      ₹{crop.currentMandiPrice}/q
                    </p>
                  </div>
                </div>

                {/* Reasons */}
                <div className="flex flex-col gap-1 text-xs text-content-muted">
                  <span className="font-semibold text-content text-[11px]">Why recommended:</span>
                  {crop.reasons?.slice(0, 2).map((r, i) => (
                    <p key={i} className="flex items-start gap-1.5 leading-normal">
                      <span className="material-symbols-outlined text-[15px] text-brand-700 mt-0.5 flex-shrink-0">
                        check_circle
                      </span>
                      <span>{r}</span>
                    </p>
                  ))}
                </div>

                {/* Action Button */}
                <Link
                  href={`/crops/${crop.cropId}`}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-xl transition-colors text-center border border-stone-200 mt-1"
                >
                  View Sowing Schedule & Cost Sheet →
                </Link>
              </div>
            ))}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
