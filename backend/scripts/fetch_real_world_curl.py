import subprocess
import json
import csv
import re
from pathlib import Path

TARGETS = [
    ("Category:Alternaria_solani", "Tomato", "Early Blight", "Tomato - Early Blight", 5),
    ("Category:Phytophthora_infestans", "Potato", "Late Blight", "Potato - Late Blight", 5),
    ("Category:Venturia_inaequalis", "Apple", "Apple Scab", "Apple - Apple Scab", 5),
    ("Category:Guignardia_bidwellii", "Grape", "Black Rot", "Grape - Black Rot", 5),
    ("Category:Huanglongbing", "Orange (Citrus)", "Citrus Greening", "Orange - Citrus Greening", 5),
    ("Category:Podosphaera_xanthii", "Squash", "Powdery Mildew", "Squash - Powdery Mildew", 5),
    ("Category:Xanthomonas_campestris_pv._vesicatoria", "Bell Pepper", "Bacterial Spot", "Bell Pepper - Bacterial Spot", 5),
]

def run_curl(url):
    cmd = ["curl.exe", "-s", "-A", "FasalAI-ResearchBot/1.0 (https://fasalai.org; hackathon@fasalai.org)", url]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return res.stdout

def get_category_files(cat):
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle={cat}&cmtype=file&cmlimit=30&format=json"
    out = run_curl(api_url)
    try:
        data = json.loads(out)
        titles = [m["title"] for m in data.get("query", {}).get("categorymembers", [])]
        return [t for t in titles if any(t.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png'])]
    except Exception as e:
        print(f"Error parsing category {cat}: {e}")
        return []

def get_file_url(title):
    encoded_title = title.replace(" ", "%20")
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={encoded_title}&prop=imageinfo&iiprop=url&format=json"
    out = run_curl(api_url)
    try:
        data = json.loads(out)
        pages = data.get("query", {}).get("pages", {})
        for p in pages.values():
            infos = p.get("imageinfo", [])
            if infos:
                return infos[0].get("url")
    except Exception as e:
        print(f"Error getting file url {title}: {e}")
    return None

def download_file(url, target_path):
    cmd = ["curl.exe", "-s", "-L", "-A", "FasalAI-ResearchBot/1.0", url, "-o", str(target_path)]
    subprocess.run(cmd, timeout=30)
    return target_path.exists() and target_path.stat().st_size > 10000

def main():
    root = Path(__file__).resolve().parent.parent.parent
    dest_dir = root / "data" / "real_world_test"
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = root / "data" / "real_world_manifest.csv"
    
    existing_rows = []
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            existing_rows = list(csv.DictReader(f))
            
    existing_files = {r["image_path"] for r in existing_rows}
    
    for cat, crop, disease, norm_cls, max_n in TARGETS:
        print(f"\nChecking {cat} for {norm_cls}...")
        files = get_category_files(cat)
        downloaded = 0
        for ftitle in files:
            if downloaded >= max_n:
                break
            if any(term in ftitle.lower() for term in ["spore", "micro", "drawing", "diagram", "conidia", "cycle"]):
                continue
            clean_name = re.sub(r'[^a-zA-Z0-9_\.]', '_', ftitle.replace("File:", ""))
            target_path = dest_dir / clean_name
            rel_path = str(target_path.relative_to(root)).replace("\\", "/")
            
            if rel_path in existing_files and target_path.exists():
                downloaded += 1
                continue
                
            img_url = get_file_url(ftitle)
            if not img_url:
                continue
                
            print(f"  Downloading: {clean_name} ...")
            ok = download_file(img_url, target_path)
            if ok:
                downloaded += 1
                existing_rows.append({
                    "image_path": rel_path,
                    "dataset_source": "wikimedia_commons_field",
                    "crop": crop,
                    "disease": disease,
                    "normalized_class": norm_cls,
                    "provenance_source": cat,
                    "original_title": ftitle
                })
                existing_files.add(rel_path)
                print(f"  Saved: {clean_name} ({target_path.stat().st_size // 1024} KB)")

    # Save manifest
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_path", "dataset_source", "crop", "disease", "normalized_class", "provenance_source", "original_title"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_rows)

    print(f"\nCompleted! Total verified real-world test images: {len(existing_rows)}")
    print(f"Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    main()
