"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFarm } from "../../context/FarmContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { user, saveFarmerProfile } = useAuth();
  const { updateFarm } = useFarm();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    state: user?.state || "Maharashtra",
    district: user?.district || "",
    experienceYears: user?.experienceYears || "5",
    primaryLanguage: language || "English",
  });

  useEffect(() => {
    if (user?.name && !formData.name) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || "",
        state: user.state || "Maharashtra",
        district: user.district || "",
      }));
    }
  }, [user]);

  const nextStep = async () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      setStep(2);
    } else {
      if (!formData.district.trim()) {
        setErrorMsg("Please enter your district or tehsil.");
        return;
      }
      setLoading(true);
      try {
        await saveFarmerProfile({
          name: formData.name,
          phone: formData.phone,
          state: formData.state,
          district: formData.district,
          location: `${formData.district}, ${formData.state}`,
          experienceYears: formData.experienceYears,
          language: formData.primaryLanguage,
        });
        updateFarm({
          state: formData.state,
          district: formData.district,
          location: `${formData.district}, ${formData.state}`,
        });
        router.push("/farm-setup");
      } catch (err) {
        console.error("Onboarding profile save error:", err);
        setErrorMsg(err.message || "Failed to save profile. Continuing to farm setup...");
        setTimeout(() => router.push("/farm-setup"), 1500);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white p-7 md:p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-6">
        {/* Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <span className="text-xs font-bold text-brand-900 dark:text-emerald-400 uppercase tracking-wider">
            Step {step} of 2 · Farmer Profile
          </span>
          <div className="flex gap-1">
            <div className={`w-6 h-1.5 rounded-full ${step >= 1 ? "bg-brand-900 dark:bg-emerald-500" : "bg-stone-200 dark:bg-stone-800"}`}></div>
            <div className={`w-6 h-1.5 rounded-full ${step >= 2 ? "bg-brand-900 dark:bg-emerald-500" : "bg-stone-200 dark:bg-stone-800"}`}></div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-content">Choose Your Language</h2>
              <p className="text-xs text-content-muted mt-0.5">Select the language you prefer for advisory</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
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
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content mb-1">Mobile Number (Optional)</label>
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
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Haryana">Haryana</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content mb-1">District / Tehsil</label>
                <input
                  type="text"
                  required
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
                  min="0"
                  max="60"
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
          disabled={loading}
          className="w-full py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          <span>{step === 1 ? "Next: Location Details" : "Save Profile & Proceed to Farm Setup"}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
