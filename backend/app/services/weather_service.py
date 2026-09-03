from datetime import datetime, timezone, timedelta
import logging
import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger("fasalai.weather")

class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        # In-memory cache: key -> {"data": dict, "fetched_at": datetime}
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.CACHE_TTL_SECONDS = 900       # 15 minutes fresh window
        self.STALE_GRACE_SECONDS = 7200    # 2 hours stale-while-offline grace window

    def _get_cache_key(self, district: str, lat: float, lon: float) -> str:
        dist_key = district.lower().strip() if district else "default"
        return f"{dist_key}_{round(lat, 2)}_{round(lon, 2)}"

    async def get_forecast(
        self,
        latitude: float = 20.1472,
        longitude: float = 74.2257,
        district: str = "Nashik"
    ) -> Dict[str, Any]:
        """
        Fetches authentic OpenWeather 5-day agrometeorological forecast.
        Implements strict provenance, in-memory TTL caching, honest STALE
        indicators on upstream degradation, and explicit UNAVAILABLE states.
        NEVER manufactures fake or hardcoded temperature values.
        """
        now = datetime.now(timezone.utc)
        cache_key = self._get_cache_key(district, latitude, longitude)
        cached_entry = self._cache.get(cache_key)

        # 1. If we have fresh cached data (< 15 mins), serve it immediately
        if cached_entry:
            age_sec = (now - cached_entry["fetched_at"]).total_seconds()
            if age_sec < self.CACHE_TTL_SECONDS:
                data = dict(cached_entry["data"])
                data["age_minutes"] = max(0, int(age_sec / 60))
                data["status"] = "LIVE"
                data["is_live"] = True
                data["is_stale"] = False
                return data

        # 2. Attempt live OpenWeather API call if key is configured
        if self.api_key and len(self.api_key) >= 16 and not self.api_key.startswith("your-"):
            try:
                query = f"q={district},IN" if district else f"lat={latitude}&lon={longitude}"
                url = f"https://api.openweathermap.org/data/2.5/forecast?{query}&appid={self.api_key}&units=metric"

                async with httpx.AsyncClient(timeout=4.5) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        raw = resp.json()
                        current = raw["list"][0]
                        city_data = raw.get("city", {})
                        city_name = city_data.get("name", district)
                        tz_offset_sec = city_data.get("timezone", 19800) # Default to IST +05:30
                        local_tz = timezone(timedelta(seconds=tz_offset_sec))

                        daily_forecasts = []
                        seen_days = set()
                        for item in raw.get("list", []):
                            dt_unix = item.get("dt", 0)
                            local_dt = datetime.fromtimestamp(dt_unix, local_tz)
                            date_str = local_dt.strftime("%b %d")
                            day_name = local_dt.strftime("%a")

                            if date_str not in seen_days and len(daily_forecasts) < 5:
                                seen_days.add(date_str)
                                cond = item["weather"][0]["main"]
                                icon = (
                                    "wb_sunny" if ("Clear" in cond or "Sun" in cond)
                                    else "cloud" if "Cloud" in cond
                                    else "rainy"
                                )
                                daily_forecasts.append({
                                    "day": "Today" if len(daily_forecasts) == 0 else day_name,
                                    "date": date_str,
                                    "tempMax": round(item["main"]["temp_max"]),
                                    "tempMin": round(item["main"]["temp_min"]),
                                    "condition": cond,
                                    "rainProb": int(item.get("pop", 0) * 100),
                                    "icon": icon
                                })

                        wind_speed_km = round(current["wind"]["speed"] * 3.6, 1)
                        humidity = current["main"]["humidity"]
                        spray_ok = wind_speed_km < 15.0 and humidity < 75
                        current_temp = round(current["main"]["temp"])
                        rain_prob = int(current.get("pop", 0) * 100)

                        result = {
                            "location": f"{city_name}, Maharashtra",
                            "currentTemp": current_temp,
                            "condition": current["weather"][0]["main"],
                            "description": current["weather"][0]["description"].title(),
                            "humidity": humidity,
                            "windSpeedKm": wind_speed_km,
                            "rainProbability": rain_prob,
                            "spraySuitability": "Ideal" if spray_ok else "Moderate / High Wind",
                            "irrigationAdvice": (
                                "Reduce irrigation; precipitation expected." if rain_prob >= 50
                                else "Safe to irrigate. Maintain scheduled morning watering cycle."
                            ),
                            "forecast": daily_forecasts,
                            # Provenance metadata
                            "source": "OpenWeather",
                            "source_url": "https://openweathermap.org",
                            "fetched_at": now.isoformat(),
                            "data_timestamp": datetime.fromtimestamp(current.get("dt", 0), timezone.utc).isoformat(),
                            "status": "LIVE",
                            "is_live": True,
                            "is_stale": False,
                            "age_minutes": 0,
                            "timezoneOffset": tz_offset_sec
                        }

                        # Save to cache
                        self._cache[cache_key] = {
                            "data": result,
                            "fetched_at": now
                        }
                        return result
                    else:
                        logger.warning(f"OpenWeather returned non-200 status {resp.status_code}")
            except Exception as e:
                logger.warning(f"OpenWeather request exception: {e}")

        # 3. Upstream failed or unconfigured: Check if we have stale cached data within grace period
        if cached_entry:
            age_sec = (now - cached_entry["fetched_at"]).total_seconds()
            if age_sec <= self.STALE_GRACE_SECONDS:
                stale_data = dict(cached_entry["data"])
                stale_data["status"] = "STALE"
                stale_data["is_live"] = False
                stale_data["is_stale"] = True
                stale_data["age_minutes"] = max(1, int(age_sec / 60))
                stale_data["warning"] = f"Upstream provider unreachable. Displaying cached readings from {stale_data['age_minutes']}m ago."
                return stale_data

        # 4. Zero cache or cache expired beyond 2 hours: Return explicit UNAVAILABLE state.
        # NEVER manufacture fake temperatures or simulated weather.
        return {
            "location": f"{district}, Maharashtra",
            "currentTemp": None,
            "condition": "Unavailable",
            "description": "Weather data currently unavailable from upstream provider",
            "humidity": None,
            "windSpeedKm": None,
            "rainProbability": None,
            "spraySuitability": "Unknown (Weather Unavailable)",
            "irrigationAdvice": "Unable to compute weather-dependent irrigation advice.",
            "forecast": [],
            # Provenance metadata
            "source": "OpenWeather",
            "source_url": "https://openweathermap.org",
            "fetched_at": None,
            "data_timestamp": None,
            "status": "UNAVAILABLE",
            "is_live": False,
            "is_stale": False,
            "age_minutes": None,
            "error": "Upstream weather service unavailable or unconfigured. Please retry shortly."
        }

weather_service = WeatherService()
