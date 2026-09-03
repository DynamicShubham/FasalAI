"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { fetchApi } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetchApi("/alerts/");
        setAlerts(res.alerts || []);
      } catch (e) {
        console.error("Alerts error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header */}
        <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              {t.alertsTitle || "Field Alerts & Notices"}
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              {t.alertsDesc || "Important weather, pest, and market price updates for your area"}
            </p>
          </div>
          <span className="text-xs font-semibold bg-stone-100 px-3 py-1 rounded-full text-content-muted">
            {alerts.length} {t.activeAlerts || "Active"}
          </span>
        </section>

        {/* Alerts List */}
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200/80 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    a.severity === "CRITICAL"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : a.severity === "WARNING"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {a.type === "WEATHER" ? "thunderstorm" : a.type === "DISEASE_RISK" ? "bug_report" : "trending_up"}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-content text-sm">{a.title}</h3>
                    <span className="text-[11px] text-content-muted">{a.timestamp}</span>
                  </div>
                  <p className="text-xs text-content-muted mt-0.5 leading-relaxed max-w-lg">
                    {a.message}
                  </p>
                </div>
              </div>

              <Link
                href={a.type === "DISEASE_RISK" ? "/scanner" : a.type === "MARKET" ? "/market" : "/dashboard"}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-brand-900 font-semibold text-xs rounded-xl border border-stone-200 transition-colors whitespace-nowrap self-end sm:self-center"
              >
                {a.action} →
              </Link>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
