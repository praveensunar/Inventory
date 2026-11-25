"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import {
  Warehouse,
  MapPin,
  Phone,
  User,
  Boxes,
  ArrowRightLeft,
  Package,
  Plus,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/inventory";

export default function GodownPage() {
  const { godowns, products, transferGodown, addGodown } = useInventory();

  // Relocation Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [targetGodownId, setTargetGodownId] = useState(godowns[0]?.id || "");
  const [locationNotes, setLocationNotes] = useState("");

  // Add Godown Modal State
  const [isAddGodownOpen, setIsAddGodownOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState(10000);
  const [manager, setManager] = useState("");
  const [phone, setPhone] = useState("");

  // Selected Product detail modal
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !targetGodownId) return;
    transferGodown(selectedProductId, targetGodownId, locationNotes);
    setTransferModalOpen(false);
    setLocationNotes("");
  };

  const handleAddGodownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGodown({
      name,
      code: code || `GDN-${city.slice(0, 3).toUpperCase()}-0${godowns.length + 1}`,
      city,
      address,
      capacity: Number(capacity),
      utilized: 0,
      manager,
      phone,
    });
    setIsAddGodownOpen(false);
    setName("");
    setCode("");
    setCity("");
    setAddress("");
    setManager("");
    setPhone("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Godown & Multi-Warehouse Hubs
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage physical stock distribution across regional storage facilities, rack locations, and inter-hub transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddGodownOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Warehouse Hub
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setTransferModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer Between Godowns
          </Button>
        </div>
      </div>

      {/* Godowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {godowns.map((g) => {
          const itemsInGodown = products.filter((p) => p.godownId === g.id);
          const totalUnitsInGodown = itemsInGodown.reduce((acc, p) => acc + p.quantity, 0);
          const valuationInGodown = itemsInGodown.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
          const utilizationPct = Math.min(100, Math.round((totalUnitsInGodown / (g.capacity / 10)) * 100));

          return (
            <Card key={g.id} className="border-border flex flex-col hover:border-primary/40 transition-all">
              <CardHeader className="p-5 border-b border-border/70 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="font-mono text-[10px]">
                    {g.code}
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                  </span>
                </div>
                <CardTitle className="text-base font-bold mt-2">{g.name}</CardTitle>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{g.address}</span>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                {/* Capacity Utilization Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Capacity Utilization</span>
                    <span className="font-bold font-mono text-foreground">{utilizationPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilizationPct > 80
                          ? "bg-amber-500"
                          : utilizationPct > 50
                          ? "bg-primary"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(5, utilizationPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{totalUnitsInGodown} stored units</span>
                    <span>Max {g.capacity} capacity</span>
                  </div>
                </div>

                {/* Hub Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">SKUs Stored</span>
                    <span className="font-bold text-foreground text-sm">{itemsInGodown.length} Items</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Hub Valuation</span>
                    <span className="font-bold text-primary text-sm">{formatCurrency(valuationInGodown)}</span>
                  </div>
                </div>

                {/* Manager Contact */}
                <div className="space-y-1 text-xs border-t border-border/60 pt-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Manager: <strong className="text-foreground">{g.manager}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{g.phone}</span>
                  </div>
                </div>

                {/* Stored Items List */}
                <div className="border-t border-border/60 pt-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Stored Inventory Items ({itemsInGodown.length})
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {itemsInGodown.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">
                        No SKUs currently assigned to this hub.
                      </p>
                    ) : (
                      itemsInGodown.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setViewProduct(item)}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/70 cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="text-foreground font-medium truncate max-w-[150px]">
                              {item.name}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.location}</span>
                          </div>
                          <span className="font-bold font-mono text-primary text-xs">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal: Inter-Godown Relocation */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Inter-Godown Stock Relocation"
        description="Transfer inventory between warehouses. All movements are logged into the central audit ledger."
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Item to Move
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {products.map((p) => {
                const curGodown = godowns.find((g) => g.id === p.godownId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.quantity} {p.unit} in {curGodown?.city || "Central"})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Godown Destination
            </label>
            <select
              value={targetGodownId}
              onChange={(e) => setTargetGodownId(e.target.value)}
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
              Specific Rack / Bay Location
            </label>
            <Input
              placeholder="e.g. Zone Fast-Move Bay 4 - Shelf 2"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Relocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add New Warehouse Hub */}
      <Modal
        isOpen={isAddGodownOpen}
        onClose={() => setIsAddGodownOpen(false)}
        title="Add New Warehouse Facility"
        description="Register a new regional godown or transit depot to the distribution network."
      >
        <form onSubmit={handleAddGodownSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Facility Name *</label>
              <Input
                required
                placeholder="e.g. Hyderabad South Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City *</label>
              <Input
                required
                placeholder="e.g. Hyderabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Address *</label>
            <Input
              required
              placeholder="e.g. Shamshabad Logistics Hub, Hyderabad"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Code</label>
              <Input
                placeholder="e.g. GDN-HYD-04"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Capacity</label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 5000)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Phone</label>
              <Input
                placeholder="+91 98..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Hub Manager Name *</label>
            <Input
              required
              placeholder="e.g. Venkatesh Reddy"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddGodownOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Register Facility
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View SKU Details from Godown */}
      <Modal
        isOpen={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title={viewProduct?.name || "Product Details"}
        description={`SKU: ${viewProduct?.sku} | Location: ${viewProduct?.location}`}
      >
        {viewProduct && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Available Stock</span>
                <span className="text-lg font-bold text-foreground">
                  {viewProduct.quantity} {viewProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Min Safety Level</span>
                <span className="text-lg font-bold text-foreground">{viewProduct.minLevel} {viewProduct.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase">Cost Price</span>
                <span className="font-semibold text-foreground">{formatCurrency(viewProduct.costPrice)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase">Selling Price</span>
                <span className="font-semibold text-foreground">{formatCurrency(viewProduct.sellingPrice)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setViewProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
