"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useInventory } from "@/context/InventoryContext";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  History,
  MoveRight,
  Warehouse,
  Boxes,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Product } from "@/types/inventory";

function StockContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");

  const {
    products,
    stockMovements,
    godowns,
    adjustStock,
    transferGodown,
    addProduct,
    updateProduct,
    deleteProduct,
    lowStockCount,
    outOfStockCount,
    totalStockValue,
    totalStockItems,
  } = useInventory();

  // Active view tab: "inventory" | "history"
  const [activeTab, setActiveTab] = useState<"inventory" | "history">("inventory");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    initialFilter === "low" ? "LOW_STOCK" : "ALL"
  );
  const [selectedGodown, setSelectedGodown] = useState("ALL");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<Product | null>(null);
  const [transferItem, setTransferItem] = useState<Product | null>(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Product | null>(null);

  // Add Item Form State
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newCategory, setNewCategory] = useState("Hardware");
  const [newQuantity, setNewQuantity] = useState(25);
  const [newMinLevel, setNewMinLevel] = useState(10);
  const [newUnit, setNewUnit] = useState("pcs");
  const [newCostPrice, setNewCostPrice] = useState(1000);
  const [newSellingPrice, setNewSellingPrice] = useState(1500);
  const [newGodownId, setNewGodownId] = useState(godowns[0]?.id || "g-1");
  const [newLocation, setNewLocation] = useState("Aisle 1 - Shelf 1");

  // Adjust Stock State
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  // Transfer State
  const [transferTargetGodownId, setTransferTargetGodownId] = useState(godowns[0]?.id || "");
  const [transferNotes, setTransferNotes] = useState("");

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "ALL" || p.status === selectedStatus;

      const matchesGodown =
        selectedGodown === "ALL" || p.godownId === selectedGodown;

      return matchesSearch && matchesCategory && matchesStatus && matchesGodown;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedGodown]);

  // Handle Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      name: newName,
      sku: newSku || "SAS-ITM-" + Math.floor(1000 + Math.random() * 9000),
      category: newCategory,
      quantity: Number(newQuantity),
      minLevel: Number(newMinLevel),
      unit: newUnit,
      costPrice: Number(newCostPrice),
      sellingPrice: Number(newSellingPrice),
      godownId: newGodownId,
      location: newLocation,
    });
    setIsAddModalOpen(false);
    setNewName("");
    setNewSku("");
  };

  // Handle Edit Item
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateProduct(editItem.id, {
      name: editItem.name,
      category: editItem.category,
      minLevel: Number(editItem.minLevel),
      costPrice: Number(editItem.costPrice),
      sellingPrice: Number(editItem.sellingPrice),
      location: editItem.location,
    });
    setEditItem(null);
  };

  // Handle Adjust Stock
  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    adjustStock(adjustItem.id, Number(adjustQty), adjustReason);
    setAdjustItem(null);
  };

  // Handle Transfer
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;
    transferGodown(transferItem.id, transferTargetGodownId, transferNotes);
    setTransferItem(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["SKU", "Item Name", "Category", "Quantity", "Min Level", "Unit", "Cost Price", "Selling Price", "Valuation", "Status", "Godown Location"];
    const rows = filteredProducts.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.quantity,
      p.minLevel,
      p.unit,
      p.costPrice,
      p.sellingPrice,
      p.quantity * p.costPrice,
      p.status,
      `"${p.location}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sastha_Stock_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Stock Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time multi-location inventory levels, safety thresholds, and audit movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total SKUs
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {products.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalStockItems} total units
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Stock Valuation
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(totalStockValue)}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                At cost price
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedStatus(selectedStatus === "LOW_STOCK" ? "ALL" : "LOW_STOCK")}
          className={`cursor-pointer transition-all ${selectedStatus === "LOW_STOCK" ? "ring-2 ring-amber-500" : ""
            } border-border bg-card/60 backdrop-blur`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Low Stock Warning
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {lowStockCount} Items
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Below safe threshold
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedStatus(selectedStatus === "OUT_OF_STOCK" ? "ALL" : "OUT_OF_STOCK")}
          className={`cursor-pointer transition-all ${selectedStatus === "OUT_OF_STOCK" ? "ring-2 ring-red-500" : ""
            } border-border bg-card/60 backdrop-blur`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Out of Stock
              </p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {outOfStockCount} Items
              </h3>
              <p className="text-[11px] text-red-500/80 mt-0.5">
                Requires restocking PO
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher: "Current Inventory" vs "Stock History Ledger" */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "inventory"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <Package className="h-4 w-4" />
          <span>Active Inventory ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <History className="h-4 w-4" />
          <span>Stock Movement Ledger ({stockMovements.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY ITEMS */}
      {activeTab === "inventory" && (
        <Card className="border-border">
          {/* Filter Bar */}
          <CardHeader className="p-4 sm:p-5 border-b border-border/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search item name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>

                {/* Status Select */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                {/* Godown Select */}
                <select
                  value={selectedGodown}
                  onChange={(e) => setSelectedGodown(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All Warehouses</option>
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.city} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Item / SKU</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Stock Level</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Unit Cost</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Valuation</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Location</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const pctOfSafety = Math.min(100, Math.round((p.quantity / (p.minLevel * 2)) * 100));
                    const godown = godowns.find((g) => g.id === p.godownId);

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          <div className="font-semibold text-foreground">{p.name}</div>
                          <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
                            {p.sku}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              {p.quantity}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {p.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${p.status === "OUT_OF_STOCK"
                                    ? "bg-red-500 w-0"
                                    : p.status === "LOW_STOCK"
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                style={{ width: `${Math.max(5, pctOfSafety)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              min: {p.minLevel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === "IN_STOCK" && (
                            <Badge variant="success">In Stock</Badge>
                          )}
                          {p.status === "LOW_STOCK" && (
                            <Badge variant="warning" pulse>Low Stock</Badge>
                          )}
                          {p.status === "OUT_OF_STOCK" && (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-muted-foreground">
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {formatCurrency(p.quantity * p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-foreground font-medium truncate max-w-[140px]">
                            {godown ? godown.city : "Central"}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {p.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAdjustItem(p);
                                setAdjustQty(p.quantity);
                                setAdjustReason("");
                              }}
                              className="h-7 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 gap-1"
                              title="Audit physical count"
                            >
                              <SlidersHorizontal className="h-3 w-3" />
                              <span>Count</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditItem({ ...p })}
                              className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1"
                              title="Edit item details"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmItem(p)}
                              className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-red-500 gap-1"
                              title="Delete SKU"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: STOCK MOVEMENT HISTORY */}
      {activeTab === "history" && (
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">
                Stock Movement Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Audited timeline of purchase receipts, sale deductions, and physical count corrections.
              </CardDescription>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              Total Recorded Events: {stockMovements.length}
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Item Details</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Event Type</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Qty Change</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Balance Before & After</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Reference Doc</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stockMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDate(mov.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{mov.productName}</div>
                        <span className="font-mono text-[10px] text-muted-foreground">{mov.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        {mov.type === "PURCHASE_RECEIPT" && (
                          <Badge variant="success">Purchase Receipt</Badge>
                        )}
                        {mov.type === "SALE_DEDUCTION" && (
                          <Badge variant="destructive">Sale Deduction</Badge>
                        )}
                        {mov.type === "MANUAL_ADJUSTMENT" && (
                          <Badge variant="secondary">Count Audit</Badge>
                        )}
                        {mov.type === "GODOWN_TRANSFER" && (
                          <Badge variant="default">Location Transfer</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-sm">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        <span className="text-muted-foreground">{mov.previousQty}</span>
                        <MoveRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
                        <span className="font-bold text-foreground">{mov.newQty}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-primary">
                        {mov.reference}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {mov.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Add New Item */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Item"
        description="Define product SKU, category, safety threshold, and default storage location."
        maxWidth="lg"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Item Name *
              </label>
              <Input
                required
                placeholder="e.g. Ultra HD Industrial Camera"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                SKU Code
              </label>
              <Input
                placeholder="e.g. SAS-CAM-09"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Category
              </label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Hardware"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Unit of Measure
              </label>
              <Input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="e.g. pcs, rolls, units"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Quantity
              </label>
              <Input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Min Safety Level *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={newMinLevel}
                onChange={(e) => setNewMinLevel(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Cost Price (₹) *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Selling Price (₹) *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Primary Godown
              </label>
              <select
                value={newGodownId}
                onChange={(e) => setNewGodownId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Specific Location / Bin
              </label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Aisle 3 - Rack B"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Existing Item */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit Item: ${editItem?.name}`}
        description="Modify SKU classification, pricing, or minimum threshold."
      >
        {editItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Item Name</label>
              <Input
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                <Input
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Min Safety Level</label>
                <Input
                  type="number"
                  value={editItem.minLevel}
                  onChange={(e) => setEditItem({ ...editItem, minLevel: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Cost Price (₹)</label>
                <Input
                  type="number"
                  value={editItem.costPrice}
                  onChange={(e) => setEditItem({ ...editItem, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Selling Price (₹)</label>
                <Input
                  type="number"
                  value={editItem.sellingPrice}
                  onChange={(e) => setEditItem({ ...editItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Location Details</label>
              <Input
                value={editItem.location}
                onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Delete Item Confirmation */}
      <Modal
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="Confirm Item Deletion"
        description="Are you sure you want to remove this SKU from active inventory?"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            You are about to delete <strong className="text-foreground">{deleteConfirmItem?.name}</strong> ({deleteConfirmItem?.sku}). This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteConfirmItem) {
                  deleteProduct(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }
              }}
            >
              Delete Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={`Adjust Stock: ${adjustItem?.name}`}
        description="Update physical count for audit or correction. This action is permanently logged to Stock History."
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3 bg-muted/60 rounded-xl border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Recorded Count:</span>
            <span className="font-bold text-foreground text-sm">
              {adjustItem?.quantity} {adjustItem?.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              New Physical Count ({adjustItem?.unit})
            </label>
            <Input
              type="number"
              min="0"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Reason for Adjustment
            </label>
            <Input
              required
              placeholder="e.g. Physical inventory cycle count audit / damaged goods write-off"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Commit Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Godown Location */}
      <Modal
        isOpen={!!transferItem}
        onClose={() => setTransferItem(null)}
        title={`Relocate Item: ${transferItem?.name}`}
        description="Transfer inventory between warehouses or reassign internal aisle location."
      >
        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Warehouse / Godown
            </label>
            <select
              value={transferTargetGodownId}
              onChange={(e) => setTransferTargetGodownId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} - {g.city} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Bin / Rack Location in New Hub
            </label>
            <Input
              placeholder="e.g. Zone Fast-Move Bay 4"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Relocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Stock Inventory...</div>}>
      <StockContent />
    </Suspense>
  );
}
