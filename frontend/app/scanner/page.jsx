"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { scanCropImage } from "../../lib/api";

export default function ScannerPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setErrorMsg("Camera access not supported on this device. Please upload a photo.");
      }
    } catch (err) {
      console.warn("Camera stream error:", err);
      setErrorMsg("Camera permission unavailable. You can upload a photo below.");
      setCameraActive(false);
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
    setScanning(true);

    let base64Data = "";
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      base64Data = canvas.toDataURL("image/jpeg", 0.85);
    }

    try {
      const result = await scanCropImage(base64Data, selectedCrop);
      setTimeout(() => {
        setScanResult(result);
        setScanning(false);
      }, 500);
    } catch (e) {
      console.error("Scan error:", e);
      setScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target.result;
      const result = await scanCropImage(base64Data, selectedCrop);
      setTimeout(() => {
        setScanResult(result);
        setScanning(false);
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  const cropOptions = ["Tomato", "Wheat", "Cotton", "Rice / Paddy", "Soybean", "Potato", "Mustard"];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto p-4 md:p-6 gap-6 pb-24 md:pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-stone-200/80">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-content">
              Plant Doctor & Disease Check
            </h1>
            <p className="text-xs md:text-sm text-content-muted mt-0.5">
              Hold camera over affected leaves or upload a photo to identify problems and treatment.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-subtle">
            <span className="text-xs text-content-muted">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-brand-900 text-xs font-bold outline-none cursor-pointer"
            >
              {cropOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Viewfinder Camera Canvas Container */}
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-h-[460px] bg-stone-900 rounded-2xl overflow-hidden shadow-card border border-stone-300 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback Display if camera not active */}
          {!cameraActive && (
            <div className="flex flex-col items-center justify-center text-center p-6 gap-3 text-white">
              <span className="material-symbols-outlined text-4xl text-stone-300">photo_camera</span>
              <p className="text-xs text-stone-300 max-w-xs">
                {errorMsg || "Position camera over the affected plant leaf."}
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-full text-xs font-semibold"
              >
                Turn On Camera
              </button>
            </div>
          )}

          {/* Viewfinder Target Guide */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-60 h-60 sm:w-72 sm:h-72 border-2 border-white/70 rounded-2xl relative flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Align leaf inside box
                </span>
              </div>
            </div>
          )}

          {/* Scanning Overlay */}
          {scanning && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-30">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">Analyzing leaf health...</p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-content rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-stone-200">
              <span className="material-symbols-outlined text-base text-brand-800">upload</span>
              Upload Photo
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setCameraFacing(cameraFacing === "environment" ? "user" : "environment")}
              className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-content rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
              title="Switch camera"
            >
              <span className="material-symbols-outlined text-base">flip_camera_android</span>
            </button>
          </div>

          <button
            onClick={captureAndScan}
            disabled={scanning}
            className="w-full sm:w-auto px-8 py-3 bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm rounded-full shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">photo_camera</span>
            {scanning ? "Diagnosing..." : "Take Photo & Diagnose"}
          </button>
        </div>

        {/* Diagnosis Results Card */}
        {scanResult && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-card flex flex-col gap-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    scanResult.severity === "Critical"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    Severity: {scanResult.severity}
                  </span>
                  <span className="text-xs text-content-muted">
                    Confidence: {scanResult.confidencePercentage}
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-content">
                  {scanResult.diseaseName}
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Pathogen: {scanResult.pathogen} · Crop: {scanResult.crop}
                </p>
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-content font-medium transition-colors"
              >
                Scan Another Leaf ↺
              </button>
            </div>

            {/* Symptoms observed */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <h4 className="text-xs font-bold text-content uppercase tracking-wider mb-1">Identified Symptoms</h4>
              <p className="text-xs text-content-muted leading-relaxed">{scanResult.symptoms}</p>
            </div>

            {/* Practical Treatment Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organic Treatment */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <span className="material-symbols-outlined text-base">eco</span>
                  Organic Bio-Treatment
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {scanResult.organicRemedy}
                </p>
              </div>

              {/* Chemical Treatment */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                  <span className="material-symbols-outlined text-base">science</span>
                  Chemical Spray Formulation
                </div>
                <p className="text-xs text-blue-950 leading-relaxed">
                  {scanResult.chemicalRemedy}
                </p>
              </div>
            </div>

            {/* Long term prevention */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-brand-800 text-lg mt-0.5">shield</span>
              <div>
                <h4 className="text-xs font-bold text-content">Prevention & Field Hygiene</h4>
                <p className="text-xs text-content-muted mt-0.5 leading-relaxed">
                  {scanResult.prevention}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
