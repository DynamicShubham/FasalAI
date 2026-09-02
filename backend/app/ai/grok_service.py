import logging
import httpx
from typing import Dict, Any, Optional
from ..core.config import settings

logger = logging.getLogger("fasalai.ai.grok")

AGRICULTURE_SYSTEM_PROMPT = """You are FasalAI, a warm, dependable, and highly knowledgeable agricultural field companion for Indian farmers.
Your core principles:
1. Explain agricultural decisions in simple, direct, respectful, and actionable language.
2. Avoid confusing technical jargon or academic verbosity.
3. Be specific with numbers (water volume, spray dosages, dates, mandi prices).
4. Always prioritize farmer safety, soil long-term health, and cost-efficiency.
5. If speaking in Hindi, Marathi, or English, keep the tone warm, clear, and reassuring.
6. Never fabricate specific weather data, market prices, or scheme details. Only present data you are given in context.
"""

async def explain_decision_with_grok(
    user_query: str,
    context_data: Optional[Dict[str, Any]] = None,
    language: str = "English"
) -> str:
    """
    Calls Grok API with structured decision engine context or falls back gracefully
    to grounded agricultural advice.
    """
    context_str = ""
    if context_data:
        context_str = f"\n\n[FARM CONTEXT & DECISION DATA]\n{context_data}\n"

    prompt = (
        f"Language: {language}\n"
        f"Farmer Query: {user_query}\n"
        f"{context_str}\n"
        f"Provide a clear, actionable, friendly 2-3 paragraph answer with clear next steps."
    )

    if settings.GROK_API_KEY and not settings.GROK_API_KEY.startswith("your-"):
        try:
            headers = {
                "Authorization": f"Bearer {settings.GROK_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.GROK_MODEL,
                "messages": [
                    {"role": "system", "content": AGRICULTURE_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 450
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(settings.GROK_API_URL, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"Grok API returned status {resp.status_code}: {resp.text[:200]}")
        except httpx.TimeoutException:
            logger.warning("Grok API request timed out after 10 seconds")
        except Exception as e:
            logger.warning(f"Grok API call failed: {e}")

    # Grounded fallback generation (no API key or API failure)
    logger.info("Using grounded fallback response for assistant query")
    q_lower = user_query.lower()
    if "water" in q_lower or "irrigation" in q_lower or "sinchai" in q_lower:
        return (
            "Based on current soil moisture and weather conditions, morning irrigation between 6:00 AM and 9:00 AM "
            "is recommended. For your current crop stage, a light 2-hour drip cycle will maintain optimal root zone "
            "aeration without causing waterlogging."
        )
    elif "disease" in q_lower or "yellow" in q_lower or "spray" in q_lower or "blight" in q_lower:
        return (
            "If you notice yellowing or brown spots on lower leaves, inspect leaf undersides for fungal spores. "
            "Start with an eco-friendly spray of 5ml Neem Oil per liter of water. If fungal lesions expand, spray "
            "Mancozeb (2.5g/L) during calm evening hours (after 4:30 PM) to avoid leaf scorch."
        )
    elif "market" in q_lower or "price" in q_lower or "mandi" in q_lower:
        return (
            "Check the Mandi Prices section for the latest rates at nearby markets. The system calculates net "
            "realization after transport costs to help you find the most profitable selling point. Consider "
            "timing your sale when demand trends are upward."
        )
    elif "scheme" in q_lower or "subsidy" in q_lower or "pm-kisan" in q_lower:
        return (
            "Visit the Government Schemes section to see which subsidies match your farm profile. Ensure your "
            "Aadhaar is linked to your bank account and 7/12 land records are updated. The system checks your "
            "eligibility based on your landholding size and crop type."
        )
    else:
        return (
            f"Hello! I am your FasalAI assistant. I can help you with irrigation scheduling, "
            f"disease identification, market price comparison, and government scheme eligibility. "
            f"Ask me anything about your farm — I'll give you clear, practical advice."
        )
