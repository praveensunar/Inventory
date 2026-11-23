"use client";

import React, { useState } from "react";
import { Palette, Moon, Sun, Check } from "lucide-react";
import { useTheme, ColorTheme } from "@/context/ThemeContext";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeSwitcher() {
  const { colorTheme, setColorTheme, displayMode, toggleDisplayMode, themePresets } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60">
        {/* Color Palette Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-7 px-2.5 text-xs font-medium gap-1.5"
          title="Change Color Theme (Centralized Control)"
        >
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline capitalize font-semibold">{colorTheme}</span>
        </Button>

        {/* Light / Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDisplayMode}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={`Switch to ${displayMode === "light" ? "Dark" : "Light"} Mode`}
        >
          {displayMode === "light" ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          )}
        </Button>
      </div>

      {/* Palette Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-3"
            >
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">
                Centralized Color Palettes
              </div>
              <div className="space-y-1.5">
                {themePresets.map((preset) => {
                  const isSelected = colorTheme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setColorTheme(preset.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center -space-x-1">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-background shadow-xs"
                            style={{ backgroundColor: preset.primaryHex }}
                          />
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-background shadow-xs opacity-70"
                            style={{ backgroundColor: preset.secondaryHex }}
                          />
                        </div>
                        <span>{preset.name}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-2.5 border-t border-border/60 text-[11px] text-muted-foreground px-1 leading-relaxed">
                Tokens control all buttons, charts, badges, and accents across every module.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
