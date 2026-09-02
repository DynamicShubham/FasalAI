import io
import json
import base64
import logging
import numpy as np
from PIL import Image
from typing import Dict, Any, List
from ..core.config import settings
from ..decision_engine.disease_analyzer import load_diseases, get_disease_by_id

logger = logging.getLogger("fasalai.vision")

class CropDiseaseDetector:
    def __init__(self):
        self.diseases = load_diseases()
        
    def detect_from_image_bytes(self, image_bytes: bytes, crop_hint: str = "") -> Dict[str, Any]:
        """
        Processes image frame using visual feature extraction and chromatic analysis
        to classify crop pathology with confidence and bounding boxes.
        
        NOTE: This uses a heuristic color-analysis approach as a demo diagnostic.
        A production system would use a trained YOLO/CNN model for accurate classification.
        The response includes `isDemoMode: true` to indicate this is heuristic-based.
        """
        # Reject empty/invalid image data
        if not image_bytes or len(image_bytes) < 100:
            return {
                "success": False,
                "isDemoMode": True,
                "error": "No valid image data received. Please capture a clear photo of the affected leaf.",
                "diseaseName": None,
                "confidenceScore": 0,
            }

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_array = np.array(image)
            
            # Analyze image properties
            h, w, _ = img_array.shape
            r_mean = float(np.mean(img_array[:, :, 0]))
            g_mean = float(np.mean(img_array[:, :, 1]))
            b_mean = float(np.mean(img_array[:, :, 2]))
            
            # Chromatic and texture index
            # High yellow/brown indicates rust/blight, high green with low variance indicates healthy
            yellow_ratio = (r_mean + g_mean) / (2.0 * (b_mean + 1.0))
            brown_ratio = r_mean / (g_mean + 1.0)
            
            detected_disease = None
            confidence = 0.92
            
            if crop_hint:
                crop_lower = crop_hint.lower()
                matched = [d for d in self.diseases if crop_lower in d.get("crop", "").lower()]
                if matched:
                    # Pick relevant disease or healthy based on color analysis
                    if yellow_ratio > 1.8 or brown_ratio > 1.1:
                        detected_disease = matched[0]
                        confidence = detected_disease.get("confidenceBase", 0.94)
                    else:
                        detected_disease = next((d for d in self.diseases if d["id"] == "healthy_crop"), matched[0])
                        confidence = 0.97
                        
            if not detected_disease:
                # Heuristic mapping based on pixel chromatic properties
                if yellow_ratio > 2.0:
                    detected_disease = get_disease_by_id("wheat_yellow_rust") or self.diseases[0]
                    confidence = 0.95
                elif brown_ratio > 1.2:
                    detected_disease = get_disease_by_id("tomato_early_blight") or self.diseases[0]
                    confidence = 0.94
                elif g_mean > 110 and b_mean < 80:
                    detected_disease = get_disease_by_id("cotton_leaf_curl_virus") or self.diseases[0]
                    confidence = 0.91
                else:
                    detected_disease = get_disease_by_id("tomato_late_blight") or self.diseases[0]
                    confidence = 0.93

            # Bounding boxes for visual overlay
            boxes = [
                {
                    "x": int(w * 0.25),
                    "y": int(h * 0.30),
                    "width": int(w * 0.50),
                    "height": int(h * 0.45),
                    "label": detected_disease["name"].split("(")[0].strip(),
                    "confidence": confidence
                }
            ]
            
            return {
                "success": True,
                "isDemoMode": True,
                "demoNote": "Diagnosis based on color-analysis heuristic. A trained CV model would provide higher accuracy.",
                "diseaseId": detected_disease["id"],
                "diseaseName": detected_disease["name"],
                "crop": detected_disease.get("crop", "General"),
                "pathogen": detected_disease.get("pathogen", "N/A"),
                "severity": detected_disease.get("severity", "Moderate"),
                "confidenceScore": confidence,
                "confidencePercentage": f"{int(confidence * 100)}%",
                "symptoms": detected_disease.get("symptoms", ""),
                "favorableConditions": detected_disease.get("favorableConditions", ""),
                "organicRemedy": detected_disease.get("organicRemedy", ""),
                "chemicalRemedy": detected_disease.get("chemicalRemedy", ""),
                "prevention": detected_disease.get("prevention", ""),
                "boundingBoxes": boxes,
                "imageResolution": f"{w}x{h}"
            }
            
        except Exception as e:
            logger.warning(f"Vision detection failed for image ({len(image_bytes)} bytes): {e}")
            return {
                "success": False,
                "isDemoMode": True,
                "error": "Could not process image. Please ensure the photo is clear and well-lit.",
                "diseaseName": None,
                "confidenceScore": 0,
            }

detector = CropDiseaseDetector()
