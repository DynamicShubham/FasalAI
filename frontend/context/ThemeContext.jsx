"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Check local storage
    const savedTheme = localStorage.getItem("fasalai-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // 2. Fall back to system preference
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setThemeState(initial);
      applyTheme(initial);
    }
  }, []);

  const applyTheme = (newTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    localStorage.setItem("fasalai-theme", next);
    applyTheme(next);
  };

  const setTheme = (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    setThemeState(newTheme);
    localStorage.setItem("fasalai-theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === "dark", mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light",
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
      mounted: false,
    };
  }
  return context;
}
