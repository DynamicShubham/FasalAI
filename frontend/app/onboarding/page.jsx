"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { setUser } = useAuth();
  const { updateFarm } = useFarm();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    state: "Maharashtra",
    district: "",
    experienceYears: "",
    primaryLanguage: language,
  });

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setUser({
        name: formData.name,
        phone: `+91 ${formData.phone}`,
        state: formData.state,
        district: formData.district,
        isAuthenticated: true,
      });
      updateFarm({
        state: formData.state,
        district: formData.district,
      });
      router.push("/farm-setup");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white p-7 md:p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-6">
        {/* Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
            Step {step} of 2 · Farmer Profile
          </span>
          <div className="flex gap-1">
            <div className={`w-6 h-1.5 rounded-full ${step >= 1 ? "bg-brand-900" : "bg-stone-200"}`}></div>
            <div className={`w-6 h-1.5 rounded-full ${step >= 2 ? "bg-brand-900" : "bg-stone-200"}`}></div>
          </div>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-content">Choose Your Language</h2>
              <p className="text-xs text-content-muted mt-0.5">Select the language you prefer for advisory</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { code: "English", label: "English", sub: "English" },
                { code: "Hindi", label: "हिंदी", sub: "Hindi" },
                { code: "Marathi", label: "मराठी", sub: "Marathi" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setFormData({ ...formData, primaryLanguage: lang.code });
                  }}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-colors ${
                    language === lang.code
                      ? "bg-brand-50 border-brand-900 text-brand-900 font-bold"
                      : "bg-white border-stone-200 text-content hover:bg-stone-50"
                  }`}
                >
                  <span className="text-sm font-bold">{lang.label}</span>
                  <span className="text-[10px] text-content-muted">{lang.sub}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-content mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-4 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-content">Location & Experience</h2>
              <p className="text-xs text-content-muted mt-0.5">Helps connect to your local market mandis and weather</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-content mb-1">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800 cursor-pointer"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Karnataka">Karnataka</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content mb-1">District / Tehsil</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Nashik"
                  className="w-full px-4 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content mb-1">Farming Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={nextStep}
          className="w-full py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>{step === 1 ? "Next: Location Details" : "Proceed to Land Configuration"}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
