"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInventory } from "@/context/InventoryContext";
import {
  Receipt,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Users,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderItem, SalesOrder, SalesStatus } from "@/types/inventory";

export default function SalesPage() {
  const {
    salesOrders,
    products,
    createSalesOrder,
    totalSalesAmount,
    completedSalesCount,
  } = useInventory();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [expandedSoId, setExpandedSoId] = useState<string | null>(null);

  // Print / View Invoice Modal
  const [viewInvoice, setViewInvoice] = useState<SalesOrder | null>(null);

  // New Sale Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [saleStatus, setSaleStatus] = useState<SalesStatus>("COMPLETED");
  const [notes, setNotes] = useState("");

  // Line Items in New Sale
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || "",
      productName: products[0]?.name || "",
      sku: products[0]?.sku || "",
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 1000,
      subtotal: (products[0]?.sellingPrice || 1000) * 1,
    },
  ]);

  // Derived metrics
  const uniqueCustomersCount = useMemo(() => {
    return new Set(salesOrders.map((so) => so.customer)).size;
  }, [salesOrders]);

  const avgOrderValue = useMemo(() => {
    return salesOrders.length > 0 ? totalSalesAmount / Math.max(1, completedSalesCount) : 0;
  }, [salesOrders, totalSalesAmount, completedSalesCount]);

  // Filtered Sales
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((so) => {
      const matchesSearch =
        so.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        so.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        so.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || so.status === statusFilter;
      const matchesPayment = paymentFilter === "ALL" || so.paymentMethod === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [salesOrders, searchQuery, statusFilter, paymentFilter]);

  // Add Item to New Sale Form
  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const availableProd = products.find((p) => p.quantity > 0) || products[0];
    setOrderItems((prev) => [
      ...prev,
      {
        productId: availableProd.id,
        productName: availableProd.name,
        sku: availableProd.sku,
        quantity: 1,
        unitPrice: availableProd.sellingPrice,
        subtotal: availableProd.sellingPrice,
      },
    ]);
  };

  // Remove Item from New Sale Form
  const handleRemoveLineItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item in New Sale Form
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
          item.unitPrice = prod.sellingPrice;
          item.subtotal = item.quantity * prod.sellingPrice;
        }
      } else if (field === "quantity") {
        const qty = parseInt(value) || 1;
        item.quantity = qty;
        item.subtotal = qty * item.unitPrice;
      }

      updated[index] = item;
      return updated;
    });
  };

  const calculatedTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Check if any line item exceeds live inventory stock
  const stockShortages = useMemo(() => {
    return orderItems
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod || prod.quantity < item.quantity) {
          return {
            name: item.productName || prod?.name || "Item",
            available: prod ? prod.quantity : 0,
            requested: item.quantity,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [orderItems, products]);

  // Submit Sale Invoice
  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0 || stockShortages.length > 0) return;

    const res = createSalesOrder({
      customer: customer || "Enterprise Client",
      customerEmail: customerEmail || "billing@client.com",
      status: saleStatus,
      date: new Date().toISOString().split("T")[0],
      paymentMethod,
      totalAmount: calculatedTotal,
      items: orderItems,
      notes: notes || "Standard customer sales invoice",
    });

    if (res.success) {
      setIsCreateModalOpen(false);
      setCustomer("");
      setCustomerEmail("");
      setNotes("");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Invoice Number", "Customer", "Items Count", "Total Amount (INR)", "Payment Method", "Status", "Date", "Notes"];
    const rows = filteredOrders.map((so) => [
      so.invoiceNumber,
      `"${so.customer.replace(/"/g, '""')}"`,
      so.items.length,
      so.totalAmount,
      so.paymentMethod,
      so.status,
      so.date,
      `"${(so.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sastha_Sales_Invoices_${new Date().toISOString().split("T")[0]}.csv`);
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
            Sales & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Dispatch sales orders, bill clients, and fulfill customer invoices. Completing a sale automatically deducts items from inventory.
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
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Sales Invoice
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(totalSalesAmount)}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                {completedSalesCount} completed orders
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Average Order Value
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(avgOrderValue)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Per fulfilled invoice
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Customers Served
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {uniqueCustomersCount} Accounts
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Corporate & retail buyers
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
              <Users className="h-5 w-5" />
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
                Pending Orders
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {salesOrders.filter((s) => s.status === "PENDING").length} Orders
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Awaiting dispatch
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border">
        {/* Search & Filter Header */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoice#, customer, or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Payment filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net 30">Net 30</option>
              </select>

              {/* Status pill toggles */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                {["ALL", "COMPLETED", "PENDING"].map((st) => (
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

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Items Dispatched</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Payment Method</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No sales invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((so) => {
                  const isExpanded = expandedSoId === so.id;

                  return (
                    <React.Fragment key={so.id}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                          <button
                            onClick={() => setExpandedSoId(isExpanded ? null : so.id)}
                            className="flex items-center gap-1.5 hover:underline"
                          >
                            <span>{so.invoiceNumber}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{so.customer}</div>
                          <div className="text-[10px] text-muted-foreground">{so.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {formatDate(so.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-foreground">
                            {so.items.length} item(s)
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({so.items.reduce((acc, i) => acc + i.quantity, 0)} units)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {so.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {formatCurrency(so.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          {so.status === "COMPLETED" && (
                            <Badge variant="success">Fulfilled</Badge>
                          )}
                          {so.status === "PENDING" && (
                            <Badge variant="warning" pulse>Pending Dispatch</Badge>
                          )}
                          {so.status === "CANCELLED" && (
                            <Badge variant="destructive">Cancelled</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewInvoice(so)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            View Bill
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Line Items Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr className="bg-muted/20">
                            <td colSpan={8} className="p-4 pl-12 border-b border-border/70">
                              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-foreground">
                                    Dispatched Items Breakdown for {so.invoiceNumber}
                                  </span>
                                  {so.notes && (
                                    <span className="text-[11px] text-muted-foreground italic">
                                      Notes: {so.notes}
                                    </span>
                                  )}
                                </div>

                                <table className="w-full text-xs">
                                  <thead className="text-muted-foreground border-b border-border/60">
                                    <tr>
                                      <th className="py-1.5 font-medium">Product Name</th>
                                      <th className="py-1.5 font-medium">SKU</th>
                                      <th className="py-1.5 font-medium text-center">Quantity Deducted</th>
                                      <th className="py-1.5 font-medium text-right">Unit Price</th>
                                      <th className="py-1.5 font-medium text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40">
                                    {so.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="py-2 font-medium text-foreground">{item.productName}</td>
                                        <td className="py-2 font-mono text-[11px] text-muted-foreground">{item.sku}</td>
                                        <td className="py-2 text-center font-bold text-foreground">-{item.quantity}</td>
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

      {/* Modal: Create Sales Invoice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sales Invoice"
        description="Fulfill order for customer. Completing this sale directly decrements stock quantity from live inventory."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer / Client Name *
              </label>
              <Input
                required
                placeholder="e.g. Reliance Logistics Pvt Ltd"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer Email
              </label>
              <Input
                type="email"
                placeholder="procurement@client.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Payment Terms
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Instant</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net 30">Net 30 Corporate Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Invoice Status
              </label>
              <select
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value as SalesStatus)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="COMPLETED">Completed (Fulfill & Deduct Stock Now)</option>
                <option value="PENDING">Pending (Proforma order)</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Items to Bill & Ship ({orderItems.length})
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
              {orderItems.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);
                const isShortage = prod && prod.quantity < item.quantity;

                return (
                  <div
                    key={index}
                    className={`grid grid-cols-12 gap-2 p-2.5 rounded-lg border ${
                      isShortage ? "border-red-500/50 bg-red-500/5" : "border-border bg-muted/30"
                    } items-center text-xs`}
                  >
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.quantity} {p.unit} in stock)
                          </option>
                        ))}
                      </select>
                      {prod && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Stock available: <span className="font-semibold">{prod.quantity}</span> | Price: {formatCurrency(prod.sellingPrice)}
                        </div>
                      )}
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
                    <div className="col-span-3 font-semibold text-right text-foreground">
                      {formatCurrency(item.subtotal)}
                    </div>
                    <div className="col-span-1 text-right">
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="text-muted-foreground hover:text-red-500 font-bold p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shortage Alert */}
            {stockShortages.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Insufficient inventory stock:</span>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    {stockShortages.map((s, idx) => (
                      <li key={idx}>
                        {s?.name}: requested {s?.requested}, but only {s?.available} currently in stock.
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
              <span className="text-muted-foreground">Invoice Grand Total:</span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Invoice Memo / Reference
            </label>
            <Input
              placeholder="e.g. Purchase order PO-IND-7781 / Delivered via Express Cargo"
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
              variant="primary"
              size="sm"
              disabled={stockShortages.length > 0 || orderItems.length === 0}
            >
              Generate Invoice & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View & Print Invoice */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={`Invoice: ${viewInvoice?.invoiceNumber}`}
        description="Official commercial tax invoice preview."
        maxWidth="lg"
      >
        {viewInvoice && (
          <div className="space-y-6 p-2">
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    SS
                  </div>
                  <span className="font-bold text-lg text-foreground">SasthaSoft Logistics</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Plot 42, Ambattur Industrial Estate, Chennai, TN 600058
                </p>
                <p className="text-[11px] text-muted-foreground">GSTIN: 33AAACS1234F1Z8</p>
              </div>

              <div className="text-right">
                <Badge variant={viewInvoice.status === "COMPLETED" ? "success" : "warning"}>
                  {viewInvoice.status}
                </Badge>
                <div className="font-mono text-sm font-bold text-foreground mt-1.5">
                  {viewInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(viewInvoice.date)}</div>
              </div>
            </div>

            {/* Billed To */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Billed To:
              </span>
              <div className="text-sm font-bold text-foreground mt-0.5">{viewInvoice.customer}</div>
              <div className="text-xs text-muted-foreground">{viewInvoice.customerEmail}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Payment Method: <span className="font-semibold text-foreground">{viewInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {viewInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium text-foreground">
                      <div>{item.productName}</div>
                      <span className="font-mono text-[10px] text-muted-foreground">{item.sku}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-foreground">{item.quantity}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-semibold text-foreground">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Summary */}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                {viewInvoice.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    Note: {viewInvoice.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Total Paid:</span>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(viewInvoice.totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Tax Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
