import os
import json
import csv
import urllib.request
import urllib.parse
from pathlib import Path

TARGET_CATEGORIES = [
    {
        "category": "Category:Puccinia_sorghi",
        "crop": "Corn (Maize)",
        "disease": "Common Rust",
        "normalized_class": "Corn (Maize) - Common Rust",
        "max_images": 5
    },
    {
        "category": "Category:Alternaria_solani",
        "crop": "Tomato",
        "disease": "Early Blight",
        "normalized_class": "Tomato - Early Blight",
        "max_images": 5
    },
    {
        "category": "Category:Phytophthora_infestans",
        "crop": "Potato",
        "disease": "Late Blight",
        "normalized_class": "Potato - Late Blight",
        "max_images": 5
    },
    {
        "category": "Category:Venturia_inaequalis",
        "crop": "Apple",
        "disease": "Apple Scab",
        "normalized_class": "Apple - Apple Scab",
        "max_images": 5
    },
    {
        "category": "Category:Guignardia_bidwellii",
        "crop": "Grape",
        "disease": "Black Rot",
        "normalized_class": "Grape - Black Rot",
        "max_images": 5
    },
    {
        "category": "Category:Huanglongbing",
        "crop": "Orange (Citrus)",
        "disease": "Citrus Greening",
        "normalized_class": "Orange - Citrus Greening",
        "max_images": 5
    },
    {
        "category": "Category:Podosphaera_xanthii",
        "crop": "Squash",
        "disease": "Powdery Mildew",
        "normalized_class": "Squash - Powdery Mildew",
        "max_images": 5
    },
    {
        "category": "Category:Tomato_yellow_leaf_curl_virus",
        "crop": "Tomato",
        "disease": "Yellow Leaf Curl Virus",
        "normalized_class": "Tomato - Yellow Leaf Curl Virus",
        "max_images": 5
    }
]

def fetch_category_files(category_title):
    endpoint = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": category_title,
        "cmtype": "file",
        "cmlimit": "30",
        "format": "json"
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "FasalAI-Research-Agent/1.0 (contact: student-hackathon@fasalai.org)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode('utf-8'))
            return [m["title"] for m in data.get("query", {}).get("categorymembers", []) if m["title"].lower().endswith(('.jpg', '.jpeg', '.png'))]
    except Exception as e:
        print(f"Error querying {category_title}: {e}")
        return []

def get_file_info(file_title):
    endpoint = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "format": "json"
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "FasalAI-Research-Agent/1.0 (contact: student-hackathon@fasalai.org)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            for pid, page in pages.items():
                infos = page.get("imageinfo", [])
                if infos:
                    return infos[0].get("url")
    except Exception as e:
        print(f"Error getting info for {file_title}: {e}")
    return None

def build_real_world_dataset():
    root = Path(__file__).resolve().parent.parent.parent
    dest_dir = root / "data" / "real_world_test"
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = root / "data" / "real_world_manifest.csv"
    
    rows = []
    print(f"Building verified real-world test benchmark into {dest_dir}...")
    
    for cat_spec in TARGET_CATEGORIES:
        cat_name = cat_spec["category"]
        print(f"\nProcessing {cat_name} -> {cat_spec['normalized_class']}...")
        files = fetch_category_files(cat_name)
        downloaded = 0
        for ftitle in files:
            if downloaded >= cat_spec["max_images"]:
                break
            # Skip microscope/histology/spore images if possible
            if any(term in ftitle.lower() for term in ["spore", "micro", "drawing", "diagram", "conidia", "cycle"]):
                continue
            
            img_url = get_file_info(ftitle)
            if not img_url:
                continue
                
            clean_name = ftitle.replace("File:", "").replace(" ", "_").replace("(", "").replace(")", "").replace("'", "")
            target_path = dest_dir / clean_name
            
            if not target_path.exists():
                try:
                    dl_req = urllib.request.Request(img_url, headers={"User-Agent": "FasalAI-Research-Agent/1.0"})
                    with urllib.request.urlopen(dl_req, timeout=15) as img_res:
                        content = img_res.read()
                        if len(content) > 10000: # at least 10KB
                            target_path.write_bytes(content)
                            print(f"  Downloaded: {clean_name} ({len(content)//1024} KB)")
                            downloaded += 1
                except Exception as e:
                    print(f"  Failed to download {clean_name}: {e}")
                    continue
            else:
                downloaded += 1
                
            if target_path.exists():
                rows.append({
                    "image_path": str(target_path.relative_to(root)).replace("\\", "/"),
                    "dataset_source": "wikimedia_commons_field",
                    "crop": cat_spec["crop"],
                    "disease": cat_spec["disease"],
                    "normalized_class": cat_spec["normalized_class"],
                    "provenance_source": cat_name,
                    "original_title": ftitle
                })
                
    # Save manifest
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["image_path", "dataset_source", "crop", "disease", "normalized_class", "provenance_source", "original_title"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"\nSuccessfully collected {len(rows)} real-world field evaluation images.")
    print(f"Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    build_real_world_dataset()
