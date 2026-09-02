"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch authenticated farmer profile from Supabase PostgreSQL
  const loadFarmerProfile = useCallback(async (authUserId) => {
    if (!isSupabaseConfigured || !supabase || !authUserId) return null;
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (error) {
        console.warn("Supabase farmer profile query error:", error.message);
        return null;
      }
      if (data) {
        const formatted = {
          id: data.id,
          name: data.full_name || "",
          email: data.email || "",
          phone: data.phone_number || "",
          state: data.state || "",
          district: data.district || "",
          language: data.language || "English",
          experienceYears: data.experience_years || 0,
          authUserId: data.auth_user_id,
          hasProfile: true,
        };
        setFarmerProfile(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn("Failed to load farmer profile from Supabase:", err);
    }
    return null;
  }, []);

  // Initialize and listen to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get current active session from Supabase
    supabase.auth.getSession().then(async ({ data: { session: activeSession }, error }) => {
      if (error) {
        console.warn("Session restore error:", error.message);
      }
      setSession(activeSession);
      if (activeSession?.user) {
        const profile = await loadFarmerProfile(activeSession.user.id);
        const mappedUser = {
          id: activeSession.user.id,
          email: activeSession.user.email || "",
          name: profile?.name || activeSession.user.user_metadata?.full_name || activeSession.user.email?.split("@")[0] || "Farmer",
          phone: profile?.phone || activeSession.user.phone || "",
          state: profile?.state || "",
          district: profile?.district || "",
          hasProfile: Boolean(profile?.id),
        };
        setUser(mappedUser);
      } else {
        setUser(null);
        setFarmerProfile(null);
      }
      setLoading(false);
    });

    // Listen to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const profile = await loadFarmerProfile(currentSession.user.id);
        const mappedUser = {
          id: currentSession.user.id,
          email: currentSession.user.email || "",
          name: profile?.name || currentSession.user.user_metadata?.full_name || currentSession.user.email?.split("@")[0] || "Farmer",
          phone: profile?.phone || currentSession.user.phone || "",
          state: profile?.state || "",
          district: profile?.district || "",
          hasProfile: Boolean(profile?.id),
        };
        setUser(mappedUser);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setFarmerProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadFarmerProfile]);

  // Sign up with Email and Password
  const signUpWithEmail = async (email, password, fullName = "") => {
    setLoading(true);
    setAuthError(null);
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      throw new Error("Supabase is not configured. Please supply NEXT_PUBLIC_SUPABASE_URL.");
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Email and Password
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      throw new Error("Supabase is not configured.");
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google OAuth (Environment-Aware Redirect)
  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured with Google OAuth.");
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const redirectTo = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    return data;
  };

  // Save/Upsert Farmer Profile to Supabase
  const saveFarmerProfile = async (profileData) => {
    if (!isSupabaseConfigured || !supabase || !session?.user) {
      throw new Error("Authentication required to save profile.");
    }

    try {
      const payload = {
        auth_user_id: session.user.id,
        full_name: profileData.name || profileData.fullName || user?.name || "Farmer",
        email: session.user.email || "",
        phone_number: profileData.phone || profileData.phoneNumber || "",
        state: profileData.state || "",
        district: profileData.district || "",
        language: profileData.language || "English",
        experience_years: parseInt(profileData.experienceYears || 0, 10),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("farmers")
        .upsert(payload, { onConflict: "auth_user_id" })
        .select()
        .single();

      if (error) throw error;

      const formatted = {
        id: data.id,
        name: data.full_name,
        email: data.email,
        phone: data.phone_number,
        state: data.state,
        district: data.district,
        language: data.language,
        experienceYears: data.experience_years,
        authUserId: data.auth_user_id,
        hasProfile: true,
      };
      setFarmerProfile(formatted);
      setUser((prev) => ({ ...(prev || {}), ...formatted }));
      return formatted;
    } catch (err) {
      console.error("Failed to save farmer profile to Supabase:", err);
      throw err;
    }
  };

  // Sign Out
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signout error:", err);
      }
    }
    setUser(null);
    setSession(null);
    setFarmerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: farmerProfile || user,
        farmerProfile,
        loading,
        authError,
        isSupabaseConfigured,
        isAuthenticated: Boolean(session?.user),
        hasProfile: Boolean(farmerProfile?.id),
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        saveFarmerProfile,
        loadFarmerProfile,
        logout,
        accessToken: session?.access_token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      session: null,
      user: null,
      farmerProfile: null,
      loading: false,
      authError: null,
      isSupabaseConfigured: false,
      isAuthenticated: false,
      hasProfile: false,
      signUpWithEmail: async () => {},
      signInWithEmail: async () => {},
      signInWithGoogle: async () => {},
      saveFarmerProfile: async () => {},
      loadFarmerProfile: async () => {},
      logout: () => {},
      accessToken: null,
    };
  }
  return context;
}
