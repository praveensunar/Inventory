"use client";

import React, { useState, useMemo } from "react";
import {
  Menu,
  Search,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Command,
  Package,
  ShoppingCart,
  Receipt,
  Warehouse,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Button } from "./ui/Button";
import Link from "next/link";
import { useInventory } from "@/context/InventoryContext";
import { Modal } from "./ui/Modal";
import { formatCurrency } from "@/lib/utils";

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
  const { products, purchaseOrders, salesOrders, godowns, receivePurchaseOrder } = useInventory();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Search Results across modules
  const matchingProducts = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 4);
  }, [products, query]);

  const matchingPOs = useMemo(() => {
    if (!query.trim()) return [];
    return purchaseOrders
      .filter(
        (po) =>
          po.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          po.supplier.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3);
  }, [purchaseOrders, query]);

  const matchingSales = useMemo(() => {
    if (!query.trim()) return [];
    return salesOrders
      .filter(
        (so) =>
          so.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
          so.customer.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3);
  }, [salesOrders, query]);

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

        {/* Global Search Bar (Interactive Command Palette) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center justify-between w-64 md:w-80 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-background transition-all shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Search inventory, orders, SKUs...</span>
          </div>
          <kbd className="hidden md:inline-flex h-4 items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 ? (
          <Link
            href="/stock?filter=low"
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all shadow-xs"
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

      {/* Global Interactive Command Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setQuery("");
        }}
        title="Universal Quick Search"
        description="Instant lookup across stock inventory, purchase shipments, sales invoices, and warehouses."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Type product name, SKU (e.g. SAS-LBL), supplier, or invoice..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/90 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Quick Suggestions when empty */}
          {!query.trim() && (
            <div className="py-4 text-xs text-muted-foreground space-y-3">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/70 block">
                Quick Navigation Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/stock?filter=low"
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 transition-colors text-foreground"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>View All Low Stock Items</span>
                </Link>
                <Link
                  href="/purchases"
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 transition-colors text-foreground"
                >
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Pending Inbound Shipments</span>
                </Link>
                <Link
                  href="/sales"
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 transition-colors text-foreground"
                >
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  <span>Completed Sales Invoices</span>
                </Link>
                <Link
                  href="/godown"
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 transition-colors text-foreground"
                >
                  <Warehouse className="h-4 w-4 text-violet-500" />
                  <span>Regional Godowns & Hubs</span>
                </Link>
              </div>
            </div>
          )}

          {/* Filtered Search Results */}
          {query.trim() && (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {/* Matching Products */}
              {matchingProducts.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Inventory SKUs ({matchingProducts.length})
                  </span>
                  <div className="space-y-1">
                    {matchingProducts.map((p) => (
                      <Link
                        key={p.id}
                        href="/stock"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-semibold text-foreground">{p.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground ml-2">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-foreground">
                            {p.quantity} {p.unit}
                          </span>
                          <span className="text-muted-foreground">({formatCurrency(p.costPrice)})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching POs */}
              {matchingPOs.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Purchase Orders ({matchingPOs.length})
                  </span>
                  <div className="space-y-1">
                    {matchingPOs.map((po) => (
                      <Link
                        key={po.id}
                        href="/purchases"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-emerald-500" />
                          <div>
                            <span className="font-bold font-mono text-foreground">{po.orderNumber}</span>
                            <span className="text-muted-foreground ml-2">{po.supplier}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(po.totalAmount)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Sales */}
              {matchingSales.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Sales Invoices ({matchingSales.length})
                  </span>
                  <div className="space-y-1">
                    {matchingSales.map((so) => (
                      <Link
                        key={so.id}
                        href="/sales"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-bold font-mono text-foreground">{so.invoiceNumber}</span>
                            <span className="text-muted-foreground ml-2">{so.customer}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(so.totalAmount)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {matchingProducts.length === 0 &&
                matchingPOs.length === 0 &&
                matchingSales.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No results found for &quot;{query}&quot;.
                  </div>
                )}
            </div>
          )}
        </div>
      </Modal>
    </header>
  );
}
