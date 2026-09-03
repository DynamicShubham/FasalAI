import csv
import zipfile
import re
from pathlib import Path

# Mapping of file prefixes in test/test/ to canonical classes
NAME_MAPPING = [
    ("AppleCedarRust", "Apple", "Cedar Apple Rust", "Apple - Cedar Apple Rust"),
    ("AppleScab", "Apple", "Apple Scab", "Apple - Apple Scab"),
    ("CornCommonRust", "Corn (Maize)", "Common Rust", "Corn (Maize) - Common Rust"),
    ("PotatoEarlyBlight", "Potato", "Early Blight", "Potato - Early Blight"),
    ("PotatoHealthy", "Potato", "Healthy", "Potato - Healthy"),
    ("TomatoEarlyBlight", "Tomato", "Early Blight", "Tomato - Early Blight"),
    ("TomatoHealthy", "Tomato", "Healthy", "Tomato - Healthy"),
    ("TomatoYellowCurlVirus", "Tomato", "Yellow Leaf Curl Virus", "Tomato - Yellow Leaf Curl Virus")
]

def extract_held_out():
    root = Path(__file__).resolve().parent.parent.parent
    zpath = root / "newplantarchive.zip"
    dest_dir = root / "data" / "real_world_test"
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = root / "data" / "real_world_manifest.csv"
    
    rows = []
    
    # 1. Existing Wikimedia in-field photos
    if dest_dir.exists():
        for f in dest_dir.glob("*.*"):
            if "Puccinia_sorghi" in f.name:
                rows.append({
                    "image_path": str(f.relative_to(root)).replace("\\", "/"),
                    "dataset_source": "wikimedia_commons_field",
                    "crop": "Corn (Maize)",
                    "disease": "Common Rust",
                    "normalized_class": "Corn (Maize) - Common Rust",
                    "provenance_source": "Wikimedia Commons (In-field photo)",
                    "original_title": f.name
                })
            elif "Alternaria_solani" in f.name:
                rows.append({
                    "image_path": str(f.relative_to(root)).replace("\\", "/"),
                    "dataset_source": "wikimedia_commons_field",
                    "crop": "Tomato",
                    "disease": "Early Blight",
                    "normalized_class": "Tomato - Early Blight",
                    "provenance_source": "Wikimedia Commons (In-field photo)",
                    "original_title": f.name
                })
                
    # 2. Extract independent test/test/ images from newplantarchive.zip
    with zipfile.ZipFile(zpath, 'r') as z:
        for name in z.namelist():
            if name.startswith("test/test/"):
                fname = Path(name).name
                target_path = dest_dir / fname
                if not target_path.exists():
                    target_path.write_bytes(z.read(name))
                    
                # Identify class
                norm_cls = None
                crop = None
                disease = None
                for prefix, c, d, nc in NAME_MAPPING:
                    if fname.startswith(prefix):
                        crop = c
                        disease = d
                        norm_cls = nc
                        break
                        
                if norm_cls:
                    rows.append({
                        "image_path": str(target_path.relative_to(root)).replace("\\", "/"),
                        "dataset_source": "independent_held_out_benchmark",
                        "crop": crop,
                        "disease": disease,
                        "normalized_class": norm_cls,
                        "provenance_source": "NewPlantDiseasesDataset Test Set (Never in Train/Val)",
                        "original_title": fname
                    })
                    
    # Write manifest
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_path", "dataset_source", "crop", "disease", "normalized_class", "provenance_source", "original_title"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Total independent real-world & held-out test images: {len(rows)}")
    print(f"Manifest written to: {manifest_path}")

if __name__ == "__main__":
    extract_held_out()
