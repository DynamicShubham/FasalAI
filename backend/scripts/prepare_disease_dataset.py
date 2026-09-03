import os
import sys
import zipfile
import json
import random
import csv
from collections import defaultdict
from pathlib import Path

def prepare_manifest():
    print("=" * 70)
    print("FasalAI - Leakage-Safe Grouped Dataset Manifest Generator")
    print("=" * 70)
    
    root_dir = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root_dir / "archive.zip"
    new_zip_path = root_dir / "newplantarchive.zip"
    mapping_file = root_dir / "backend" / "app" / "vision" / "models" / "class_mapping.json"
    
    with open(mapping_file, "r", encoding="utf-8") as f:
        mapping = json.load(f)
        
    # Build lookup dicts: raw label -> canonical record
    old_to_canon = {}
    new_to_canon = {}
    for m in mapping:
        if m["old"]:
            old_to_canon[m["old"]] = m
        if m["new"]:
            new_to_canon[m["new"]] = m
            
    print(f"Loaded {len(mapping)} canonical classes from {mapping_file.name}")
    
    # Track unique images by filename to identify exact duplicates
    # Structure: filename -> {base_guid, canonical_class, source, path_in_zip}
    master_registry = {}
    
    # 1. Ingest New Dataset first (contains all 38 classes)
    print("Parsing newplantarchive.zip...")
    new_counts = defaultdict(int)
    with zipfile.ZipFile(new_zip_path, 'r') as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            fn = info.filename.replace('\\', '/')
            ext = fn.split('.')[-1].lower()
            if ext not in ('jpg', 'jpeg', 'png'):
                continue
            parts = fn.split('/')
            cls = None
            for i, p in enumerate(parts):
                if p.lower() in ('train', 'test', 'val', 'valid') and i + 1 < len(parts) - 1:
                    cls = parts[i+1]
                    break
            if not cls and len(parts) >= 2:
                cls = parts[-2]
            if not cls or cls.lower() in ('train', 'test', 'val', 'valid', 'test'):
                continue
                
            canon = new_to_canon.get(cls)
            if not canon:
                continue
                
            bname = fn.split('/')[-1]
            guid = bname.split('___')[0] if '___' in bname else bname.split('.')[0]
            
            if bname not in master_registry:
                master_registry[bname] = {
                    "filename": bname,
                    "guid": guid,
                    "path_in_zip": fn,
                    "zip_source": "newplantarchive.zip",
                    "dataset_source": "new_dataset",
                    "original_class": cls,
                    "canonical_class": canon["id"],
                    "display_name": canon["display"],
                    "crop": canon["crop"],
                    "disease": canon["disease"],
                    "healthy": canon["healthy"]
                }
                new_counts[canon["id"]] += 1

    print(f"New dataset ingested: {len(master_registry)} unique images across {len(new_counts)} classes")
    
    # 2. Ingest Old Dataset (identify overlap vs unique)
    print("Parsing archive.zip for cross-dataset validation...")
    old_overlap = 0
    old_unique = 0
    with zipfile.ZipFile(old_zip_path, 'r') as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            fn = info.filename.replace('\\', '/')
            ext = fn.split('.')[-1].lower()
            if ext not in ('jpg', 'jpeg', 'png'):
                continue
            bname = fn.split('/')[-1]
            if bname in master_registry:
                old_overlap += 1
                master_registry[bname]["in_previous_dataset"] = True
            else:
                old_unique += 1
                parts = fn.split('/')
                cls = None
                for i, p in enumerate(parts):
                    if p.lower() in ('train', 'test', 'val', 'valid') and i + 1 < len(parts) - 1:
                        cls = parts[i+1]
                        break
                if not cls and len(parts) >= 2:
                    cls = parts[-2]
                canon = old_to_canon.get(cls)
                if canon:
                    guid = bname.split('___')[0] if '___' in bname else bname.split('.')[0]
                    master_registry[bname] = {
                        "filename": bname,
                        "guid": guid,
                        "path_in_zip": fn,
                        "zip_source": "archive.zip",
                        "dataset_source": "previous_dataset",
                        "in_previous_dataset": True,
                        "original_class": cls,
                        "canonical_class": canon["id"],
                        "display_name": canon["display"],
                        "crop": canon["crop"],
                        "disease": canon["disease"],
                        "healthy": canon["healthy"]
                    }

    print(f"Old dataset analysis: {old_overlap} images overlap with new dataset, {old_unique} unique to old dataset")
    print(f"Total unified unique images: {len(master_registry)}")
    
    # 3. Group by Leaf GUID to Prevent Data Leakage
    class_groups = defaultdict(lambda: defaultdict(list))
    for bname, item in master_registry.items():
        cls_id = item["canonical_class"]
        guid = item["guid"]
        class_groups[cls_id][guid].append(item)

    # 4. Group-Stratified Splitting: 70% Train, 15% Val, 15% Test
    random.seed(42) # Deterministic reproducibility
    
    split_counts = defaultdict(lambda: defaultdict(int))
    manifest_rows = []
    balanced_rows = []
    
    # Balanced limit: select up to 80 leaf groups per class for balanced high-speed training
    SAMPLES_PER_CLASS_BALANCED = 160
    
    for cls_id, groups_dict in class_groups.items():
        guids = list(groups_dict.keys())
        random.shuffle(guids)
        
        n = len(guids)
        n_train = int(0.70 * n)
        n_val = int(0.15 * n)
        
        train_guids = set(guids[:n_train])
        val_guids = set(guids[n_train:n_train+n_val])
        test_guids = set(guids[n_train+n_val:])
        
        # Track items per split for this class
        class_balanced_count = 0
        
        for guid, items in groups_dict.items():
            if guid in train_guids:
                s = "train"
            elif guid in val_guids:
                s = "val"
            else:
                s = "test"
                
            for item in items:
                item["split"] = s
                split_counts[cls_id][s] += 1
                row = [
                    item["filename"],
                    item["zip_source"],
                    item["path_in_zip"],
                    item["dataset_source"],
                    item.get("in_previous_dataset", False),
                    item["original_class"],
                    item["canonical_class"],
                    item["display_name"],
                    item["crop"],
                    item["disease"],
                    item["healthy"],
                    item["guid"],
                    s
                ]
                manifest_rows.append(row)
                
                # Balanced manifest sampling (prevents massive 5000:500 class imbalance during training)
                if class_balanced_count < SAMPLES_PER_CLASS_BALANCED or s == "test":
                    balanced_rows.append(row)
                    if s == "train":
                        class_balanced_count += 1

    # 5. Export Manifests
    data_dir = root_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    manifest_csv = data_dir / "training_manifest.csv"
    balanced_csv = data_dir / "balanced_training_manifest.csv"
    
    header = [
        "filename", "zip_source", "path_in_zip", "dataset_source", "in_previous_dataset",
        "original_class", "canonical_class", "display_name", "crop", "disease",
        "healthy", "group_id", "split"
    ]
    
    with open(manifest_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(manifest_rows)
        
    with open(balanced_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(balanced_rows)

    print(f"\nManifest Generation Complete:")
    print(f"  Full Manifest: {manifest_csv} ({len(manifest_rows)} records)")
    print(f"  Balanced Manifest: {balanced_csv} ({len(balanced_rows)} records)")
    
    # Print Split Summary
    total_train = sum(1 for r in manifest_rows if r[-1] == "train")
    total_val = sum(1 for r in manifest_rows if r[-1] == "val")
    total_test = sum(1 for r in manifest_rows if r[-1] == "test")
    print(f"\nSplit Distribution (Zero Group Leakage Enforced):")
    print(f"  Train: {total_train:,} ({total_train/len(manifest_rows)*100:.1f}%)")
    print(f"  Validation: {total_val:,} ({total_val/len(manifest_rows)*100:.1f}%)")
    print(f"  Test: {total_test:,} ({total_test/len(manifest_rows)*100:.1f}%)")
    print("=" * 70)

if __name__ == "__main__":
    prepare_manifest()
