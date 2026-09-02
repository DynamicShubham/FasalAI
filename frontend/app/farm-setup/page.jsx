"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFarm } from "../../context/FarmContext";

export default function FarmSetupPage() {
  const router = useRouter();
  const { farmData, updateFarm } = useFarm();

  const [acreage, setAcreage] = useState(farmData.acreage || 3.5);
  const [soilType, setSoilType] = useState(farmData.soilType || "Black Clay Loam");
  const [irrigation, setIrrigation] = useState(farmData.irrigationSource || "Drip + Borewell");
  const [waterAvailability, setWaterAvailability] = useState(farmData.waterAvailability || "Medium");
  const [currentCrop, setCurrentCrop] = useState(farmData.currentCrop || "Wheat");

  const soils = [
    { id: "Black Clay Loam", label: "Black Soil / Regur", desc: "Moisture retentive, rich in clay" },
    { id: "Alluvial", label: "Alluvial Loam", desc: "Fertile, ideal for wheat & paddy" },
    { id: "Red Sandy Loam", label: "Red / Sandy Soil", desc: "Well-drained, suitable for pulses" },
    { id: "Laterite", label: "Laterite Soil", desc: "Porous, acidic, suited for plantations" },
  ];

  const irrigationOptions = ["Drip + Borewell", "Canal Water", "Sprinkler", "Open Well / Tubewell", "Rainfed Only"];

  const crops = ["Wheat", "Rice / Paddy", "Cotton", "Soybean", "Mustard", "Chickpea / Gram", "Tomato", "Potato", "Onion"];

  const handleSaveAndEnter = () => {
    updateFarm({
      acreage: parseFloat(acreage),
      soilType,
      irrigationSource: irrigation,
      waterAvailability,
      currentCrop,
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-6">
        {/* Title */}
        <div className="pb-3 border-b border-stone-100">
          <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
            Step 2 of 2 · Farm Configuration
          </span>
          <h1 className="font-display text-2xl font-bold text-content mt-1">
            Configure Your Land & Soil
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Crop recommendations and water schedules are calculated from these details.
          </p>
        </div>

        {/* Acreage Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-content">Total Land Area</label>
            <span className="text-sm font-bold text-brand-900 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
              {acreage} Acres
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="25"
            step="0.5"
            value={acreage}
            onChange={(e) => setAcreage(e.target.value)}
            className="w-full accent-brand-900 h-2 bg-stone-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-content-muted">
            <span>0.5 Acre</span>
            <span>5 Acres</span>
            <span>25+ Acres</span>
          </div>
        </div>

        {/* Soil Type Selection Tiles */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-content">Primary Soil Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {soils.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSoilType(s.id)}
                className={`p-3.5 rounded-xl flex items-start gap-3 text-left border transition-colors ${
                  soilType === s.id
                    ? "bg-brand-50 border-brand-800 text-brand-900"
                    : "bg-white border-stone-200 text-content hover:bg-stone-50"
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[11px] text-content-muted mt-0.5">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Irrigation Source */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-content">Irrigation System</label>
          <div className="flex flex-wrap gap-2">
            {irrigationOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIrrigation(opt)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  irrigation === opt
                    ? "bg-brand-900 text-white border-brand-900 font-semibold"
                    : "bg-stone-50 text-content border-stone-200 hover:bg-stone-100"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Current Standing Crop */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-content">Current Standing Crop</label>
          <div className="flex flex-wrap gap-1.5">
            {crops.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrentCrop(c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                  currentCrop === c
                    ? "bg-brand-50 border-brand-800 text-brand-900 font-semibold"
                    : "bg-white border-stone-200 text-content hover:bg-stone-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSaveAndEnter}
          className="w-full py-3.5 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm rounded-full shadow-sm transition-colors flex items-center justify-center gap-1.5 mt-2"
        >
          <span>Save Farm & Open Dashboard</span>
          <span className="material-symbols-outlined text-base">check</span>
        </button>
      </div>
    </div>
  );
}
