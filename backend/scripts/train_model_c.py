import csv
import time
import zipfile
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
from pathlib import Path
from PIL import Image
import joblib

class ZipDataset(Dataset):
    def __init__(self, records, old_zip_path, new_zip_path, transform, label_to_idx):
        self.records = records
        self.old_zip_path = old_zip_path
        self.new_zip_path = new_zip_path
        self.transform = transform
        self.label_to_idx = label_to_idx
        self.old_zip = None
        self.new_zip = None

    def _ensure_open(self):
        if self.old_zip is None:
            self.old_zip = zipfile.ZipFile(self.old_zip_path, 'r')
        if self.new_zip is None:
            self.new_zip = zipfile.ZipFile(self.new_zip_path, 'r')

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        self._ensure_open()
        row = self.records[idx]
        zfile = self.new_zip if row["zip_source"] == "newplantarchive.zip" else self.old_zip
        raw = zfile.read(row["path_in_zip"])
        arr = np.frombuffer(raw, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            img_bgr = np.zeros((224, 224, 3), dtype=np.uint8)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        tensor = self.transform(pil_img)
        label = self.label_to_idx[row["display_name"]]
        return tensor, label

def train_model_c():
    root = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root / "archive.zip"
    new_zip_path = root / "newplantarchive.zip"
    manifest_path = root / "data" / "balanced_training_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    # Load canonical classes from Model A encoder
    encoder = joblib.load(models_dir / "label_encoder.joblib")
    classes = list(encoder.classes_)
    label_to_idx = {c: i for i, c in enumerate(classes)}
    num_classes = len(classes)
    print(f"Loaded {num_classes} canonical classes.")
    
    records = []
    with open(manifest_path, "r", encoding="utf-8") as f:
        records = list(csv.DictReader(f))
        
    train_records = [r for r in records if r["split"] == "train"]
    val_records = [r for r in records if r["split"] == "val"]
    
    print(f"Dataset: {len(train_records)} Train, {len(val_records)} Val")
    
    # Realistic Field Augmentation Transform
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(brightness=0.25, contrast=0.20, saturation=0.20, hue=0.08),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_ds = ZipDataset(train_records, old_zip_path, new_zip_path, train_transform, label_to_idx)
    val_ds = ZipDataset(val_records[:2000], old_zip_path, new_zip_path, val_transform, label_to_idx)
    
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=64, shuffle=False, num_workers=0)
    
    print("Initializing MobileNetV3-Small transfer learning architecture...")
    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
    
    # Freeze initial feature layers for stability
    for param in model.features[:8].parameters():
        param.requires_grad = False
        
    # Replace final classifier layer
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    
    device = torch.device("cpu")
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=0.0015, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=4)
    
    print("\nStarting Training (4 Epochs on CPU)...")
    for epoch in range(1, 5):
        t_epoch = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = outputs.max(1)
            correct += preds.eq(labels).sum().item()
            total += labels.size(0)
            
        scheduler.step()
        train_acc = correct / total
        train_loss = running_loss / total
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = outputs.max(1)
                val_correct += preds.eq(labels).sum().item()
                val_total += labels.size(0)
                
        val_acc = val_correct / val_total
        print(f"Epoch {epoch}/4 ({time.time() - t_epoch:.1f}s): Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}%, Val Acc: {val_acc*100:.2f}%")
        
    # Save PyTorch Model
    out_pth = models_dir / "model_c_mobilenet_v3.pth"
    torch.save(model.state_dict(), out_pth)
    print(f"\nModel C weights saved to {out_pth} ({out_pth.stat().st_size / (1024*1024):.2f} MB)")
    
    # Export to ONNX for lightweight C++ OpenCV DNN inference (no PyTorch needed in production!)
    out_onnx = models_dir / "model_c_mobilenet_v3.onnx"
    dummy_input = torch.randn(1, 3, 224, 224, device=device)
    torch.onnx.export(
        model,
        dummy_input,
        str(out_onnx),
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        opset_version=14
    )
    print(f"Model C exported to ONNX: {out_onnx} ({out_onnx.stat().st_size / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    train_model_c()
