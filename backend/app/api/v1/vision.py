import logging
from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import base64
from ...vision.detector import detector

logger = logging.getLogger("fasalai.api.vision")

router = APIRouter()

class ScanBase64Request(BaseModel):
    imageBase64: str
    cropHint: Optional[str] = "Tomato"

@router.post("/scan-frame")
def scan_frame(payload: ScanBase64Request):
    try:
        # Strip data URL prefix if present
        raw_b64 = payload.imageBase64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
        
        if not raw_b64 or len(raw_b64) < 10:
            return detector.detect_from_image_bytes(b"", crop_hint=payload.cropHint or "")
        
        image_bytes = base64.b64decode(raw_b64)
        result = detector.detect_from_image_bytes(image_bytes, crop_hint=payload.cropHint or "")
        return result
    except Exception as e:
        logger.error(f"Scan frame processing error: {e}")
        return {
            "success": False,
            "isDemoMode": True,
            "error": "Failed to process scan request. Please try again.",
            "diseaseName": None,
            "confidenceScore": 0,
        }

@router.post("/upload")
async def upload_image(file: UploadFile = File(...), cropHint: Optional[str] = Form("")):
    try:
        contents = await file.read()
        result = detector.detect_from_image_bytes(contents, crop_hint=cropHint or "")
        return result
    except Exception as e:
        logger.error(f"Upload processing error: {e}")
        return {
            "success": False,
            "isDemoMode": True,
            "error": "Failed to process uploaded image. Please try again.",
            "diseaseName": None,
            "confidenceScore": 0,
        }
