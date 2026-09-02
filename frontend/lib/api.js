const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[FasalAI API] Falling back for ${endpoint}:`, err.message);
    return getFallbackData(endpoint);
  }
}

export async function scanCropImage(base64Image, cropHint = "Tomato") {
  try {
    const res = await fetch(`${API_BASE_URL}/vision/scan-frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64Image, cropHint }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("[FasalAI Scan] Offline fallback diagnostic used.");
  }
  return {
    success: true,
    diseaseId: "tomato_early_blight",
    diseaseName: "Tomato Early Blight (टमाटर का अगेती झुलसा)",
    crop: "Tomato",
    pathogen: "Alternaria solani (Fungus)",
    severity: "Moderate",
    confidenceScore: 0.94,
    confidencePercentage: "94%",
    symptoms: "Concentric brown rings on lower foliage with yellow halos.",
    organicRemedy: "Apply Neem Oil (5ml/L) or Trichoderma viride (5g/L). Pluck and bury infected bottom leaves.",
    chemicalRemedy: "Mancozeb 75% WP @ 2.5g/L during late afternoon (after 4:30 PM).",
    prevention: "Improve plant spacing for airflow and switch to drip irrigation to prevent splash spore dispersal.",
    boundingBoxes: [{ x: 120, y: 150, width: 340, height: 260, label: "Early Blight", confidence: 0.94 }],
    imageResolution: "640x480"
  };
}

export async function sendChatMessage(message, language = "English", contextData = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language, contextData }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("[FasalAI Chat] Offline fallback used.");
  }
  return {
    reply: "I am actively monitoring your farm conditions in Maharashtra. Your Wheat crop is entering the critical Day 22 Crown Root Initiation (CRI) stage. Ensure a light morning watering cycle, and check for any fungal symptoms on lower foliage before Saturday's predicted rain.",
    language,
    poweredBy: "FasalAI Decision Engine"
  };
}

function getFallbackData(endpoint) {
  if (endpoint.includes("/farmer/profile")) {
    return {
      id: "farmer_demo_1",
      name: "Ramesh Patil",
      phone: "+91 98765 43210",
      state: "Maharashtra",
      district: "Nashik",
      language: "English",
      experienceYears: 14,
      acreage: 3.5,
      soilType: "Black Clay Loam",
      soilPh: 6.8,
      irrigationSource: "Drip + Borewell",
      waterAvailability: "Medium",
      currentCrop: "Wheat",
      sowingDaysAgo: 22
    };
  }
  if (endpoint.includes("/crops/recommendations")) {
    return {
      crops: [
        {
          cropId: "wheat",
          name: "Wheat (गेहूं)",
          category: "Cereal",
          suitabilityScore: 94,
          sustainabilityScore: 84,
          carbonFootprint: "Low",
          waterEfficiency: "Medium",
          growthDurationDays: 120,
          estimatedYieldQuintals: 63.0,
          estimatedCost: 49000,
          estimatedRevenue: 84700,
          estimatedNetProfit: 35700,
          roiPercentage: 72.8,
          mspPerQuintal: 2275,
          currentMandiPrice: 2420,
          reasons: ["Optimal compatibility with your Black Clay Loam soil.", "Adequate drip irrigation available for 450mm requirement."],
          warnings: [],
          tips: "Ensure timely first irrigation at Crown Root Initiation (CRI) stage (21 days after sowing)."
        },
        {
          cropId: "mustard",
          name: "Mustard (सरसों)",
          category: "Oilseed",
          suitabilityScore: 89,
          sustainabilityScore: 88,
          carbonFootprint: "Low",
          waterEfficiency: "Very High",
          growthDurationDays: 110,
          estimatedYieldQuintals: 29.8,
          estimatedCost: 33250,
          estimatedRevenue: 59000,
          estimatedNetProfit: 25750,
          roiPercentage: 77.4,
          mspPerQuintal: 5650,
          currentMandiPrice: 5950,
          reasons: ["Low water requirement fits winter season perfectly.", "High ROI with minimal expenditure on chemical fertilizers."],
          warnings: [],
          tips: "Perform early thinning at 15-20 days after sowing."
        },
        {
          cropId: "chickpea",
          name: "Chickpea / Gram (चना)",
          category: "Pulses",
          suitabilityScore: 86,
          sustainabilityScore: 94,
          carbonFootprint: "Very Low",
          waterEfficiency: "Very High",
          growthDurationDays: 105,
          estimatedYieldQuintals: 31.5,
          estimatedCost: 36750,
          estimatedRevenue: 60900,
          estimatedNetProfit: 24150,
          roiPercentage: 65.7,
          mspPerQuintal: 5440,
          currentMandiPrice: 5800,
          reasons: ["Fixes atmospheric nitrogen into the soil.", "Very high drought tolerance and low pest risk."],
          warnings: [],
          tips: "Nip shoot tips at 30-35 days to encourage lateral branching."
        }
      ]
    };
  }
  if (endpoint.includes("/weather/forecast")) {
    return {
      location: "Nashik, Maharashtra",
      currentTemp: 28,
      condition: "Partly Sunny",
      description: "Clear skies with light breeze",
      humidity: 58,
      windSpeedKm: 9.2,
      rainProbability: 15,
      evapotranspirationMm: 4.2,
      soilMoistureIndex: "62% (Optimal)",
      spraySuitability: "Ideal (Low Wind, No Imminent Rain)",
      irrigationAdvice: "Safe to irrigate. Maintain normal morning watering cycle.",
      forecast: [
        { day: "Today", date: "Sep 2", tempMax: 30, tempMin: 19, condition: "Partly Sunny", rainProb: 15, icon: "wb_sunny" },
        { day: "Thu", date: "Sep 3", tempMax: 31, tempMin: 20, condition: "Sunny", rainProb: 10, icon: "sunny" },
        { day: "Fri", date: "Sep 4", tempMax: 29, tempMin: 19, condition: "Cloudy", rainProb: 40, icon: "cloud" },
        { day: "Sat", date: "Sep 5", tempMax: 27, tempMin: 18, condition: "Light Rain", rainProb: 75, icon: "rainy" },
        { day: "Sun", date: "Sep 6", tempMax: 28, tempMin: 18, condition: "Scattered Clouds", rainProb: 30, icon: "partly_cloudy_day" },
        { day: "Mon", date: "Sep 7", tempMax: 30, tempMin: 19, condition: "Sunny", rainProb: 10, icon: "wb_sunny" },
        { day: "Tue", date: "Sep 8", tempMax: 31, tempMin: 20, condition: "Sunny", rainProb: 5, icon: "sunny" }
      ],
      agriAlerts: [
        { title: "Spraying Window Open", level: "SUCCESS", message: "Calm wind (<10 km/h) and clear skies today." },
        { title: "Rain Alert for Saturday (75%)", level: "INFO", message: "Plan fertilizer top-dressing before Friday evening." }
      ]
    };
  }
  if (endpoint.includes("/market/compare")) {
    return {
      commodity: "Onion",
      quantityQuintals: 20,
      bestMandi: {
        mandiId: "mandi_nashik_pimpalgaon",
        mandiName: "Pimpalgaon Baswant APMC",
        district: "Nashik",
        distanceKm: 34,
        modalPrice: 2280,
        minPrice: 1700,
        maxPrice: 2550,
        trend: "UP",
        arrivalQuintals: 6100,
        transportCostPerQuintal: 65,
        totalTransportCost: 1300,
        grossPayout: 45600,
        netPayout: 44300,
        netPricePerQuintal: 2215
      },
      allMandis: [
        {
          mandiId: "mandi_nashik_pimpalgaon",
          mandiName: "Pimpalgaon Baswant APMC",
          district: "Nashik",
          distanceKm: 34,
          modalPrice: 2280,
          trend: "UP",
          transportCostPerQuintal: 65,
          netPayout: 44300,
          netPricePerQuintal: 2215
        },
        {
          mandiId: "mandi_nashik_lasalgaon",
          mandiName: "Lasalgaon APMC Mandi",
          district: "Nashik",
          distanceKm: 18,
          modalPrice: 2150,
          trend: "UP",
          transportCostPerQuintal: 35,
          netPayout: 42300,
          netPricePerQuintal: 2115
        }
      ],
      recommendationText: "Sell at Pimpalgaon Baswant APMC. Even with 34 km transport, you gain ₹2,000 more net on 20 quintals."
    };
  }
  if (endpoint.includes("/schemes/matched")) {
    return {
      schemes: [
        {
          id: "pm_kisan",
          name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
          type: "Central Government",
          benefit: "₹6,000 per year directly transferred to bank account in 3 installments of ₹2,000.",
          matchScore: 95,
          eligibilityStatus: "Likely Eligible",
          importance: "High",
          documentsRequired: ["Aadhaar Card", "7/12 Land Records", "Bank Passbook"],
          applicationUrl: "https://pmkisan.gov.in"
        },
        {
          id: "pmksy_micro_irrigation",
          name: "PMKSY - Per Drop More Crop (Drip Subsidy)",
          type: "Central + State Scheme",
          benefit: "Up to 55% subsidy for Small & Marginal Farmers on Drip/Sprinkler installations.",
          matchScore: 92,
          eligibilityStatus: "Likely Eligible",
          importance: "High",
          documentsRequired: ["Aadhaar Card", "7/12 & 8-A Extract", "Electricity Bill", "Vendor Quotation"],
          applicationUrl: "https://pmksy.gov.in"
        },
        {
          id: "pmfby_crop_insurance",
          name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
          type: "Central Government",
          benefit: "Comprehensive insurance against natural risks. Farmer premium capped at 1.5% for Rabi.",
          matchScore: 88,
          eligibilityStatus: "Likely Eligible",
          importance: "High",
          documentsRequired: ["Aadhaar Card", "Sowing Certificate", "Bank Passbook"],
          applicationUrl: "https://pmfby.gov.in"
        }
      ]
    };
  }
  if (endpoint.includes("/decisions/daily-plan")) {
    return {
      crop: "Wheat",
      cropAgeDays: 22,
      tasks: [
        {
          id: "task_cri_irrigation",
          priority: "HIGH",
          category: "Critical Stage Irrigation",
          title: "Crown Root Initiation (CRI) Light Irrigation",
          description: "Day 22 critical growth node: Ensure uniform light irrigation to promote deep root development and tillering.",
          timing: "Early Morning (6:00 AM - 9:00 AM)",
          completed: true,
          badgeColor: "primary"
        },
        {
          id: "task_moisture_check",
          priority: "MEDIUM",
          category: "Field Scouting",
          title: "Inspect Soil Moisture at 4-inch Depth",
          description: "Check soil texture in western parcel before next scheduled irrigation cycle.",
          timing: "Late Afternoon",
          completed: false,
          badgeColor: "secondary"
        },
        {
          id: "task_rain_alert",
          priority: "MEDIUM",
          category: "Weather Action",
          title: "Plan Fertilizer Top-Dressing Before Saturday",
          description: "Rain forecasted for Saturday. Complete urea / bio-NPK application 24 hours prior.",
          timing: "Tomorrow Morning",
          completed: false,
          badgeColor: "tertiary"
        }
      ],
      completionRate: "1 / 3 Completed"
    };
  }
  if (endpoint.includes("/alerts")) {
    return {
      alerts: [
        {
          id: "alert_weather_rain",
          type: "WEATHER",
          severity: "WARNING",
          title: "Rain Forecast for Saturday (75% probability)",
          message: "Heavy showers expected across Nashik district. Postpone foliar pesticide spraying until Sunday.",
          timestamp: "10 mins ago",
          action: "Adjust Schedule"
        },
        {
          id: "alert_pest_watch",
          type: "DISEASE_RISK",
          severity: "CRITICAL",
          title: "Yellow Rust Advisory in Neighboring Blocks",
          message: "High humidity has triggered stripe rust reports in adjacent wheat fields. Inspect lower foliage today.",
          timestamp: "2 hours ago",
          action: "Scan Leaf Now"
        }
      ]
    };
  }
  return {};
}
