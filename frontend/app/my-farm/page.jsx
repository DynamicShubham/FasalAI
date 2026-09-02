"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";

export default function MyFarmPage() {
  const { user, farmerProfile } = useAuth();
  const { farmData, hasFarm } = useFarm();

  const farmerName = farmerProfile?.name || user?.name || "Farmer";
  const farmName = farmData?.farmName || `${farmerName}'s Farm`;

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-5xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* EMPTY STATE: If no farm is registered */}
        {!hasFarm && (
          <section className="bg-white p-8 md:p-12 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col items-center text-center gap-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center text-3xl shadow-xs">
              🌾
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-content">
                No Farm Registered Yet
              </h2>
              <p className="text-xs md:text-sm text-content-muted mt-1.5 max-w-md leading-relaxed">
                You haven&apos;t registered your land parcel yet. Add your acreage, soil type, and current standing crop to track soil health and crop growth.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="px-6 py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add_location_alt</span>
              Register Your Farm Parcel
            </Link>
          </section>
        )}

        {/* REAL FARM DETAILS */}
        {hasFarm && (
          <>
            {/* Header */}
            <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
                  {farmName}
                </h1>
                <p className="text-xs md:text-sm text-content-muted mt-0.5">
                  {farmData.district}{farmData.state ? `, ${farmData.state}` : ""} · Managed by {farmerName}
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
                <span className="text-xs font-semibold text-content-muted">Total Land Area</span>
                <div>
                  <p className="text-3xl font-bold text-content">{farmData.acreage} Acres</p>
                  <p className="text-xs text-content-muted mt-0.5">Registered Parcel</p>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted truncate">
                  Irrigation: {farmData.irrigationSource || "Active"}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
                <span className="text-xs font-semibold text-content-muted">Soil Profile</span>
                <div>
                  <p className="text-2xl font-bold text-brand-800">{farmData.soilType || "Active Soil"}</p>
                  <p className="text-xs text-content-muted mt-0.5">pH {farmData.soilPh || 6.8}</p>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted">
                  Water: {farmData.waterAvailability || "Medium"} Availability
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-3">
                <span className="text-xs font-semibold text-content-muted">Standing Crop</span>
                <div>
                  <p className="text-3xl font-bold text-content">{farmData.currentCrop}</p>
                  <p className="text-xs text-content-muted mt-0.5">
                    {farmData.sowingDaysAgo ? `Day ${farmData.sowingDaysAgo} of growth` : "Active Crop Cycle"}
                  </p>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-lg text-xs text-content-muted">
                  Sowing Date: {farmData.sowingDate || "Recorded"}
                </div>
              </div>
            </section>

            {/* Parcel Breakdown */}
            <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
              <h3 className="font-display text-base font-bold text-content pb-2 border-b border-stone-100">
                Registered Field Parcels
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-content text-sm">{farmData.farmName || "Primary Parcel"}</h4>
                    <span className="text-xs font-semibold bg-white px-2.5 py-0.5 rounded border border-stone-200">
                      {farmData.acreage} Acres
                    </span>
                  </div>
                  <p className="text-xs text-content-muted">
                    Crop: {farmData.currentCrop} · Soil: {farmData.soilType} · {farmData.irrigationSource}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                    <span className="text-brand-800 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Active & Monitored
                    </span>
                    <Link href="/scanner" className="text-brand-900 font-semibold hover:underline">
                      Check Leaf →
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
