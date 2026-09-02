"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import ThemeToggle from "../../../components/ui/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isSupabaseConfigured,
  } = useAuth();

  const [authMode, setAuthMode] = useState("SIGNIN"); // "SIGNIN" | "SIGNUP"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (authMode === "SIGNUP") {
        await signUpWithEmail(email, password, { fullName });
        setSuccessMsg("Account created! You can now sign in.");
        setAuthMode("SIGNIN");
      } else {
        await signInWithEmail(email, password);
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between items-center p-4">
      {/* Top Escape Hatch & Theme Bar */}
      <div className="w-full max-w-md flex justify-between items-center py-2">
        <Link
          href="/"
          className="text-xs font-semibold text-content-muted hover:text-content flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white p-7 md:p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col gap-5 my-auto">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <img
            src="/logo.png"
            alt="FasalAI Logo"
            className="w-14 h-14 rounded-2xl object-contain mb-2 shadow-xs"
          />
          <h1 className="font-display text-xl font-bold text-content">
            {authMode === "SIGNIN" ? "Sign In to FasalAI" : "Create Farmer Account"}
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Your daily agricultural decision companion
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-semibold text-xs md:text-sm rounded-xl border border-stone-300 dark:border-stone-700 shadow-subtle flex items-center justify-center gap-3 transition-colors active:scale-98 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
          <span className="text-[11px] text-content-muted font-medium uppercase">Or with Email</span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {authMode === "SIGNUP" && (
            <div>
              <label className="block text-xs font-semibold text-content mb-1 ml-0.5">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content mb-1 ml-0.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content mb-1 ml-0.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 text-content text-xs md:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-brand-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs md:text-sm rounded-xl shadow-sm transition-colors mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{authMode === "SIGNIN" ? "Sign In" : "Create Account"}</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="flex justify-between items-center text-xs text-content-muted pt-1">
          <span>
            {authMode === "SIGNIN" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "SIGNIN" ? "SIGNUP" : "SIGNIN");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-brand-800 font-bold hover:underline"
          >
            {authMode === "SIGNIN" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
