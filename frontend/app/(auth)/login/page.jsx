"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("PHONE");

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep("OTP");
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  const handleInstantDemo = async () => {
    await loginDemo();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-7 md:p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-brand-900 text-white flex items-center justify-center text-2xl mb-2 shadow-sm">
            🌱
          </div>
          <h1 className="font-display text-xl font-bold text-content">Sign In to FasalAI</h1>
          <p className="text-xs text-content-muted mt-0.5">Enter your mobile number to view your farm status</p>
        </div>

        {/* Demo Shortcut */}
        <button
          onClick={handleInstantDemo}
          className="w-full py-3 px-4 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-full shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base">account_circle</span>
          Demo Farmer Quick Access (Ramesh Patil)
        </button>

        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px bg-stone-200"></div>
          <span className="text-[11px] text-content-muted font-medium uppercase">Or with mobile OTP</span>
          <div className="flex-1 h-px bg-stone-200"></div>
        </div>

        {/* OTP Form */}
        {step === "PHONE" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-content mb-1 ml-0.5">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-content-muted text-xs font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-stone-50 text-content text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-content font-semibold text-xs rounded-full border border-stone-300 transition-colors"
            >
              Get OTP SMS
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-content mb-1 ml-0.5">
                Enter 4-digit code sent to +91 {phone}
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 bg-stone-50 text-brand-900 rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs rounded-full transition-colors"
            >
              Verify & Enter Farm
            </button>

            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="text-xs text-brand-800 text-center hover:underline"
            >
              Change mobile number
            </button>
          </form>
        )}

        <div className="text-center pt-1 border-t border-stone-100">
          <p className="text-xs text-content-muted">
            New farmer?{" "}
            <Link href="/onboarding" className="text-brand-800 font-semibold hover:underline">
              Create Farm Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
