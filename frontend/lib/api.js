import { supabase, isSupabaseConfigured } from "./supabase";

const DEFAULT_PROD_API = "https://fasalai-backend-s9k8.onrender.com";

let rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
if (!rawApiUrl) {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    rawApiUrl = DEFAULT_PROD_API;
  } else {
    rawApiUrl = "http://127.0.0.1:8000";
  }
}

// Strip any accidental trailing /api/v1, /api/v, or /api prefix to get the clean host origin
rawApiUrl = rawApiUrl.replace(/\/api\/v\d*$/, "").replace(/\/api\/?$/, "").replace(/\/+$/, "");

// Always append canonical /api/v1 prefix
const API_BASE_URL = `${rawApiUrl}/api/v1`;

export async function fetchApi(endpoint, options = {}, retries = 1) {
  try {
    let authHeaders = {};
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }
      } catch (e) {
        // Continue unauthenticated
      }
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller ? controller.signal : undefined,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    const data = await res.json();
    // Mark as live data
    if (typeof data === "object" && data !== null) {
      data._isLiveData = true;
    }
    return data;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[FasalAI API] Retrying ${endpoint} (waking up server)...`);
      await new Promise((r) => setTimeout(r, 1500));
      return fetchApi(endpoint, options, retries - 1);
    }
    console.warn(`[FasalAI API] Falling back for ${endpoint}:`, err.message);
    return getFallbackData(endpoint);
  }
}

export async function scanCropImage(base64Image, cropHint = "") {
  try {
    const res = await fetch(`${API_BASE_URL}/vision/scan-frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64Image, cropHint }),
    });
    if (res.ok) {
      const data = await res.json();
      data._isLiveData = true;
      return data;
    }
  } catch (e) {
    console.warn("[FasalAI Scan] Backend analysis error:", e.message);
  }
  return {
    success: false,
    error: "Leaf diagnostic service is currently unreachable. Please verify server connection.",
    diseaseName: null,
    confidenceScore: 0,
  };
}

export async function sendChatMessage(message, language = "English", contextData = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language, contextData }),
    });
    if (res.ok) {
      const data = await res.json();
      data._isLiveData = true;
      return data;
    }
  } catch (e) {
    console.warn("[FasalAI Chat] Advisory connection error.");
  }
  return {
    reply: "I am unable to reach the agricultural advisory server at the moment. Please check your internet connection and try again.",
    language,
    poweredBy: "FasalAI Advisory",
    isOfflineFallback: true,
  };
}

function getFallbackData(endpoint) {
  // Safe empty response without any fake farmer or location data
  return {
    isOfflineFallback: true,
    hasProfile: false,
    profile: null,
    crops: [],
    schemes: [],
    tasks: [],
    allMandis: [],
    alerts: [],
    error: "Service temporarily unreachable",
  };
}
