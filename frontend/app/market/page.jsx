"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useFarm } from "../../context/FarmContext";
import { fetchApi } from "../../lib/api";

export default function MarketPage() {
  const { farmData } = useFarm();
  const [selectedCrop, setSelectedCrop] = useState("Onion");
  const [quantity, setQuantity] = useState(20);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarket() {
      setLoading(true);
      try {
        const res = await fetchApi(
          `/market/compare?crop=${selectedCrop}&quantity=${quantity}&district=${farmData.district}`
        );
        setMarketData(res);
      } catch (e) {
        console.error("Market load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMarket();
  }, [selectedCrop, quantity, farmData.district]);

  const commodities = ["Onion", "Tomato", "Soybean", "Wheat", "Cotton", "Mustard", "Chickpea"];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-5xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Mandi Prices & Transport Calculator
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Compares nearby markets taking road distance and vehicle fuel costs into account.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 px-3.5 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs text-content-muted">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-brand-900 text-xs font-bold outline-none cursor-pointer"
            >
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-content-muted font-medium">Calculating net rates across nearby mandis...</p>
          </div>
        ) : (
          <>
            {/* Best Recommendation Banner */}
            {marketData?.bestMandi ? (
              <section className="bg-white p-5 md:p-6 rounded-2xl border border-brand-200 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center text-2xl flex-shrink-0">
                    🏪
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">
                      Recommended Selling Market
                    </span>
                    <h3 className="font-display text-lg md:text-xl font-bold text-content mt-0.5">
                      {marketData.bestMandi.mandiName}
                    </h3>
                    <p className="text-xs text-content-muted mt-0.5 leading-relaxed max-w-lg">
                      {marketData.recommendationText}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end sm:items-center bg-brand-50/60 p-3.5 rounded-xl border border-brand-100 w-full sm:w-auto">
                  <span className="text-[11px] text-content-muted">Total Net In-Hand</span>
                  <span className="text-xl font-extrabold text-brand-900 mt-0.5">
                    ₹{marketData.bestMandi.netPayout?.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    (₹{marketData.bestMandi.netPricePerQuintal}/q after transport)
                  </span>
                </div>
              </section>
            ) : null}

            {/* Comparison List */}
            <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="font-display text-base font-bold text-content">
                  Nearby Mandi Rates ({quantity} Quintals)
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-content-muted">
                  <span>Quantity:</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-0.5 bg-stone-100 text-content text-xs rounded border border-stone-300 text-center font-bold"
                  />
                  <span>q</span>
                </div>
              </div>

              {marketData?.allMandis?.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {marketData.allMandis.map((mandi) => (
                    <div
                      key={mandi.mandiId}
                      className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-content text-sm">{mandi.mandiName}</h4>
                          <span className="text-xs text-content-muted">
                            ({mandi.distanceKm} km away)
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            mandi.trend === "UP" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-content-muted"
                          }`}>
                            {mandi.trend === "UP" ? "▲ Price rising" : "● Stable"}
                          </span>
                        </div>
                        <p className="text-xs text-content-muted mt-0.5">
                          Mandi Price: ₹{mandi.modalPrice}/q · Estimated Transport: ₹{mandi.transportCostPerQuintal}/q
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-[11px] text-content-muted">Net Rate / Quintal</p>
                          <p className="text-sm font-bold text-brand-900">₹{mandi.netPricePerQuintal}/q</p>
                        </div>
                        <div className="text-right pl-3 border-l border-stone-200">
                          <p className="text-[11px] text-content-muted">Total Net Amount</p>
                          <p className="text-sm font-bold text-content">₹{mandi.netPayout?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-stone-300 mb-2">storefront</span>
                  <p className="text-sm text-content-muted">No mandi price data available for {selectedCrop} in this region.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
