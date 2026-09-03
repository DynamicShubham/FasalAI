import zipfile
import io
import json
from pathlib import Path
from debug_plant_doctor import debug_image

def run_batch():
    sample_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "samples"
    root_dir = Path(__file__).resolve().parent.parent.parent
    new_zip_path = root_dir / "newplantarchive.zip"
    old_zip_path = root_dir / "archive.zip"
    
    test_set = [
        (str(sample_dir / 'corn_rust.jpg'), 'Corn (Maize) - Common Rust', None, ''),
        (str(sample_dir / 'tomato_curl.jpg'), 'Tomato - Yellow Leaf Curl Virus', None, ''),
        (str(sample_dir / 'grape_rot.jpg'), 'Grape - Black Rot', None, ''),
        (str(sample_dir / 'bell_pepper_spot.jpg'), 'Bell Pepper - Bacterial Spot', None, ''),
        (str(sample_dir / 'apple_scab.jpg'), 'Apple - Apple Scab', None, ''),
        (str(sample_dir / 'potato_blight.jpg'), 'Potato - Late Blight', None, ''),
    ]

    targets_new = [
        ('Tomato___Early_blight', 'Tomato - Early Blight'),
        ('Tomato___Late_blight', 'Tomato - Late Blight'),
        ('Tomato___healthy', 'Tomato - Healthy'),
        ('Tomato___Septoria_leaf_spot', 'Tomato - Septoria Leaf Spot'),
        ('Orange___Haunglongbing_(Citrus_greening)', 'Orange - Citrus Greening'),
        ('Potato___Early_blight', 'Potato - Early Blight'),
        ('Potato___healthy', 'Potato - Healthy'),
        ('Soybean___healthy', 'Soybean - Healthy'),
        ('Squash___Powdery_mildew', 'Squash - Powdery Mildew'),
        ('Apple___Black_rot', 'Apple - Black Rot'),
        ('Apple___healthy', 'Apple - Healthy'),
        ('Peach___Bacterial_spot', 'Peach - Bacterial Spot'),
        ('Strawberry___Leaf_scorch', 'Strawberry - Leaf Scorch')
    ]

    with zipfile.ZipFile(new_zip_path, 'r') as z:
        for prefix, gt in targets_new:
            for fn in z.namelist():
                if f'/{prefix}/' in fn and fn.endswith('.JPG') and 'train' not in fn.lower():
                    test_set.append((fn, gt, str(new_zip_path), ''))
                    break

    print(f"Running full evaluation on {len(test_set)} known benchmark leaves...\n")
    results = []
    for item in test_set:
        img_ref, gt, zpath, chint = item
        res = debug_image(img_ref, ground_truth=gt, crop_hint=chint, from_zip=zpath)
        results.append(res)

    print("\n" + "=" * 115)
    print(f"{'Image':<28} | {'Ground Truth':<30} | {'Raw Prediction':<30} | {'Conf':<6} | {'Match'}")
    print("=" * 115)
    for r in results:
        gt = r['ground_truth']
        pred = r['raw_pred']
        is_match = (gt.lower() in pred.lower()) or (pred.lower() in gt.lower())
        match_str = "MATCH" if is_match else "MISMATCH"
        print(f"{r['image'][:28]:<28} | {gt[:30]:<30} | {pred[:30]:<30} | {r['raw_conf']:>6} | {match_str}")
    print("=" * 115)

if __name__ == "__main__":
    run_batch()
