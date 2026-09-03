"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { scanCropImage } from "../../lib/api";

const SAMPLE_LEAVES = [
  { id: "apple", name: "Apple Scab", crop: "Apple", src: "/samples/apple_scab.jpg", icon: "🍏", pathogen: "Venturia inaequalis" },
  { id: "corn", name: "Corn Common Rust", crop: "Corn (Maize)", src: "/samples/corn_rust.jpg", icon: "🌽", pathogen: "Puccinia sorghi" },
  { id: "grape", name: "Grape Black Rot", crop: "Grape", src: "/samples/grape_rot.jpg", icon: "🍇", pathogen: "Guignardia bidwellii" },
  { id: "potato", name: "Potato Late Blight", crop: "Potato", src: "/samples/potato_blight.jpg", icon: "🥔", pathogen: "Phytophthora infestans" },
  { id: "tomato", name: "Tomato Yellow Curl", crop: "Tomato", src: "/samples/tomato_curl.jpg", icon: "🍅", pathogen: "TYLCV" },
  { id: "pepper", name: "Pepper Bacterial Spot", crop: "Bell Pepper", src: "/samples/bell_pepper_spot.jpg", icon: "🫑", pathogen: "Xanthomonas" },
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

  // Phase 4: Capture -> Preview -> Retake / Analyze flow
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [isFrozenPreview, setIsFrozenPreview] = useState(false);

  // Phase 15: Demo Test Library modal for screen testing
  const [showDemoLibrary, setShowDemoLibrary] = useState(false);
  const [fullScreenDemoImage, setFullScreenDemoImage] = useState(null);

  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (typeof window !== "undefined" && navigator?.mediaDevices?.getUserMedia) {
        if (videoRef.current?.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }

        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          console.warn("Retrying camera with generic constraints:", constraintErr);
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
          setIsFrozenPreview(false);
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

  // Phase 4: Capture Frame to Preview (freeze without instant scan)
  const captureFrameForPreview = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setErrorMsg("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (width === 0 || height === 0) {
      setErrorMsg("Camera stream is initializing. Please wait a second.");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, width, height);

    // High quality JPEG encoding (0.92)
    const base64Data = canvas.toDataURL("image/jpeg", 0.92);
    setActivePreviewImage(base64Data);
    setIsFrozenPreview(true);
    setScanResult(null);
    stopCamera();
  };

  // Phase 2: Save/Download exact captured bytes
  const downloadCapturedImage = () => {
    if (!activePreviewImage) return;
    const link = document.createElement("a");
    link.href = activePreviewImage;
    link.download = `fasalai_camera_captured_leaf_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analyze the reviewed preview image
  const analyzeActiveImage = async () => {
    if (!activePreviewImage || scanning) return;
    setScanning(true);
    setErrorMsg("");

    try {
      const cropHint = selectedCrop.includes("Auto-Detect") ? "" : selectedCrop;
      const result = await scanCropImage(activePreviewImage, cropHint);
      setScanResult(result);
    } catch (e) {
      console.error("Scan error:", e);
      setErrorMsg("Failed to analyze image. Please verify lighting and try again.");
    } finally {
      setScanning(false);
    }
  };

  // Handle direct file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target.result;
      setActivePreviewImage(base64Data);
      setIsFrozenPreview(true);
      setScanResult(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const testWithSample = async (sample) => {
    setScanning(true);
    setErrorMsg("");
    setActivePreviewImage(sample.src);
    setIsFrozenPreview(true);
    setSelectedCrop(sample.crop);
    stopCamera();

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
              MobileNetV3 Deep Transfer Learning + Foliar ROI Extractor (82.5% Field Accuracy)
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

        {/* Phase 15: Demo Test Library Tray */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-content uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-900">science</span>
              Verified Test Samples:
            </span>
            <button
              type="button"
              onClick={() => setShowDemoLibrary(!showDemoLibrary)}
              className="text-[11px] font-bold text-brand-900 hover:text-brand-950 flex items-center gap-1 underline underline-offset-2"
            >
              <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
              <span>{showDemoLibrary ? "Hide Demo Screen Mode" : "Open Screen-Ready Demo Mode"}</span>
            </button>
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

          {/* Expandable Screen-Ready Test Library for Hackathon Demonstrations */}
          {showDemoLibrary && (
            <div className="mt-3 p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 flex flex-col gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">photo_camera_front</span>
                  Hackathon Screen Demo Guide:
                </span>
                <span className="text-[11px] text-brand-800 font-medium">
                  Display an image full-screen on laptop, then photograph with phone camera
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SAMPLE_LEAVES.map((s) => (
                  <div key={s.id} className="p-2 bg-white rounded-lg border border-brand-200/80 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img src={s.src} alt={s.name} className="w-8 h-8 rounded object-cover border border-stone-200" />
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-content truncate">{s.name}</p>
                        <p className="text-[9px] text-content-muted">{s.crop}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFullScreenDemoImage(s)}
                      className="px-2 py-1 bg-brand-900 hover:bg-brand-950 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                      title="Display large on screen for phone camera demo"
                    >
                      <span className="material-symbols-outlined text-[12px]">fullscreen</span>
                      <span>Show</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Viewfinder / Preview Container */}
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-h-[440px] bg-stone-900 rounded-2xl overflow-hidden shadow-card border border-stone-300 flex items-center justify-center">
          {activePreviewImage ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <img src={activePreviewImage} alt="Captured Leaf" className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Captured Leaf Preview · Review Focus & Framing</span>
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

          {/* Viewfinder Target Reticle & Guidance (Phase 13) */}
          {cameraActive && !activePreviewImage && !scanning && (
            <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4 bg-emerald-950/5">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg"></div>
                <div className="w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg"></div>
              </div>
              <div className="self-center text-center bg-stone-900/80 backdrop-blur-xs px-4 py-2 rounded-full border border-white/20 shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">filter_center_focus</span>
                <span className="text-xs font-bold text-white tracking-wide">
                  PLACE AFFECTED LEAF INSIDE THIS FRAME
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg"></div>
                <div className="w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg"></div>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {scanning && (
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
              <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold tracking-wide">Analyzing leaf symptoms with MobileNetV3...</p>
              <p className="text-xs text-stone-300">Extracting foliar ROI & filtering screen moiré</p>
            </div>
          )}

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
        </div>

        {/* Phase 4 & Phase 2 Action Controls */}
        <div className="flex flex-col items-center gap-3">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {/* Live Camera Mode: Capture Photo */}
            {cameraActive && !activePreviewImage && (
              <button
                type="button"
                onClick={captureFrameForPreview}
                className="px-8 py-3.5 bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[22px]">camera</span>
                <span>Capture Photo</span>
              </button>
            )}

            {/* Frozen Preview Mode: Retake, Download Exact Image, and Analyze */}
            {activePreviewImage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActivePreviewImage(null);
                    setScanResult(null);
                    startCamera();
                  }}
                  disabled={scanning}
                  className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-content font-bold text-sm rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>Retake Photo</span>
                </button>

                {/* Phase 2: Developer Download Exact Bytes */}
                <button
                  type="button"
                  onClick={downloadCapturedImage}
                  className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-content-muted hover:text-content text-xs font-semibold rounded-full border border-stone-300 shadow-subtle flex items-center justify-center gap-1.5 transition-colors"
                  title="Download exact JPEG bytes sent to backend"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Save Exact Image</span>
                </button>

                <button
                  type="button"
                  onClick={analyzeActiveImage}
                  disabled={scanning}
                  className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">diagnostics</span>
                  <span>{scanning ? "Diagnosing..." : "Analyze Leaf Now →"}</span>
                </button>
              </>
            )}

            {/* If camera is not running and no preview image, show direct triggers */}
            {!cameraActive && !activePreviewImage && (
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
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                  <span>Live Viewfinder</span>
                </button>
              </>
            )}

            {/* Gallery Upload Option */}
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

          {/* Camera Instructions Guide Pill */}
          <div className="text-center text-[11px] text-content-muted flex items-center gap-3 flex-wrap justify-center pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">crop_free</span>
              Fill frame with leaf
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-amber-600">wb_sunny</span>
              Avoid direct screen glare
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-blue-600">center_focus_strong</span>
              Hold steady parallel to surface
            </span>
          </div>

          {/* Native Camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* File Upload input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Quality Rejection / Crop Mismatch / Low Confidence Card */}
        {scanResult && !scanResult.success && (
          <section className="bg-white p-6 rounded-2xl border border-amber-300 shadow-card flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl flex-shrink-0">
                {scanResult.status === "QUALITY_REJECTED" ? "📷" : scanResult.status === "CROP_MISMATCH" ? "🔄" : "⚠️"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {scanResult.status === "QUALITY_REJECTED"
                      ? `Image Quality: ${scanResult.qualityIssue || "Unsuitable"}`
                      : scanResult.status === "CROP_MISMATCH"
                        ? "Crop Mismatch Detected"
                        : `Low Confidence (${scanResult.confidencePercentage || "< 20%"})`}
                  </span>
                  <span className="text-[10px] text-content-muted">
                    MobileNetV3 + OpenCV Pathology
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
                  <p className="text-xs font-medium text-amber-900 mt-1">
                    💡 <strong>Capture Guidance:</strong> {scanResult.guidance}
                  </p>
                )}
              </div>
            </div>

            {/* Top Candidates Breakdown (Phase 5) */}
            {scanResult.topKPredictions && scanResult.topKPredictions.length > 0 && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs font-bold text-content mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-brand-900">analytics</span>
                  Top Candidate Pathologies Identified:
                </p>
                <div className="space-y-1.5">
                  {scanResult.topKPredictions.map((pred, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-content font-medium">{pred.class}</span>
                        <span className="font-mono font-bold text-content">{pred.percentage}</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(4, pred.probability * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-content-muted leading-relaxed">
              <strong>Agronomic Integrity Policy:</strong> FasalAI never assigns a fabricated disease when image quality or model confidence is insufficient. Physical examination by a certified agricultural extension officer (KVK) is recommended before purchasing chemical treatments.
            </div>
          </section>
        )}

        {/* Phase 20: Confident or Moderate Diagnosis Results Card */}
        {scanResult && scanResult.success && (
          <section className="bg-white p-5 md:p-7 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Disease Name & Confidence */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-brand-900 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100 uppercase">
                    {scanResult.crop || "Crop"} Pathology
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Severity: {scanResult.severity || "Moderate"}
                  </span>
                  {scanResult.status === "MODERATE_CONFIDENCE" ? (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      MODERATE CONFIDENCE (Possible Match)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      HIGH CONFIDENCE
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    MobileNetV3 Deep Model (82.5% Field Benchmark)
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
                <div className="text-2xl md:text-3xl font-black font-mono text-emerald-600">
                  {scanResult.confidencePercentage}
                </div>
                <span className="text-[10px] text-content-muted font-medium">
                  Model Probability
                </span>
              </div>
            </div>

            {/* Phase 20: Rich Explanations (What We Found & Why Diagnosed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-content flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">visibility</span>
                  What We Found:
                </span>
                <p className="text-xs text-content-muted leading-relaxed">
                  {scanResult.whatWeFound || scanResult.symptoms}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-content flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-700">psychology</span>
                  Why This Diagnosis Was Made:
                </span>
                <p className="text-xs text-content-muted leading-relaxed">
                  {scanResult.whyDiagnosed || "Identified distinct lesion morphology and texture patterns."}
                </p>
              </div>
            </div>

            {/* What To Do Next: Actionable Remedies */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-content flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-900">medical_services</span>
                What To Do Next (Agronomic Protocol):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    🌿 Organic / Cultural Remedy:
                  </span>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {scanResult.organicRemedy}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    🧪 Chemical / Curative Treatment:
                  </span>
                  <p className="text-xs text-blue-950 leading-relaxed">
                    {scanResult.chemicalRemedy}
                  </p>
                </div>
              </div>

              {scanResult.prevention && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-content-muted flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 flex-shrink-0 mt-0.5">shield</span>
                  <span><strong>Prevention:</strong> {scanResult.prevention}</span>
                </div>
              )}
            </div>

            {/* Top-5 Predictions Breakdown */}
            {scanResult.topKPredictions && scanResult.topKPredictions.length > 0 && (
              <details className="text-xs text-content-muted cursor-pointer pt-3 border-t border-stone-100">
                <summary className="font-semibold text-content hover:text-brand-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                  <span>View Diagnostic Probability Distribution (Top 5 Classes)</span>
                </summary>
                <div className="mt-2.5 space-y-2 pl-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {scanResult.topKPredictions.map((pred, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-content font-medium">{pred.class}</span>
                        <span className="font-mono font-bold text-content">{pred.percentage}</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(4, pred.probability * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="text-[11px] text-content-muted bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
              <strong>Statutory Advisory:</strong> {scanResult.treatmentDisclaimer || "Dosages are illustrative benchmarks based on ICAR recommendations. Always check local crop registrations and product labels."}
            </div>
          </section>
        )}
      </main>

      {/* Full-Screen Demo Image Modal for Phone Camera Demonstration (Phase 15 & 16) */}
      {fullScreenDemoImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-2xl w-full flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center text-white pb-2 border-b border-white/20">
              <div>
                <h3 className="text-base font-bold">{fullScreenDemoImage.name}</h3>
                <p className="text-xs text-stone-300">{fullScreenDemoImage.crop} · Pathogen: {fullScreenDemoImage.pathogen}</p>
              </div>
              <button
                type="button"
                onClick={() => setFullScreenDemoImage(null)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close (ESC)
              </button>
            </div>

            {/* High-Contrast Screen Display Container */}
            <div className="relative w-full aspect-square max-h-[70vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-6 border-4 border-white">
              <img
                src={fullScreenDemoImage.src}
                alt={fullScreenDemoImage.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center text-stone-300 text-xs max-w-md bg-stone-900/80 px-4 py-2 rounded-xl border border-white/10">
              📱 <strong>Hackathon Demo Setup:</strong> Keep this laptop screen bright. Point your phone camera directly at this image inside the green reticle frame and tap "Capture Photo".
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
