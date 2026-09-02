"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleAuthCallback() {
      if (!isSupabaseConfigured || !supabase) {
        router.replace("/dashboard");
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
          // Check if farmer profile already exists in Supabase
          const { data: farmer, error: profileError } = await supabase
            .from("farmers")
            .select("id, full_name, state, district")
            .eq("auth_user_id", session.user.id)
            .maybeSingle();

          if (farmer && farmer.id) {
            // Profile exists -> go to dashboard
            router.replace("/dashboard");
          } else {
            // New farmer -> go to onboarding to complete profile & farm setup
            router.replace("/onboarding");
          }
        } else {
          // Fallback check on auth state change event
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
              if (currentSession && currentSession.user) {
                authListener?.subscription?.unsubscribe();
                const { data: farmer } = await supabase
                  .from("farmers")
                  .select("id")
                  .eq("auth_user_id", currentSession.user.id)
                  .maybeSingle();

                if (farmer && farmer.id) {
                  router.replace("/dashboard");
                } else {
                  router.replace("/onboarding");
                }
              }
            }
          );
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "Failed to complete authentication. Redirecting to login...");
        setTimeout(() => router.replace("/login"), 2500);
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-stone-200/80 shadow-card flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-brand-900 text-white flex items-center justify-center text-2xl shadow-sm animate-pulse">
          🌱
        </div>
        <h2 className="font-display text-lg font-bold text-content">
          Authenticating with FasalAI...
        </h2>
        <p className="text-xs text-content-muted">
          Connecting your farmer account and securing farm data.
        </p>
        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin mt-2"></div>
      </div>
    </div>
  );
}
