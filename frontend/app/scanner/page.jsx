"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { scanCropImage } from "../../lib/api";

const SAMPLE_LEAVES = [
  { id: "apple", name: "Apple Scab", crop: "Apple", src: "/samples/apple_scab.jpg", icon: "🍏" },
  { id: "corn", name: "Corn Common Rust", crop: "Corn (Maize)", src: "/samples/corn_rust.jpg", icon: "🌽" },
  { id: "grape", name: "Grape Black Rot", crop: "Grape", src: "/samples/grape_rot.jpg", icon: "🍇" },
  { id: "potato", name: "Potato Late Blight", crop: "Potato", src: "/samples/potato_blight.jpg", icon: "🥔" },
  { id: "tomato", name: "Tomato Yellow Curl", crop: "Tomato", src: "/samples/tomato_curl.jpg", icon: "🍅" },
  { id: "pepper", name: "Pepper Bacterial Spot", crop: "Bell Pepper", src: "/samples/bell_pepper_spot.jpg", icon: "🫑" },
];

const CROP_OPTIONS = [
  "Auto-Detect (All Crops)",
  "Tomato",
  "Potato",
  "Corn (Maize)",
  "Grape",
  "Apple",
  "Bell Pepper",
  "Cherry",
  "Peach",
  "Strawberry",
  "Orange (Citrus)",
  "Soybean",
  "Squash",
  "Blueberry",
  "Raspberry",
  "Wheat",
];

export default function ScannerPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [selectedCrop, setSelectedCrop] = useState("Auto-Detect (All Crops)");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activePreviewImage, setActivePreviewImage] = useState(null);

  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (typeof window !== "undefined" && navigator?.mediaDevices?.getUserMedia) {
        // Stop any running stream first
        if (videoRef.current?.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }

        let stream = null;
        try {
          // Attempt 1: Preferred facingMode (ideal rather than strict constraint)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          console.warn("Retrying camera with generic constraints:", constraintErr);
          // Attempt 2: Fallback to any available system video stream (laptops/webcams)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.muted = true;

          // Ensure video dimensions have initialized
          await new Promise((resolve) => {
            if (videoRef.current.readyState >= 1) {
              resolve();
            } else {
              videoRef.current.onloadedmetadata = () => resolve();
            }
          });

          await videoRef.current.play().catch((e) => console.warn("Video play error:", e));
          setCameraActive(true);
          setActivePreviewImage(null);
        }
      } else {
        setCameraActive(false);
        setErrorMsg("Live camera viewfinder not supported in this browser. Tap 'Take Photo' or 'Upload Photo'.");
      }
    } catch (err) {
      console.warn("Camera stream error:", err);
      setCameraActive(false);
      let userMsg = "Live camera access unavailable. Tap 'Take Photo' to open your phone camera, or upload an image.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMsg = "Camera permission was not granted. Tap 'Take Photo' to capture a picture or allow camera in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMsg = "No webcam detected on this device. You can tap 'Upload Photo' or test with sample leaves.";
      }
      setErrorMsg(userMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [cameraFacing]);

  const captureAndScan = async () => {
    if (scanning) return;
    setErrorMsg("");

    let base64Data = "";
    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (width === 0 || height === 0) {
        setErrorMsg("Camera stream is initializing. Please wait a second and tap Diagnose again.");
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);
      base64Data = canvas.toDataURL("image/jpeg", 0.90);
      setActivePreviewImage(base64Data);
    } else if (activePreviewImage) {
      base64Data = activePreviewImage;
    } else {
      // If camera is not active, trigger native mobile camera
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    setScanning(true);
    try {
      const cropHint = selectedCrop.includes("Auto-Detect") ? "" : selectedCrop;
      const result = await scanCropImage(base64Data, cropHint);
      setScanResult(result);
    } catch (e) {
      console.error("Scan error:", e);
      setErrorMsg("Failed to analyze image. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target.result;
      setActivePreviewImage(base64Data);
      try {
        const cropHint = selectedCrop.includes("Auto-Detect") ? "" : selectedCrop;
        const result = await scanCropImage(base64Data, cropHint);
        setScanResult(result);
      } catch (err) {
        console.error("Upload scan error:", err);
        setErrorMsg("Failed to analyze photo.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const testWithSample = async (sample) => {
    setScanning(true);
    setErrorMsg("");
    setActivePreviewImage(sample.src);
    setSelectedCrop(sample.crop);

    try {
      const response = await fetch(sample.src);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        const result = await scanCropImage(base64Data, sample.crop);
        setScanResult(result);
        setScanning(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Sample scan error:", err);
      setErrorMsg("Failed to load sample image.");
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-stone-200/80">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Plant Doctor & Disease Diagnostic
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Powered by OpenCV ML Feature Extractor (92.7% validation accuracy across 29 crop disease classes)
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-subtle">
            <span className="text-xs text-content-muted font-medium">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-brand-900 text-xs font-bold outline-none cursor-pointer"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Sample Leaves Testing Tray */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-content uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-900">science</span>
              Instant 1-Click Test Samples (Pre-loaded Leaves):
            </span>
            <span className="text-[11px] text-content-muted">Click any sample to diagnose live</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {SAMPLE_LEAVES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => testWithSample(s)}
                disabled={scanning}
                className="p-2 rounded-xl bg-stone-50 hover:bg-brand-50 border border-stone-200 hover:border-brand-700 transition-all flex flex-col items-center text-center gap-1.5 group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 bg-white flex items-center justify-center text-xl shadow-xs">
                  <img src={s.src} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-semibold text-content group-hover:text-brand-900 line-clamp-1">
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Viewfinder Camera Canvas Container */}
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-h-[420px] bg-stone-900 rounded-2xl overflow-hidden shadow-card border border-stone-300 flex items-center justify-center">
          {activePreviewImage && !cameraActive ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <img src={activePreviewImage} alt="Scanned Leaf" className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Photo Captured / Selected</span>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback Display if camera not active and no preview image */}
          {!cameraActive && !activePreviewImage && (
            <div className="flex flex-col items-center justify-center text-center p-6 gap-3 text-white">
              <span className="material-symbols-outlined text-4xl text-stone-400">photo_camera</span>
              <p className="text-xs text-stone-300 max-w-sm">
                Tap below to open your camera or choose an image.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>Take Photo (Camera)</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  <span>Live Viewfinder</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanning Overlay Animation */}
          {scanning && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
              <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold tracking-wide">Examining leaf symptoms & pathology...</p>
            </div>
          )}

          {/* Clean Viewfinder Target Reticle */}
          {cameraActive && !scanning && (
            <div className="absolute inset-8 sm:inset-12 border border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-white"></div>
              </div>
              <p className="text-center text-[11px] text-white/90 bg-stone-900/70 px-3 py-1 rounded-full self-center backdrop-blur-xs">
                Center the affected leaf in this frame
              </p>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cameraActive ? (
            <button
              type="button"
              onClick={captureAndScan}
              disabled={scanning}
              className="px-8 py-3.5 bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span>{scanning ? "Analyzing Leaf..." : "Snap & Diagnose"}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={scanning}
                className="px-7 py-3.5 bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                disabled={scanning}
                className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-content font-bold text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors"
                title="Start Live Camera Viewfinder"
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
                <span>Live Viewfinder</span>
              </button>
            </>
          )}

          {activePreviewImage && (
            <button
              type="button"
              onClick={() => {
                setActivePreviewImage(null);
                startCamera();
              }}
              className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-content font-bold text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              <span>Retake / Live View</span>
            </button>
          )}

          {/* Native Camera input (direct hardware camera launch on mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* File Upload input (gallery/storage) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="px-6 py-3.5 bg-white hover:bg-stone-50 text-content font-bold text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span>Upload Photo</span>
          </button>

          {cameraActive && (
            <button
              type="button"
              onClick={() => setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))}
              className="p-3 bg-white hover:bg-stone-50 text-content rounded-full border border-stone-300 shadow-subtle flex items-center justify-center transition-colors"
              title="Flip Front / Rear Camera"
            >
              <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
            </button>
          )}
        </div>

        {/* Quality Rejection / Crop Mismatch / Low Confidence Card */}
        {scanResult && !scanResult.success && (
          <section className="bg-white p-6 rounded-2xl border border-amber-300 dark:border-amber-800 shadow-card flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-2xl flex-shrink-0">
                {scanResult.status === "QUALITY_REJECTED" ? "📷" : scanResult.status === "CROP_MISMATCH" ? "🔄" : "⚠️"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                    {scanResult.status === "QUALITY_REJECTED"
                      ? `Image Quality: ${scanResult.qualityIssue || "Unsuitable"}`
                      : scanResult.status === "CROP_MISMATCH"
                      ? "Crop Mismatch Detected"
                      : `Low Confidence (${scanResult.confidencePercentage || "< 20%"})`}
                  </span>
                  <span className="text-[10px] text-content-muted">
                    OpenCV + Random Forest
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-content">
                  {scanResult.status === "QUALITY_REJECTED"
                    ? "Image quality too low for reliable diagnosis"
                    : scanResult.status === "CROP_MISMATCH"
                    ? `Image may not match selected crop (${scanResult.selectedCrop || "Selected"})`
                    : "Unable to make a reliable diagnosis from this image"}
                </h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  {scanResult.message}
                </p>
                {scanResult.guidance && (
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mt-1">
                    💡 <strong>Capture Guidance:</strong> {scanResult.guidance}
                  </p>
                )}
              </div>
            </div>

            {scanResult.topKPredictions && scanResult.topKPredictions.length > 0 && (
              <details className="text-xs text-content-muted cursor-pointer pt-2 border-t border-stone-100">
                <summary className="font-semibold hover:text-content">Diagnostic Probability Breakdown (Top Candidates)</summary>
                <div className="mt-2 space-y-1 pl-2">
                  {scanResult.topKPredictions.map((pred, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <span>{pred.class}</span>
                      <span className="font-mono font-bold text-content">{pred.percentage}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="bg-stone-50 dark:bg-stone-850 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-content-muted leading-relaxed">
              <strong>Agronomic Integrity Policy:</strong> FasalAI never assigns a fabricated disease when image quality or model confidence is insufficient. Physical examination by a certified agricultural extension officer (KVK) is recommended before purchasing chemical treatments.
            </div>
          </section>
        )}

        {/* Confident or Moderate Diagnosis Results Card */}
        {scanResult && scanResult.success && (
          <section className="bg-white p-5 md:p-7 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Disease Name & Confidence */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-brand-900 dark:text-emerald-300 bg-brand-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-brand-100 dark:border-emerald-800/60 uppercase">
                    {scanResult.crop || "Crop"} Pathology
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                    Severity: {scanResult.severity || "Moderate"}
                  </span>
                  {scanResult.status === "MODERATE_CONFIDENCE" ? (
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                      MODERATE CONFIDENCE (Possible Match)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      HIGH CONFIDENCE
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    COMPUTED · PlantVillage ML Model (Benchmark: 92.7%)
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-content mt-1.5">
                  {scanResult.diseaseName}
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Pathogen: {scanResult.pathogen}
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs text-content-muted font-medium">Model Probability</span>
                <span className="text-2xl font-black text-brand-900 dark:text-emerald-400">
                  {scanResult.confidencePercentage}
                </span>
              </div>
            </div>

            {/* Visual Symptoms */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-content uppercase tracking-wider">
                Observed Symptoms:
              </span>
              <p className="text-xs md:text-sm text-content-muted leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                {scanResult.symptoms}
              </p>
            </div>

            {/* Treatment Options (Organic vs Chemical) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organic Treatment */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">eco</span>
                  Organic & Bio-Control Protocol
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                  {scanResult.organicRemedy}
                </p>
              </div>

              {/* Chemical Spray Schedule */}
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  Example Chemical Treatment (ICAR Reference)
                </div>
                <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
                  {scanResult.chemicalRemedy}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-content-muted bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 italic">
              ⚖️ {scanResult.treatmentDisclaimer || "Dosages and formulations are illustrative agronomic benchmarks. Always check local agricultural regulations and the product label before application."}
            </p>

            {/* Prevention & Management */}
            {scanResult.prevention && (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col gap-1">
                <span className="text-xs font-bold text-content uppercase tracking-wider">
                  Long-term Prevention & Cultural Practices:
                </span>
                <p className="text-xs text-content-muted leading-relaxed">
                  {scanResult.prevention}
                </p>
              </div>
            )}

            {/* Top 3 Breakdown */}
            {scanResult.topKPredictions && scanResult.topKPredictions.length > 0 && (
              <details className="text-xs text-content-muted cursor-pointer pt-2 border-t border-stone-100">
                <summary className="font-semibold hover:text-content">Diagnostic Probability Breakdown (Top 3 Candidates)</summary>
                <div className="mt-2 space-y-1 pl-2">
                  {scanResult.topKPredictions.map((pred, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <span>{pred.class}</span>
                      <span className="font-mono font-bold text-content">{pred.percentage}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
