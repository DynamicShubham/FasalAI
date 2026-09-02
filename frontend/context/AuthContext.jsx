"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchApi } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: "farmer_demo_1",
    name: "Ramesh Patil",
    phone: "+91 98765 43210",
    state: "Maharashtra",
    district: "Nashik",
    isAuthenticated: true,
  });

  const [loading, setLoading] = useState(false);

  const loginDemo = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/farmer/demo-login", { method: "POST" });
      if (res.farmer) {
        setUser({ ...res.farmer, isAuthenticated: true });
      }
    } catch (e) {
      console.warn("Using fallback demo farmer");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginDemo, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: { name: "Ramesh Patil", isAuthenticated: true },
      loginDemo: () => {},
      logout: () => {},
      loading: false,
    };
  }
  return context;
}
