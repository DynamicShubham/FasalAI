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
    Calls Groq / Grok API with structured decision engine context or falls back gracefully
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

    api_key = settings.GROK_API_KEY
    if api_key and not api_key.startswith("your-"):
        # Auto-detect Groq vs xAI
        if api_key.startswith("gsk_"):
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            model = "qwen/qwen3.8-27b"
        else:
            endpoint = settings.GROK_API_URL
            model = settings.GROK_MODEL

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "FasalAI/1.0"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": AGRICULTURE_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 450
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"AI API returned status {resp.status_code}: {resp.text[:200]}")
        except httpx.TimeoutException:
            logger.warning("AI API timed out, using fallback advisory response.")
        except Exception as e:
            logger.warning(f"AI API error ({e}), using fallback advisory response.")

    # Rule-grounded deterministic agricultural fallback
    return get_rule_grounded_advice(user_query, context_data, language)

def get_rule_grounded_advice(
    query: str,
    context: Optional[Dict[str, Any]],
    language: str
) -> str:
    """Deterministic, high-fidelity agronomic advice when AI API is unreachable."""
    q = query.lower()
    
    if "spray" in q or "pesticide" in q or "insecticide" in q or "dawa" in q or "फवारणी" in q:
        if language == "Hindi":
            return (
                "आज की सिफारिश: दोपहर 4:30 बजे के बाद जब हवा शांत हो (15 किमी/घंटा से कम) तभी छिड़काव करें। "
                "यदि बारिश की संभावना 50% से अधिक है, तो छिड़काव टालें ताकि दवा न धुले। "
                "कीटनाशक के साथ स्टीकर (चिपको) का उपयोग अवश्य करें।"
            )
        elif language == "Marathi":
            return (
                "आजचा सल्ला: दुपारी 4:30 नंतर वारा शांत असतानाच (15 किमी/तास पेक्षा कमी) फवारणी करा. "
                "पावसाची शक्यता असल्यास फवारणी पुढे ढकला. "
                "औषधासोबत स्टिकरचा वापर करा जेणेकरून औषध पानांवर टिकून राहील."
            )
        return (
            "Spray Advisory: Perform spraying strictly in late afternoon (after 4:30 PM) under calm wind conditions (<15 km/h). "
            "If rain probability exceeds 50%, postpone application to prevent chemical runoff. "
            "Always mix an agricultural wetting agent/sticker for uniform leaf adhesion."
        )

    if "water" in q or "irrigation" in q or "pani" in q or "पानी" in q or "पाणी" in q:
        if language == "Hindi":
            return (
                "सिंचाई सलाह: आपके खेत की काली चिकनी मिट्टी में नमी धारण क्षमता अच्छी है। "
                "सुबह 6:00 से 9:00 बजे के बीच ड्रिप सिंचाई चलाएं। "
                "गेहूं के लिए सीआरआई (ताज जड़ निर्माण) अवस्था में हल्की सिंचाई अत्यंत महत्वपूर्ण है।"
            )
        elif language == "Marathi":
            return (
                "पाणी व्यवस्थापन: तुमच्या शेतातील काळ्या जमिनीत ओलावा टिकून राहतो. "
                "सकाळी 6:00 ते 9:00 या वेळेत ठिबक सिंचन सुरू करा. "
                "गव्हाच्या मुळांच्या वाढीच्या काळात हलके पाणी देणे फायदेशीर ठरेल."
            )
        return (
            "Irrigation Advisory: Your Black Clay Loam retains moisture well. "
            "Schedule drip irrigation in the early morning (6:00 AM – 9:00 AM) to minimize evapotranspiration losses. "
            "For current stage, maintain uniform topsoil moisture without waterlogging root zones."
        )

    if "mandi" in q or "market" in q or "price" in q or "bhav" in q or "भाव" in q:
        if language == "Hindi":
            return (
                "मंडी विश्लेषण: पिंपलगांव बसवंत और लासलगांव मंडी में आज आवक और मांग मजबूत है। "
                "परिवहन लागत काटने के बाद भी आपको नजदीकी मंडी की तुलना में 150-200 रुपये प्रति क्विंटल अधिक शुद्ध लाभ मिल सकता है।"
            )
        elif language == "Marathi":
            return (
                "बाजारभाव सल्ला: पिंपळगाव बसवंत आणि लासलगाव बाजारपेठेत आज कांदा व गव्हाचे भाव चांगले आहेत. "
                "वाहतूक खर्च वजा जाता तुम्हाला अधिक नफा मिळू शकेल."
            )
        return (
            "Mandi Intelligence: Current arrivals indicate strong demand at regional APMCs. "
            "After accounting for distance-based transport costs, net realization is optimized at higher-volume mandis. Check the Mandi section for real-time rates."
        )

    # General Greeting / Default
    if language == "Hindi":
        return (
            "नमस्ते! मैं आपका फसल-एआई (FasalAI) कृषि साथी हूँ। "
            "मैं आपकी फसल, मौसम, सिंचाई, खाद-दवा के छिड़काव और मंडी भाव के बारे में सटीक जानकारी दे सकता हूँ। "
            "आप मुझसे अपनी भाषा में कोई भी सवाल पूछ सकते हैं।"
        )
    elif language == "Marathi":
        return (
            "नमस्कार! मी तुमचा फसल-एआय (FasalAI) शेती मित्र आहे. "
            "मी तुमच्या पिकाचे आरोग्य, हवामान, खत-औषध फवारणी आणि बाजारभावाबाबत अचूक मार्गदर्शन करू शकतो. "
            "तुम्ही मला कोणताही प्रश्न विचारू शकता."
        )
    return (
        "Namaste! I am your FasalAI Field Advisor. "
        "I provide personalized guidance on standing crop health, irrigation schedules, spray timing, and optimal mandi realizations based on your specific parcel parameters. "
        "How can I assist your farm today?"
    )
