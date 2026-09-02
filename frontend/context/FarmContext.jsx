"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const EMPTY_FARM_DATA = {
  id: null,
  farmerId: null,
  farmName: "",
  acreage: 0,
  state: "",
  district: "",
  soilType: "",
  soilPh: 6.8,
  irrigationSource: "",
  waterAvailability: "",
  currentCrop: "",
  sowingDate: "",
  sowingDaysAgo: 0,
  hasFarm: false,
};

const FarmContext = createContext();

export function FarmProvider({ children }) {
  const { farmerProfile } = useAuth();
  const [farmData, setFarmData] = useState(EMPTY_FARM_DATA);
  const [loading, setLoading] = useState(false);

  // Load farm parcels from Supabase for current authenticated farmer
  const loadFarmData = useCallback(async (farmerId) => {
    if (!isSupabaseConfigured || !supabase || !farmerId) {
      setFarmData(EMPTY_FARM_DATA);
      return null;
    }
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
        setFarmData(EMPTY_FARM_DATA);
        return null;
      }

      if (data) {
        let sowingDays = 0;
        if (data.sowing_date) {
          const diffTime = Math.abs(new Date() - new Date(data.sowing_date));
          sowingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const mapped = {
          id: data.id,
          farmerId: data.farmer_id,
          farmName: data.parcel_name || "Primary Farm",
          acreage: parseFloat(data.acreage) || 0,
          state: farmerProfile?.state || "",
          district: farmerProfile?.district || "",
          soilType: data.soil_type || "",
          soilPh: parseFloat(data.soil_ph) || 6.8,
          irrigationSource: data.irrigation_source || "",
          waterAvailability: data.water_availability || "",
          currentCrop: data.current_crop || "",
          sowingDate: data.sowing_date || "",
          sowingDaysAgo: sowingDays,
          hasFarm: true,
        };
        setFarmData(mapped);
        return mapped;
      } else {
        setFarmData(EMPTY_FARM_DATA);
      }
    } catch (err) {
      console.warn("Failed to load farm parcel from Supabase:", err);
      setFarmData(EMPTY_FARM_DATA);
    } finally {
      setLoading(false);
    }
    return null;
  }, [farmerProfile]);

  useEffect(() => {
    if (farmerProfile?.id) {
      loadFarmData(farmerProfile.id);
    } else {
      setFarmData(EMPTY_FARM_DATA);
    }
  }, [farmerProfile, loadFarmData]);

  const updateFarm = (newProps) => {
    setFarmData((prev) => ({ ...prev, ...newProps }));
  };

  const saveFarmParcel = async (parcelProps) => {
    if (!isSupabaseConfigured || !supabase || !farmerProfile?.id) {
      throw new Error("Farmer profile required to save farm parcels.");
    }

    try {
      setLoading(true);
      const payload = {
        farmer_id: farmerProfile.id,
        parcel_name: parcelProps.farmName || "Primary Farm",
        acreage: parseFloat(parcelProps.acreage) || 1.0,
        soil_type: parcelProps.soilType || "Alluvial",
        soil_ph: parseFloat(parcelProps.soilPh) || 6.8,
        irrigation_source: parcelProps.irrigationSource || "Borewell",
        water_availability: parcelProps.waterAvailability || "Medium",
        current_crop: parcelProps.currentCrop || "Wheat",
        sowing_date: parcelProps.sowingDate || new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("farm_parcels")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      let sowingDays = 0;
      if (data.sowing_date) {
        const diffTime = Math.abs(new Date() - new Date(data.sowing_date));
        sowingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      const formatted = {
        id: data.id,
        farmerId: data.farmer_id,
        farmName: data.parcel_name,
        acreage: parseFloat(data.acreage),
        state: farmerProfile?.state || "",
        district: farmerProfile?.district || "",
        soilType: data.soil_type,
        soilPh: parseFloat(data.soil_ph),
        irrigationSource: data.irrigation_source,
        waterAvailability: data.water_availability,
        currentCrop: data.current_crop,
        sowingDate: data.sowing_date,
        sowingDaysAgo: sowingDays,
        hasFarm: true,
      };
      setFarmData(formatted);
      return formatted;
    } catch (err) {
      console.error("Failed to save farm parcel to Supabase:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farmData,
        hasFarm: Boolean(farmData?.id && farmData?.acreage > 0),
        updateFarm,
        saveFarmParcel,
        loadFarmData,
        loading,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    return {
      farmData: EMPTY_FARM_DATA,
      hasFarm: false,
      updateFarm: () => {},
      saveFarmParcel: async () => {},
      loadFarmData: async () => {},
      loading: false,
    };
  }
  return context;
}
