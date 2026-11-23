"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "./ToastContainer";
import { useInventory } from "@/context/InventoryContext";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { formatCurrency } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lowStockCount, products, createSalesOrder, createPurchaseOrder } = useInventory();

  // Quick Sale Modal State
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [saleCustomer, setSaleCustomer] = useState("");
  const [saleEmail, setSaleEmail] = useState("");
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [salePaymentMethod, setSalePaymentMethod] = useState("Bank Transfer");

  // Quick Purchase Modal State
  const [isQuickPurchaseOpen, setIsQuickPurchaseOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState("");
  const [poEmail, setPoEmail] = useState("");
  const [poProductId, setPoProductId] = useState("");
  const [poQuantity, setPoQuantity] = useState(10);
  const [poStatus, setPoStatus] = useState<"PENDING" | "RECEIVED">("RECEIVED");

  // Handle Quick Sale Submit
  const handleQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === saleProductId);
    if (!product) return;

    const res = createSalesOrder({
      customer: saleCustomer || "Walk-in Customer",
      customerEmail: saleEmail || "customer@example.com",
      status: "COMPLETED",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: salePaymentMethod,
      totalAmount: product.sellingPrice * saleQuantity,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: saleQuantity,
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice * saleQuantity,
        },
      ],
      notes: "Created via Quick Sale action bar",
    });

    if (res.success) {
      setIsQuickSaleOpen(false);
      setSaleCustomer("");
      setSaleProductId("");
      setSaleQuantity(1);
    }
  };

  // Handle Quick Purchase Submit
  const handleQuickPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === poProductId);
    if (!product) return;

    createPurchaseOrder({
      supplier: poSupplier || "Standard Supplier",
      supplierEmail: poEmail || "supplier@example.com",
      status: poStatus,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      totalAmount: product.costPrice * poQuantity,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: poQuantity,
          unitPrice: product.costPrice,
          subtotal: product.costPrice * poQuantity,
        },
      ],
      notes: `Restock batch (${poStatus === "RECEIVED" ? "Immediately Received & Added to Stock" : "Pending Arrival"})`,
    });

    setIsQuickPurchaseOpen(false);
    setPoSupplier("");
    setPoProductId("");
    setPoQuantity(10);
  };

  const selectedSaleProduct = products.find((p) => p.id === saleProductId);
  const selectedPOProduct = products.find((p) => p.id === poProductId);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          lowStockCount={lowStockCount}
          onOpenQuickSale={() => {
            if (products.length > 0 && !saleProductId) setSaleProductId(products[0].id);
            setIsQuickSaleOpen(true);
          }}
          onOpenQuickPurchase={() => {
            if (products.length > 0 && !poProductId) setPoProductId(products[0].id);
            setIsQuickPurchaseOpen(true);
          }}
        />

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
        >
          {children}
        </motion.main>
      </div>

      <ToastContainer />

      {/* Quick Sale Modal */}
      <Modal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        title="Create Quick Sale Order"
        description="Records customer invoice and automatically deducts item quantity from live stock."
      >
        <form onSubmit={handleQuickSale} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Customer Name
            </label>
            <Input
              required
              placeholder="e.g. Apex Tech Solutions"
              value={saleCustomer}
              onChange={(e) => setSaleCustomer(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Product to Sell
            </label>
            <select
              value={saleProductId}
              onChange={(e) => setSaleProductId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- Choose Item --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} {p.unit} in stock) - {formatCurrency(p.sellingPrice)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                max={selectedSaleProduct ? selectedSaleProduct.quantity : 999}
                value={saleQuantity}
                onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
              />
              {selectedSaleProduct && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Available in stock: <span className="font-semibold text-foreground">{selectedSaleProduct.quantity}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Payment Method
              </label>
              <select
                value={salePaymentMethod}
                onChange={(e) => setSalePaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash / Net 30">Cash / Net 30</option>
              </select>
            </div>
          </div>

          {selectedSaleProduct && (
            <div className="rounded-lg bg-muted/60 p-3 border border-border flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(selectedSaleProduct.sellingPrice * saleQuantity)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuickSaleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedSaleProduct || selectedSaleProduct.quantity < saleQuantity}
            >
              Confirm Sale & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Purchase Modal */}
      <Modal
        isOpen={isQuickPurchaseOpen}
        onClose={() => setIsQuickPurchaseOpen(false)}
        title="Create Purchase Order"
        description="Procure inventory items. Marking as 'Received' automatically replenishes stock."
      >
        <form onSubmit={handleQuickPurchase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Supplier Name
            </label>
            <Input
              required
              placeholder="e.g. Apex Automation Components"
              value={poSupplier}
              onChange={(e) => setPoSupplier(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Product to Restock
            </label>
            <select
              value={poProductId}
              onChange={(e) => setPoProductId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- Choose Item --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.quantity} {p.unit}) - Cost: {formatCurrency(p.costPrice)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Restock Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={poQuantity}
                onChange={(e) => setPoQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Initial Status
              </label>
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value as "PENDING" | "RECEIVED")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="RECEIVED">Received (Auto-increase stock)</option>
                <option value="PENDING">Pending Arrival</option>
              </select>
            </div>
          </div>

          {selectedPOProduct && (
            <div className="rounded-lg bg-muted/60 p-3 border border-border flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">PO Total Value:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(selectedPOProduct.costPrice * poQuantity)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuickPurchaseOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" disabled={!selectedPOProduct}>
              {poStatus === "RECEIVED" ? "Add to Stock Immediately" : "Create Pending PO"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
