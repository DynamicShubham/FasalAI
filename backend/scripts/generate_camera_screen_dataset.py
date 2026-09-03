import csv
import cv2
import numpy as np
from pathlib import Path

def simulate_camera_photographing_screen(img_bgr, seed=42):
    """
    Simulates optical physics when a phone camera photographs a disease image
    displayed on a laptop/tablet screen or printed paper:
    1. Surrounding laptop bezel / desk context (16:9 aspect ratio)
    2. Screen glare / specular reflection
    3. LCD RGB subpixel / moire pattern
    4. Slight perspective tilt
    5. Exposure & white-balance shift
    6. Slight sensor defocus blur
    """
    rng = np.random.default_rng(seed)
    h_leaf, w_leaf = img_bgr.shape[:2]
    
    # 1. 16:9 Canvas (1280x720 phone camera frame)
    frame_w, frame_h = 1280, 720
    # Background: dark laptop screen bezel + desk ambient
    bg_val = rng.integers(25, 45)
    frame = np.full((frame_h, frame_w, 3), bg_val, dtype=np.uint8)
    # Add subtle desk texture
    noise_bg = rng.integers(-5, 5, frame.shape, dtype=np.int16)
    frame = np.clip(frame.astype(np.int16) + noise_bg, 0, 255).astype(np.uint8)
    
    # 2. Scale leaf to occupy ~45-65% of screen height
    scale = rng.uniform(0.55, 0.75) * (frame_h / max(h_leaf, w_leaf))
    new_w = int(w_leaf * scale)
    new_h = int(h_leaf * scale)
    leaf_resized = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # 3. Perspective Tilt (simulating phone angle to screen)
    src_pts = np.float32([[0, 0], [new_w, 0], [new_w, new_h], [0, new_h]])
    tilt_dx = rng.uniform(-15, 15)
    tilt_dy = rng.uniform(-10, 10)
    dst_pts = np.float32([
        [max(0, tilt_dx), max(0, tilt_dy)],
        [new_w - max(0, -tilt_dx), max(0, -tilt_dy)],
        [new_w - max(0, tilt_dx), new_h - max(0, tilt_dy)],
        [max(0, -tilt_dx), new_h - max(0, -tilt_dy)]
    ])
    matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
    leaf_tilted = cv2.warpPerspective(leaf_resized, matrix, (new_w, new_h), borderValue=(int(bg_val), int(bg_val), int(bg_val)))
    
    # 4. LCD Moiré Grid Simulation (subtle horizontal & vertical scanlines)
    y_coords, x_coords = np.indices((new_h, new_w))
    moire = 1.0 + 0.04 * np.sin(x_coords * 1.8) * np.sin(y_coords * 1.8)
    leaf_moire = np.clip(leaf_tilted.astype(np.float32) * moire[:, :, np.newaxis], 0, 255).astype(np.uint8)
    
    # 5. Screen Glare / Reflection Hotspot
    glare = np.zeros((new_h, new_w), dtype=np.float32)
    center_x = rng.integers(int(new_w * 0.3), int(new_w * 0.7))
    center_y = rng.integers(int(new_h * 0.2), int(new_h * 0.6))
    cv2.circle(glare, (center_x, center_y), int(new_w * 0.4), 1.0, -1)
    glare = cv2.GaussianBlur(glare, (99, 99), 0)
    glare_intensity = rng.uniform(20, 45)
    leaf_glare = np.clip(leaf_moire.astype(np.float32) + (glare[:, :, np.newaxis] * glare_intensity), 0, 255).astype(np.uint8)
    
    # 6. Place on 16:9 canvas near center
    offset_x = (frame_w - new_w) // 2 + rng.integers(-30, 30)
    offset_y = (frame_h - new_h) // 2 + rng.integers(-20, 20)
    
    frame[offset_y:offset_y + new_h, offset_x:offset_x + new_w] = leaf_glare
    
    # 7. Slight Sensor Defocus / Camera blur
    if rng.random() > 0.4:
        frame = cv2.GaussianBlur(frame, (3, 3), 0.5)
        
    return frame

def build_camera_test_set():
    root = Path(__file__).resolve().parent.parent.parent
    rw_manifest = root / "data" / "real_world_manifest.csv"
    out_dir = root / "data" / "camera_screen_test"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_manifest = root / "data" / "camera_screen_manifest.csv"
    
    records = []
    with open(rw_manifest, "r", encoding="utf-8") as f:
        records = list(csv.DictReader(f))
        
    print(f"Building camera-screen test set from {len(records)} verified real-world/held-out images...")
    
    camera_records = []
    for i, r in enumerate(records):
        img_path = root / r["image_path"]
        if not img_path.exists():
            continue
            
        img = cv2.imread(str(img_path))
        if img is None:
            continue
            
        # Generate camera photographed frame
        cam_frame = simulate_camera_photographing_screen(img, seed=100 + i)
        out_name = f"cam_screen_{Path(r['image_path']).name}"
        out_path = out_dir / out_name
        cv2.imwrite(str(out_path), cam_frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
        
        rel_path = str(out_path.relative_to(root)).replace("\\", "/")
        camera_records.append({
            "image_path": rel_path,
            "dataset_source": "camera_screen_simulation",
            "crop": r["crop"],
            "disease": r["disease"],
            "normalized_class": r["normalized_class"],
            "provenance_source": f"Phone camera of screen: {r['provenance_source']}",
            "original_title": out_name
        })
        
    with open(out_manifest, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_path", "dataset_source", "crop", "disease", "normalized_class", "provenance_source", "original_title"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(camera_records)
        
    print(f"Created {len(camera_records)} camera-screen test images in {out_dir}")
    print(f"Manifest written to: {out_manifest}")

if __name__ == "__main__":
    build_camera_test_set()
