"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../../components/layout/Sidebar";
import Header from "../../../components/layout/Header";
import BottomNav from "../../../components/layout/BottomNav";
import { useFarm } from "../../../context/FarmContext";
import { fetchApi } from "../../../lib/api";

export default function CropComparePage() {
  const { farmData } = useFarm();
  const [crops, setCrops] = useState([]);
  const [selectedCropA, setSelectedCropA] = useState("wheat");
  const [selectedCropB, setSelectedCropB] = useState("mustard");

  useEffect(() => {
    async function loadCrops() {
      const res = await fetchApi("/crops/all");
      setCrops(res.crops || []);
    }
    loadCrops();
  }, []);

  const cropA = crops.find((c) => c.id === selectedCropA) || crops[0];
  const cropB = crops.find((c) => c.id === selectedCropB) || crops[1] || crops[0];

  const calcNetProfit = (crop) => {
    if (!crop) return 0;
    const rev = (crop.avgYieldQuintalPerAcre || 10) * (crop.currentAvgMandiPrice || 2000);
    const cost = crop.costOfCultivationPerAcre || 15000;
    return (rev - cost) * farmData.acreage;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-5xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Crop Comparison
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Side-by-side comparison for your {farmData.acreage} Acre farm in {farmData.district}
            </p>
          </div>

          <Link
            href="/crops/recommendations"
            className="text-xs font-semibold text-brand-900 hover:underline"
          >
            ← Back to Recommendations
          </Link>
        </section>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between shadow-subtle">
            <span className="text-xs font-bold text-content">Select Crop 1:</span>
            <select
              value={selectedCropA}
              onChange={(e) => setSelectedCropA(e.target.value)}
              className="bg-stone-100 text-content text-xs font-semibold rounded-lg px-3 py-1.5 border border-stone-300 outline-none"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between shadow-subtle">
            <span className="text-xs font-bold text-content">Select Crop 2:</span>
            <select
              value={selectedCropB}
              onChange={(e) => setSelectedCropB(e.target.value)}
              className="bg-stone-100 text-content text-xs font-semibold rounded-lg px-3 py-1.5 border border-stone-300 outline-none"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Cards */}
        {cropA && cropB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card A */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-4">
              <div className="flex justify-between items-start pb-2 border-b border-stone-100">
                <div>
                  <span className="text-xs font-semibold text-content-muted">{cropA.category}</span>
                  <h3 className="font-display text-lg font-bold text-content mt-0.5">{cropA.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-stone-100 rounded text-xs text-content font-medium">
                  {cropA.growthDurationDays} Days
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Est. Net Return ({farmData.acreage} ac)</span>
                  <span className="font-bold text-brand-900 text-sm">
                    ₹{calcNetProfit(cropA).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Cultivation Cost / Acre</span>
                  <span className="font-medium text-content">₹{cropA.costOfCultivationPerAcre?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Current Mandi Price</span>
                  <span className="font-medium text-content">₹{cropA.currentAvgMandiPrice}/q</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Water Need</span>
                  <span className="font-medium text-content">{cropA.waterRequirementMm} mm</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-content-muted">Soil Health Score</span>
                  <span className="font-semibold text-emerald-700">{cropA.sustainabilityScore} / 100</span>
                </div>
              </div>

              <p className="text-xs text-content-muted leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                {cropA.description}
              </p>
            </div>

            {/* Card B */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-4">
              <div className="flex justify-between items-start pb-2 border-b border-stone-100">
                <div>
                  <span className="text-xs font-semibold text-content-muted">{cropB.category}</span>
                  <h3 className="font-display text-lg font-bold text-content mt-0.5">{cropB.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-stone-100 rounded text-xs text-content font-medium">
                  {cropB.growthDurationDays} Days
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Est. Net Return ({farmData.acreage} ac)</span>
                  <span className="font-bold text-brand-900 text-sm">
                    ₹{calcNetProfit(cropB).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Cultivation Cost / Acre</span>
                  <span className="font-medium text-content">₹{cropB.costOfCultivationPerAcre?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Current Mandi Price</span>
                  <span className="font-medium text-content">₹{cropB.currentAvgMandiPrice}/q</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-content-muted">Water Need</span>
                  <span className="font-medium text-content">{cropB.waterRequirementMm} mm</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-content-muted">Soil Health Score</span>
                  <span className="font-semibold text-emerald-700">{cropB.sustainabilityScore} / 100</span>
                </div>
              </div>

              <p className="text-xs text-content-muted leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                {cropB.description}
              </p>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
