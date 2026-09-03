import zipfile
from pathlib import Path
from debug_plant_doctor import debug_image

def test_potato():
    root = Path(__file__).resolve().parent.parent.parent
    zpath = root / "newplantarchive.zip"
    with zipfile.ZipFile(zpath, 'r') as z:
        potato_lbs = [fn for fn in z.namelist() if 'Potato___Late_blight' in fn and fn.endswith('.JPG') and 'valid' in fn][:8]
        
    print(f"Testing {len(potato_lbs)} Potato Late Blight samples with crop hint 'Potato':\n")
    for fn in potato_lbs:
        debug_image(fn, ground_truth='Potato - Late Blight', crop_hint='Potato', from_zip=str(zpath))

if __name__ == "__main__":
    test_potato()
