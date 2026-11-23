"use client";

import React from "react";
import { Menu, Search, AlertTriangle, ArrowUpRight, Plus } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Button } from "./ui/Button";
import Link from "next/link";

interface HeaderProps {
  onToggleSidebar: () => void;
  lowStockCount?: number;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
}

export function Header({
  onToggleSidebar,
  lowStockCount = 0,
  onOpenQuickSale,
  onOpenQuickPurchase,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 md:px-8 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar mockup */}
        <div className="hidden sm:flex items-center relative w-64 md:w-80">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search items, SKU, orders..."
            className="w-full rounded-lg border border-border bg-background/60 pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-3">
        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 ? (
          <Link
            href="/stock?filter=low"
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>{lowStockCount} Low Stock</span>
          </Link>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            <span>● Stock Optimal</span>
          </div>
        )}

        {/* Centralized Theme Switcher */}
        <ThemeSwitcher />

        {/* Quick Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {onOpenQuickPurchase && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuickPurchase}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Purchase
            </Button>
          )}

          {onOpenQuickSale && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenQuickSale}
              className="text-xs font-semibold gap-1.5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              New Sale
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
