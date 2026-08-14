"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "oss-theme";

export function ThemeProvider({ children }) {
  // The inline script in layout.js already set html.dark (or not) before
  // first paint, to avoid a flash of the wrong theme — this just reads that
  // same decision back into React state so the toggle UI reflects it.
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* private browsing, etc. */ }
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
