"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Warehouse,
  Sliders,
  Boxes,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Stock Inventory",
    href: "/stock",
    icon: Package,
    badge: "Live",
  },
  {
    name: "Purchase Orders",
    href: "/purchases",
    icon: ShoppingCart,
    badge: null,
  },
  {
    name: "Sales & Invoices",
    href: "/sales",
    icon: Receipt,
    badge: null,
  },
  {
    name: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "Godown / Locations",
    href: "/godown",
    icon: Warehouse,
    badge: "Multi-Hub",
  },
  {
    name: "Theme & Controls",
    href: "/settings",
    icon: Sliders,
    badge: null,
  },
];

interface SidebarProps {
  lowStockCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ lowStockCount = 0, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur transition-transform duration-300 md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border/80 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-foreground">SasthaStock</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Inventory Operations</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Core Modules
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {/* Active indicator pill with smooth Framer Motion spring */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-lg bg-primary/10 border-l-4 border-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn("relative z-10 h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="relative z-10 flex-1 truncate">{item.name}</span>

                {item.badge && (
                  <span className="relative z-10 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {item.badge}
                  </span>
                )}

                {item.name === "Stock Inventory" && lowStockCount > 0 && (
                  <span className="relative z-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.2 text-[10px] font-bold">
                    {lowStockCount} low
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Summary Pill at Bottom */}
      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-transparent to-secondary/30 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Connected Workflow</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Purchases auto-increase stock, sales deduct inventory, and low stock streams to Dashboard.
          </p>
        </div>
      </div>
    </aside>
  );
}
