"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useInventory } from "@/context/InventoryContext";
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Paintbrush,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const { colorTheme, setColorTheme, displayMode, toggleDisplayMode, themePresets } = useTheme();
  const { resetToSampleData } = useInventory();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Centralized Theme & Color Tokens
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Control the primary and secondary brand colors centrally via CSS variables (`globals.css`). Any change propagates instantly across buttons, badges, metrics, and navigation.
        </p>
      </div>

      {/* Centralized Primary Color Palettes */}
      <Card className="border-border">
        <CardHeader className="p-5 border-b border-border/70">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">Select Active Brand Palette</CardTitle>
              <CardDescription className="text-xs">
                Switches the semantic tokens `--primary` and `--secondary` globally across all components.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themePresets.map((preset) => {
              const isSelected = colorTheme === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setColorTheme(preset.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-sm"
                      : "border-border hover:bg-muted/40 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center -space-x-1.5">
                        <div
                          className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: preset.primaryHex }}
                        />
                        <div
                          className="h-6 w-6 rounded-full border-2 border-background shadow-sm opacity-80"
                          style={{ backgroundColor: preset.secondaryHex }}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{preset.name}</h4>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {preset.primaryHex} • {preset.secondaryHex}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2">
                    <button
                      className="px-2.5 py-1 rounded text-[11px] font-semibold text-white shadow-xs"
                      style={{ backgroundColor: preset.primaryHex }}
                    >
                      Primary Button
                    </button>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium border"
                      style={{
                        backgroundColor: `${preset.primaryHex}15`,
                        borderColor: `${preset.primaryHex}30`,
                        color: preset.primaryHex,
                      }}
                    >
                      Badge Pill
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Display Mode (Light / Dark) */}
      <Card className="border-border">
        <CardHeader className="p-5 border-b border-border/70">
          <div className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">Display Appearance Mode</CardTitle>
              <CardDescription className="text-xs">
                Toggle between Light canvas and Dark enterprise workstation theme.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Current Mode: <span className="capitalize text-primary font-bold">{displayMode}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optimized for high contrast and reduced eye strain during extended inventory auditing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDisplayMode}
            className="text-xs font-semibold gap-2"
          >
            {displayMode === "light" ? (
              <>
                <Moon className="h-4 w-4" />
                Switch to Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                Switch to Light Mode
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Mock Data Card */}
      <Card className="border-border">
        <CardHeader className="p-5 border-b border-border/70">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base font-bold">Demonstration Sample Data</CardTitle>
              <CardDescription className="text-xs">
                Reset all products, stock levels, POs, and sales invoices back to original demonstration baseline.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Restore Baseline State</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clears local mutations and reloads the initial trial scenario with connected low-stock alerts.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={resetToSampleData}
            className="text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Data Store
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
