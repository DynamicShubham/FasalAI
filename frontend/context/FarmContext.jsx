"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchApi } from "../lib/api";

const FarmContext = createContext();

export function FarmProvider({ children }) {
  const [farmData, setFarmData] = useState({
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
    lastSoilTest: "2026-06-15",
    healthScore: 92,
  });

  const updateFarm = (newProps) => {
    setFarmData((prev) => ({ ...prev, ...newProps }));
  };

  return (
    <FarmContext.Provider value={{ farmData, updateFarm }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    return {
      farmData: { acreage: 3.5, soilType: "Black Clay Loam", currentCrop: "Wheat" },
      updateFarm: () => {},
    };
  }
  return context;
}
