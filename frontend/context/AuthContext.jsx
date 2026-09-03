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
      } else {
        // Auto-provision an initial farmer record so foreign keys in other tables never fail
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        const userObj = activeSession?.user;
        const initialName = userObj?.user_metadata?.full_name || userObj?.email?.split("@")[0] || "Farmer";
        const { data: inserted } = await supabase
          .from("farmers")
          .upsert({
            auth_user_id: authUserId,
            full_name: initialName,
            email: userObj?.email || "",
            state: "Maharashtra",
            district: "Nashik",
            language: "English",
            experience_years: 5,
            updated_at: new Date().toISOString(),
          }, { onConflict: "auth_user_id" })
          .select()
          .maybeSingle();

        if (inserted) {
          const formatted = {
            id: inserted.id,
            name: inserted.full_name || initialName,
            email: inserted.email || "",
            phone: inserted.phone_number || "",
            state: inserted.state || "",
            district: inserted.district || "",
            language: inserted.language || "English",
            experienceYears: inserted.experience_years || 5,
            authUserId: inserted.auth_user_id,
            hasProfile: true,
          };
          setFarmerProfile(formatted);
          return formatted;
        }
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
      const nameStr = typeof fullName === "string" ? fullName : (fullName?.fullName || fullName?.name || "");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nameStr,
          },
        },
      });
      if (error) throw error;

      // If confirm email is disabled on Supabase, a session is returned immediately
      if (data?.session?.user) {
        try {
          await supabase.from("farmers").upsert({
            auth_user_id: data.session.user.id,
            full_name: nameStr || "Farmer",
            email: data.session.user.email || email,
            state: "Maharashtra",
            district: "Nashik",
            language: "English",
            experience_years: 5,
            updated_at: new Date().toISOString(),
          }, { onConflict: "auth_user_id" });
          await loadFarmerProfile(data.session.user.id);
        } catch (initErr) {
          console.warn("Initial farmer profile upsert note:", initErr);
        }
      }

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

      let profile = null;
      if (data?.session?.user) {
        setSession(data.session);
        profile = await loadFarmerProfile(data.session.user.id);
      }
      return { data, profile };
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
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured.");
    }

    let activeUserId = session?.user?.id;
    let activeUserEmail = session?.user?.email;

    if (!activeUserId) {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      activeUserId = activeSession?.user?.id;
      activeUserEmail = activeSession?.user?.email;
    }

    if (!activeUserId) {
      throw new Error("Authentication required to save profile.");
    }

    try {
      const payload = {
        auth_user_id: activeUserId,
        full_name: profileData.name || profileData.fullName || user?.name || "Farmer",
        email: activeUserEmail || profileData.email || "",
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
