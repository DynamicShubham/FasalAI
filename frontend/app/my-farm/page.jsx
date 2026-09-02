"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useFarm } from "../../context/FarmContext";

export default function MyFarmPage() {
  const { farmData } = useFarm();

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-5xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              {farmData.farmName || "Patil Farm"}
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              {farmData.district}, {farmData.state} · Land Record Verified
            </p>
          </div>

          <Link
            href="/farm-setup"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-xl border border-stone-200 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Edit Land Parameters
          </Link>
        </section>

        {/* Overview Numbers */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
            <span className="text-xs font-semibold text-content-muted">Total Farm Size</span>
            <div>
              <p className="text-3xl font-bold text-content">{farmData.acreage} Acres</p>
              <p className="text-xs text-content-muted mt-0.5">2 Active Parcels</p>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted">
              Irrigation: {farmData.irrigationSource}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
            <span className="text-xs font-semibold text-content-muted">Soil Health</span>
            <div>
              <p className="text-3xl font-bold text-brand-800">Good</p>
              <p className="text-xs text-content-muted mt-0.5">{farmData.soilType} · pH {farmData.soilPh}</p>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted">
              Organic Carbon: 0.72% (Optimal)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
            <span className="text-xs font-semibold text-content-muted">Standing Crop</span>
            <div>
              <p className="text-3xl font-bold text-content">{farmData.currentCrop}</p>
              <p className="text-xs text-content-muted mt-0.5">Day 22 · Crown Root Node</p>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted">
              Expected Harvest: Mid-March
            </div>
          </div>
        </section>

        {/* Parcel Breakdown */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
          <h3 className="font-display text-base font-bold text-content pb-2 border-b border-stone-100">
            Field Parcels
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parcel A */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-content text-sm">Parcel A (North Field)</h4>
                <span className="text-xs font-semibold bg-white px-2.5 py-0.5 rounded border border-stone-200">
                  2.0 Acres
                </span>
              </div>
              <p className="text-xs text-content-muted">
                Crop: Wheat (HD-2967) · Sown Aug 11 · Drip Line Active
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                <span className="text-brand-800 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Healthy
                </span>
                <Link href="/scanner" className="text-brand-900 font-semibold hover:underline">
                  Check Leaf →
                </Link>
              </div>
            </div>

            {/* Parcel B */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-content text-sm">Parcel B (South Field)</h4>
                <span className="text-xs font-semibold bg-white px-2.5 py-0.5 rounded border border-stone-200">
                  1.5 Acres
                </span>
              </div>
              <p className="text-xs text-content-muted">
                Crop: Mustard Intercrop · Sown Aug 14 · Sprinkler Line
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                <span className="text-brand-800 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Healthy
                </span>
                <Link href="/scanner" className="text-brand-900 font-semibold hover:underline">
                  Check Leaf →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
