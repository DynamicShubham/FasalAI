"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "../../../components/layout/Sidebar";
import Header from "../../../components/layout/Header";
import BottomNav from "../../../components/layout/BottomNav";
import { useFarm } from "../../../context/FarmContext";
import { fetchApi } from "../../../lib/api";

export default function CropDetailPage() {
  const { cropId } = useParams();
  const { farmData } = useFarm();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCrop() {
      const res = await fetchApi(`/crops/${cropId}`);
      setCrop(res.crop || null);
      setLoading(false);
    }
    loadCrop();
  }, [cropId]);

  if (loading || !crop) {
    return (
      <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
        <Sidebar />
        <Header />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="text-brand-900 font-semibold">Loading Crop Details...</div>
        </main>
      </div>
    );
  }

  const totalCost = (crop.costOfCultivationPerAcre || 14000) * farmData.acreage;
  const totalYield = (crop.avgYieldQuintalPerAcre || 18) * farmData.acreage;
  const totalRev = totalYield * (crop.currentAvgMandiPrice || 2400);
  const netProfit = totalRev - totalCost;

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-5xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-content-muted">
              {crop.category} · {crop.season} Season
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content mt-0.5">
              {crop.name}
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-1 leading-relaxed max-w-xl">
              {crop.description}
            </p>
          </div>

          <Link
            href="/crops/recommendations"
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-content font-medium transition-colors"
          >
            ← Back
          </Link>
        </section>

        {/* Financial Projection */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <h3 className="font-display text-base font-bold text-content">
              Estimated Return on Your Farm ({farmData.acreage} Acres)
            </h3>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded border border-emerald-200 dark:border-emerald-800/60">
              +{Math.round((netProfit / totalCost) * 100)}% ROI
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] text-content-muted">Est. Net Profit</span>
              <p className="text-lg font-bold text-brand-900 dark:text-emerald-400 mt-0.5">₹{Math.round(netProfit).toLocaleString()}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] text-content-muted">Total Cultivation Cost</span>
              <p className="text-sm font-semibold text-content mt-0.5">₹{Math.round(totalCost).toLocaleString()}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] text-content-muted">Expected Yield</span>
              <p className="text-sm font-semibold text-content mt-0.5">{totalYield} Quintals</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] text-content-muted">Avg Mandi Price</span>
              <p className="text-sm font-semibold text-content mt-0.5">₹{crop.currentAvgMandiPrice}/q</p>
            </div>
          </div>
        </section>

        {/* Schedule & Agronomy Notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sowing & Water */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-3">
            <h4 className="font-bold text-content text-sm flex items-center gap-1.5 pb-2 border-b border-stone-100">
              <span className="material-symbols-outlined text-brand-800 dark:text-emerald-400 text-base">calendar_month</span>
              Sowing & Irrigation Guidelines
            </h4>

            <div className="flex flex-col gap-2 text-xs text-content-muted">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span>Optimal Sowing Window:</span>
                <span className="font-medium text-content">{crop.sowingWindow}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span>Harvest Window:</span>
                <span className="font-medium text-content">{crop.harvestWindow}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span>Water Requirement:</span>
                <span className="font-medium text-content">{crop.waterRequirementMm} mm</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Duration:</span>
                <span className="font-medium text-content">{crop.growthDurationDays} Days</span>
              </div>
            </div>
          </div>

          {/* Practical Field Tip */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
            <div>
              <h4 className="font-bold text-content text-sm flex items-center gap-1.5 pb-2 border-b border-stone-100">
                <span className="material-symbols-outlined text-brand-800 dark:text-emerald-400 text-base">lightbulb</span>
                Practical Field Advice
              </h4>
              <p className="text-xs text-content-muted leading-relaxed mt-2 bg-stone-50 dark:bg-stone-850 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                {crop.tips}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
              <span className="text-content-muted">Government MSP:</span>
              <span className="font-bold text-brand-900 dark:text-emerald-400">₹{crop.mspPerQuintal || "N/A"}/q</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
