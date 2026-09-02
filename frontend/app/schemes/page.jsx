"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useFarm } from "../../context/FarmContext";
import { fetchApi } from "../../lib/api";

export default function SchemesPage() {
  const { farmData } = useFarm();
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchemes() {
      setLoading(true);
      try {
        const res = await fetchApi(
          `/schemes/matched?acres=${farmData.acreage}&crop=${farmData.currentCrop}&state=${farmData.state}`
        );
        const list = res.schemes || [];
        setSchemes(list);
        if (list.length > 0) {
          setSelectedScheme(list[0]);
        }
      } catch (e) {
        console.error("Schemes load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSchemes();
  }, [farmData.acreage, farmData.currentCrop, farmData.state]);

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-6xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Government Schemes & Subsidies
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Matched for your {farmData.acreage} Acre landholding in {farmData.state}
            </p>
          </div>

          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200">
            {schemes.filter((s) => (s.matchScore || 0) >= 70).length} Eligible Schemes Found
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse w-full">
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-stone-200 rounded"></div>
                    <div className="h-4 w-16 bg-stone-200 rounded"></div>
                  </div>
                  <div className="h-4 w-40 bg-stone-200 rounded"></div>
                  <div className="h-3 w-full bg-stone-100 rounded"></div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
              <div className="h-6 w-56 bg-stone-200 rounded-lg"></div>
              <div className="h-4 w-full bg-stone-100 rounded"></div>
              <div className="h-24 bg-stone-50 rounded-xl border border-stone-100"></div>
              <div className="h-10 w-40 bg-stone-200 rounded-full"></div>
            </div>
          </div>
        ) : schemes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-stone-300">account_balance</span>
            <h3 className="font-bold text-content text-base">No Matching Schemes Found</h3>
            <p className="text-xs text-content-muted max-w-md">
              We couldn&apos;t find schemes matching your specific parameters. You can update your farm profile or check official central portals.
            </p>
          </div>
        ) : (
          /* Schemes List & Detail Split View */
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Column */}
            <div className="flex flex-col gap-3">
              {schemes.map((s) => {
                const isSelected = selectedScheme?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScheme(s)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-brand-50 border-brand-800"
                        : "bg-white border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-brand-800 uppercase tracking-wider">
                        {s.type}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {s.matchScore}% Match
                      </span>
                    </div>

                    <h3 className="font-bold text-content text-sm">{s.name}</h3>
                    <p className="text-xs text-content-muted line-clamp-2 leading-relaxed">
                      {s.benefit}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Scheme Details Column */}
            {selectedScheme && (
              <div className="lg:col-span-2 bg-white p-6 md:p-7 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5">
                <div className="flex justify-between items-start pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-xs font-semibold text-content-muted">
                      {selectedScheme.category}
                    </span>
                    <h2 className="font-display text-xl md:text-2xl font-bold text-content mt-0.5">
                      {selectedScheme.name}
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                    {selectedScheme.eligibilityStatus}
                  </span>
                </div>

                {/* Benefit Box */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-bold text-content uppercase tracking-wider mb-1">
                    Scheme Benefit & Subsidy:
                  </h4>
                  <p className="text-xs md:text-sm font-medium text-content leading-relaxed">
                    {selectedScheme.benefit}
                  </p>
                </div>

                {/* Eligibility Reasons */}
                <div className="flex flex-col gap-1.5 text-xs text-content-muted">
                  <h4 className="text-xs font-bold text-content uppercase tracking-wider">
                    Why you qualify:
                  </h4>
                  {selectedScheme.reasons?.map((r, i) => (
                    <p key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-800 text-base">check_circle</span>
                      {r}
                    </p>
                  ))}
                </div>

                {/* Document Checklist */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-content uppercase tracking-wider">
                    Required Documents Checklist:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedScheme.documentsRequired?.map((doc, i) => (
                      <div
                        key={i}
                        className="p-3 bg-stone-50 rounded-xl text-xs text-content flex items-center gap-2 border border-stone-200"
                      >
                        <span className="material-symbols-outlined text-brand-800 text-base">description</span>
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* External Apply Button */}
                {selectedScheme.applicationUrl && (
                  <a
                    href={selectedScheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs rounded-xl shadow-sm text-center flex items-center justify-center gap-2 mt-2 transition-colors"
                  >
                    <span>Open Official Application Portal</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
