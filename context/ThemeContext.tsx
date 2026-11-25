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

  // Initialize theme and mode on mount
  useEffect(() => {
    try {
      const isHtmlDark = document.documentElement.classList.contains("dark");
      const savedMode = localStorage.getItem("sastha_mode") as DisplayMode;
      const effectiveMode: DisplayMode =
        savedMode === "dark" || savedMode === "light"
          ? savedMode
          : isHtmlDark || window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

      setDisplayMode(effectiveMode);

      const savedTheme = localStorage.getItem("sastha_theme") as ColorTheme;
      if (savedTheme && ["sapphire", "emerald", "violet", "amber"].includes(savedTheme)) {
        setColorThemeState(savedTheme);
      }

      // Synchronously apply to root
      const root = document.documentElement;
      if (effectiveMode === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }

      if (savedTheme && savedTheme !== "sapphire") {
        root.setAttribute("data-theme", savedTheme);
      } else {
        root.removeAttribute("data-theme");
      }
    } catch {
      // ignore SSR or storage restrictions
    }
    setMounted(true);
  }, []);

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      const nextMode: DisplayMode = prev === "light" ? "dark" : "light";
      const root = document.documentElement;
      if (nextMode === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
      try {
        localStorage.setItem("sastha_mode", nextMode);
      } catch {
        // ignore
      }
      return nextMode;
    });
  };

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    const root = document.documentElement;
    if (theme === "sapphire") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    try {
      localStorage.setItem("sastha_theme", theme);
    } catch {
      // ignore
    }
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
