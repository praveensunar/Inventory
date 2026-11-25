"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInventory } from "@/context/InventoryContext";
import {
  ShoppingCart,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  PackageCheck,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderItem, PurchaseOrder, PurchaseStatus } from "@/types/inventory";

export default function PurchasesPage() {
  const {
    purchaseOrders,
    products,
    receivePurchaseOrder,
    createPurchaseOrder,
    totalPurchasesAmount,
    pendingPurchasesCount,
    addSamplePendingPO,
  } = useInventory();

  // Active view: Orders vs Suppliers
  const [activeTab, setActiveTab] = useState<"orders" | "suppliers">("orders");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // New PO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [poStatus, setPoStatus] = useState<PurchaseStatus>("PENDING");
  const [notes, setNotes] = useState("");

  // Line Items in New PO
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || "",
      productName: products[0]?.name || "",
      sku: products[0]?.sku || "",
      quantity: 10,
      unitPrice: products[0]?.costPrice || 500,
      subtotal: (products[0]?.costPrice || 500) * 10,
    },
  ]);

  // Unique suppliers directory list
  const uniqueSuppliers = useMemo(() => {
    const map: Record<string, { name: string; email: string; ordersCount: number; totalSpend: number; lastOrder: string }> = {};
    purchaseOrders.forEach((po) => {
      if (!map[po.supplier]) {
        map[po.supplier] = {
          name: po.supplier,
          email: po.supplierEmail,
          ordersCount: 0,
          totalSpend: 0,
          lastOrder: po.orderDate,
        };
      }
      map[po.supplier].ordersCount += 1;
      map[po.supplier].totalSpend += po.totalAmount;
      if (po.orderDate > map[po.supplier].lastOrder) {
        map[po.supplier].lastOrder = po.orderDate;
      }
    });
    return Object.values(map);
  }, [purchaseOrders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  // Add Item to New PO Form
  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setOrderItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        sku: defaultProd.sku,
        quantity: 5,
        unitPrice: defaultProd.costPrice,
        subtotal: defaultProd.costPrice * 5,
      },
    ]);
  };

  // Remove Item from New PO Form
  const handleRemoveLineItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item in New PO Form
  const handleItemChange = (index: number, field: string, value: any) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          item.productId = prod.id;
          item.productName = prod.name;
          item.sku = prod.sku;
          item.unitPrice = prod.costPrice;
          item.subtotal = item.quantity * prod.costPrice;
        }
      } else if (field === "quantity") {
        const qty = parseInt(value) || 1;
        item.quantity = qty;
        item.subtotal = qty * item.unitPrice;
      } else if (field === "unitPrice") {
        const price = parseFloat(value) || 0;
        item.unitPrice = price;
        item.subtotal = item.quantity * price;
      }

      updated[index] = item;
      return updated;
    });
  };

  const calculatedTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Submit PO
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) return;

    createPurchaseOrder({
      supplier: supplier || "Direct Wholesaler Ltd",
      supplierEmail: supplierEmail || "orders@wholesaler.com",
      status: poStatus,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate,
      totalAmount: calculatedTotal,
      items: orderItems,
      notes: notes || "Procurement batch order",
    });

    setIsCreateModalOpen(false);
    setSupplier("");
    setSupplierEmail("");
    setNotes("");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["PO Number", "Supplier", "Items Count", "Total Amount (INR)", "Status", "Order Date", "Received Date", "Notes"];
    const rows = filteredOrders.map((po) => [
      po.orderNumber,
      `"${po.supplier.replace(/"/g, '""')}"`,
      po.items.length,
      po.totalAmount,
      po.status,
      po.orderDate,
      po.receivedDate || "N/A",
      `"${(po.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sastha_Purchase_Orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Purchase Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage procurement, supplier orders, and incoming shipments. Receiving an order auto-increases inventory stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={addSamplePendingPO}
            className="text-xs font-semibold gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
            title="Inject a realistic pending shipment to test receiving"
          >
            <Plus className="h-3.5 w-3.5" />
            + Sample Pending PO
          </Button>

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
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {purchaseOrders.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All procurement records
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Received Value
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(totalPurchasesAmount)}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                Replenished to stock
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <PackageCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
          className={`cursor-pointer transition-all ${
            statusFilter === "PENDING" ? "ring-2 ring-amber-500" : ""
          } border-border bg-card/60 backdrop-blur`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Pending Shipments
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {pendingPurchasesCount} Orders
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ready to be received
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab(activeTab === "suppliers" ? "orders" : "suppliers")}
          className="border-border bg-card/60 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Active Suppliers
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {uniqueSuppliers.length} Vendors
              </h3>
              <p className="text-[11px] text-primary mt-0.5 font-medium">
                Click to view directory →
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher: Orders vs Suppliers */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Purchase Orders ({filteredOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "suppliers"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Suppliers Directory ({uniqueSuppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === "orders" && (
        <Card className="border-border">
          {/* Search & Filter Header */}
          <CardHeader className="p-4 sm:p-5 border-b border-border/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search PO#, supplier, or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                  Status:
                </span>
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                  {["ALL", "PENDING", "RECEIVED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                        statusFilter === st
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* PO Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Order Ref</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Ordered Date</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Line Items</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Total Amount</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No purchase orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po, index) => {
                    const isExpanded = expandedPoId === po.id;
                    const isPending = po.status === "PENDING";

                    return (
                      <React.Fragment key={`${po.id}-${index}`}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                            <button
                              onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                              className="flex items-center gap-1.5 hover:underline"
                            >
                              <span>{po.orderNumber}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{po.supplier}</div>
                            <div className="text-[10px] text-muted-foreground">{po.supplierEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {formatDate(po.orderDate)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-foreground">
                              {po.items.length} item(s)
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              ({po.items.reduce((acc, i) => acc + i.quantity, 0)} units)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {formatCurrency(po.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            {po.status === "RECEIVED" && (
                              <Badge variant="success">Received</Badge>
                            )}
                            {po.status === "PENDING" && (
                              <Badge variant="warning" pulse>Pending Delivery</Badge>
                            )}
                            {po.status === "CANCELLED" && (
                              <Badge variant="destructive">Cancelled</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => receivePurchaseOrder(po.id)}
                                className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm shadow-emerald-500/20"
                                title="Click to mark received and automatically increment stock items"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                Receive & Stock In
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                {po.receivedDate ? `Received ${formatDate(po.receivedDate)}` : "Stocked In"}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Itemized Breakdown */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr className="bg-muted/20">
                              <td colSpan={7} className="p-4 pl-12 border-b border-border/70">
                                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground">
                                      Itemized Consignment Details for {po.orderNumber}
                                    </span>
                                    {po.notes && (
                                      <span className="text-[11px] text-muted-foreground italic">
                                        Notes: {po.notes}
                                      </span>
                                    )}
                                  </div>

                                  <table className="w-full text-xs">
                                    <thead className="text-muted-foreground border-b border-border/60">
                                      <tr>
                                        <th className="py-1.5 font-medium">Product Name</th>
                                        <th className="py-1.5 font-medium">SKU</th>
                                        <th className="py-1.5 font-medium text-center">Quantity</th>
                                        <th className="py-1.5 font-medium text-right">Unit Cost</th>
                                        <th className="py-1.5 font-medium text-right">Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                      {po.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="py-2 font-medium text-foreground">{item.productName}</td>
                                          <td className="py-2 font-mono text-[11px] text-muted-foreground">{item.sku}</td>
                                          <td className="py-2 text-center font-bold text-foreground">{item.quantity}</td>
                                          <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                                          <td className="py-2 text-right font-semibold text-foreground">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {uniqueSuppliers.map((supp, idx) => (
            <Card key={idx} className="border-border p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    {supp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Last: {formatDate(supp.lastOrder)}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-sm line-clamp-1">{supp.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Mail className="h-3 w-3 text-primary" />
                  <span className="truncate">{supp.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground block">Procured</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(supp.totalSpend)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSupplier(supp.name);
                    setSupplierEmail(supp.email);
                    setIsCreateModalOpen(true);
                  }}
                  className="h-7 text-[10px] font-semibold gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Raise PO
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Purchase Order */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Purchase Order"
        description="Raise a PO for warehouse stock replenishment. Setting status to 'Received' will add items to stock instantly."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Supplier / Vendor *
              </label>
              <Input
                required
                placeholder="e.g. Apex Industrial Solutions"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Supplier Email
              </label>
              <Input
                type="email"
                placeholder="supplier@orders.com"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Expected Delivery Date
              </label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Order Status
              </label>
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value as PurchaseStatus)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PENDING">Pending (Awaiting delivery & inspection)</option>
                <option value="RECEIVED">Received (Increase stock immediately)</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Consignment Items ({orderItems.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                className="h-7 px-2 text-[11px] gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-lg border border-border bg-muted/30 items-center text-xs"
                >
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Cost"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 font-semibold text-right text-foreground">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <div className="col-span-1 text-right">
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(index)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        title="Remove line item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Internal PO Notes
            </label>
            <Input
              placeholder="e.g. Approved by procurement department for Q4 restocking."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={poStatus === "RECEIVED" ? "success" : "primary"}
              size="sm"
            >
              {poStatus === "RECEIVED" ? "Create & Stock In" : "Submit Purchase Order"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
