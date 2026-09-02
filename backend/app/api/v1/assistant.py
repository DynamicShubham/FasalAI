from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ...ai.grok_service import explain_decision_with_grok

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "English"
    contextData: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat_with_assistant(payload: ChatRequest):
    reply = await explain_decision_with_grok(
        user_query=payload.message,
        context_data=payload.contextData,
        language=payload.language or "English"
    )
    return {
        "reply": reply,
        "language": payload.language,
        "poweredBy": "FasalAI Intelligence + Grok AI"
    }
