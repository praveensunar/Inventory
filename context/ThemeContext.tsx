"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "sapphire" | "emerald" | "violet" | "amber";
export type DisplayMode = "light" | "dark";

interface ThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  displayMode: DisplayMode;
  toggleDisplayMode: () => void;
  themePresets: { id: ColorTheme; name: string; primaryHex: string; secondaryHex: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_PRESETS: { id: ColorTheme; name: string; primaryHex: string; secondaryHex: string }[] = [
  { id: "sapphire", name: "Royal Sapphire (Default)", primaryHex: "#2563EB", secondaryHex: "#64748B" },
  { id: "emerald", name: "Emerald Operations", primaryHex: "#0D9488", secondaryHex: "#71717A" },
  { id: "violet", name: "Linear Violet", primaryHex: "#7C3AED", secondaryHex: "#737373" },
  { id: "amber", name: "Industrial Amber", primaryHex: "#D97706", secondaryHex: "#78716C" },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("sapphire");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sastha_theme") as ColorTheme;
      const savedMode = localStorage.getItem("sastha_mode") as DisplayMode;
      if (savedTheme && ["sapphire", "emerald", "violet", "amber"].includes(savedTheme)) {
        setColorThemeState(savedTheme);
      }
      if (savedMode && ["light", "dark"].includes(savedMode)) {
        setDisplayMode(savedMode);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDisplayMode("dark");
      }
    } catch {
      // ignore SSR or storage restrictions
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    // Apply color theme
    if (colorTheme === "sapphire") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", colorTheme);
    }

    // Apply dark/light class
    if (displayMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem("sastha_theme", colorTheme);
      localStorage.setItem("sastha_mode", displayMode);
    } catch {
      // ignore
    }
  }, [colorTheme, displayMode, mounted]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        setColorTheme,
        displayMode,
        toggleDisplayMode,
        themePresets: THEME_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
