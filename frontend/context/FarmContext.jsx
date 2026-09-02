"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const FarmContext = createContext();

const DEFAULT_FARM_DATA = {
  farmName: "Patil Organic Farm",
  acreage: 3.5,
  state: "Maharashtra",
  district: "Nashik",
  soilType: "Black Clay Loam",
  soilPh: 6.8,
  irrigationSource: "Drip + Borewell",
  waterAvailability: "Medium",
  currentCrop: "Wheat",
  sowingDate: "2026-08-11",
  sowingDaysAgo: 22,
  organicCertified: true,
  healthScore: 92,
};

export function FarmProvider({ children }) {
  const { user, farmerProfile, session } = useAuth();
  const [farmData, setFarmData] = useState(DEFAULT_FARM_DATA);
  const [loading, setLoading] = useState(false);

  // Load farm parcels from Supabase for current farmer
  const loadFarmData = useCallback(async (farmerId) => {
    if (!isSupabaseConfigured || !supabase || !farmerId) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("farm_parcels")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Farm query error:", error.message);
        return null;
      }

      if (data) {
        // Calculate days since sowing if sowing_date present
        let sowingDays = 22;
        if (data.sowing_date) {
          const diffTime = Math.abs(new Date() - new Date(data.sowing_date));
          sowingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const mapped = {
          id: data.id,
          farmerId: data.farmer_id,
          farmName: data.parcel_name || `${farmerProfile?.name || "My"} Farm`,
          acreage: parseFloat(data.acreage) || 3.5,
          state: farmerProfile?.state || "Maharashtra",
          district: farmerProfile?.district || "Nashik",
          soilType: data.soil_type || "Black Clay Loam",
          soilPh: parseFloat(data.soil_ph) || 6.8,
          irrigationSource: data.irrigation_source || "Drip + Borewell",
          waterAvailability: data.water_availability || "Medium",
          currentCrop: data.current_crop || "Wheat",
          sowingDate: data.sowing_date || "2026-08-11",
          sowingDaysAgo: sowingDays,
          organicCertified: true,
          healthScore: 92,
        };
        setFarmData((prev) => ({ ...prev, ...mapped }));
        return mapped;
      }
    } catch (err) {
      console.warn("Failed to load farm parcel from Supabase:", err);
    } finally {
      setLoading(false);
    }
    return null;
  }, [farmerProfile]);

  useEffect(() => {
    if (farmerProfile?.id && !farmerProfile.isDemo) {
      loadFarmData(farmerProfile.id);
    } else {
      const savedDemoFarm = localStorage.getItem("fasalai_demo_farm");
      if (savedDemoFarm) {
        try {
          setFarmData((prev) => ({ ...prev, ...JSON.parse(savedDemoFarm) }));
        } catch {}
      }
    }
  }, [farmerProfile, loadFarmData]);

  const updateFarm = (newProps) => {
    setFarmData((prev) => {
      const updated = { ...prev, ...newProps };
      if (!isSupabaseConfigured || user?.isDemo) {
        localStorage.setItem("fasalai_demo_farm", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const saveFarmParcel = async (parcelProps) => {
    const combined = { ...farmData, ...parcelProps };
    updateFarm(combined);

    if (!isSupabaseConfigured || !supabase || !farmerProfile?.id || farmerProfile.isDemo) {
      localStorage.setItem("fasalai_demo_farm", JSON.stringify(combined));
      return combined;
    }

    try {
      setLoading(true);
      const payload = {
        farmer_id: farmerProfile.id,
        parcel_name: combined.farmName || "Main Field",
        acreage: parseFloat(combined.acreage) || 3.5,
        soil_type: combined.soilType || "Black Clay Loam",
        soil_ph: parseFloat(combined.soilPh) || 6.8,
        irrigation_source: combined.irrigationSource || "Drip + Borewell",
        water_availability: combined.waterAvailability || "Medium",
        current_crop: combined.currentCrop || "Wheat",
        sowing_date: combined.sowingDate || new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("farm_parcels")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to save farm parcel to Supabase:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FarmContext.Provider value={{ farmData, updateFarm, saveFarmParcel, loadFarmData, loading }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    return {
      farmData: DEFAULT_FARM_DATA,
      updateFarm: () => {},
      saveFarmParcel: async () => {},
      loadFarmData: async () => {},
      loading: false,
    };
  }
  return context;
}
