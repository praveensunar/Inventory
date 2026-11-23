"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/context/ThemeContext";
import {
  BarChart3,
  Package,
  Receipt,
  ShoppingCart,
  FileSpreadsheet,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ReportsPage() {
  const {
    products,
    salesOrders,
    purchaseOrders,
    totalStockValue,
    totalStockItems,
    totalSalesAmount,
    totalPurchasesAmount,
    lowStockCount,
    outOfStockCount,
  } = useInventory();

  const { colorTheme } = useTheme();

  const [activeReport, setActiveReport] = useState<"stock" | "sales" | "purchases">("stock");

  // Chart theme colors
  const themeColors = useMemo(() => {
    switch (colorTheme) {
      case "emerald":
        return ["#0D9488", "#14B8A6", "#2DD4BF", "#5EEAD4", "#99F6E4"];
      case "violet":
        return ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];
      case "amber":
        return ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"];
      case "sapphire":
      default:
        return ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];
    }
  }, [colorTheme]);

  // Top selling products by revenue
  const topSellingProducts = useMemo(() => {
    const map: Record<string, { name: string; sku: string; qtySold: number; revenue: number }> = {};
    salesOrders
      .filter((s) => s.status === "COMPLETED")
      .forEach((so) => {
        so.items.forEach((item) => {
          if (!map[item.productId]) {
            map[item.productId] = {
              name: item.productName,
              sku: item.sku,
              qtySold: 0,
              revenue: 0,
            };
          }
          map[item.productId].qtySold += item.quantity;
          map[item.productId].revenue += item.subtotal;
        });
      });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [salesOrders]);

  // Top suppliers by spend
  const topSuppliers = useMemo(() => {
    const map: Record<string, { supplier: string; ordersCount: number; spend: number }> = {};
    purchaseOrders.forEach((po) => {
      if (!map[po.supplier]) {
        map[po.supplier] = { supplier: po.supplier, ordersCount: 0, spend: 0 };
      }
      map[po.supplier].ordersCount += 1;
      map[po.supplier].spend += po.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [purchaseOrders]);

  // Category breakdown for stock report
  const categoryStockData = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; value: number }> = {};
    products.forEach((p) => {
      if (!map[p.category]) {
        map[p.category] = { count: 0, totalQty: 0, value: 0 };
      }
      map[p.category].count += 1;
      map[p.category].totalQty += p.quantity;
      map[p.category].value += p.quantity * p.costPrice;
    });
    return Object.entries(map).map(([category, stats]) => ({
      category,
      ...stats,
    }));
  }, [products]);

  // Export handlers
  const handleExportStockReport = () => {
    const headers = ["Category", "SKU Count", "Total Units", "Valuation (INR)"];
    const rows = categoryStockData.map((c) => [
      c.category,
      c.count,
      c.totalQty,
      c.value,
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

  const handleExportSalesReport = () => {
    const headers = ["Product Name", "SKU", "Units Sold", "Total Revenue (INR)"];
    const rows = topSellingProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.qtySold,
      p.revenue,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sastha_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPurchasesReport = () => {
    const headers = ["Supplier Name", "Orders Placed", "Total Spend (INR)"];
    const rows = topSuppliers.map((s) => [
      `"${s.supplier.replace(/"/g, '""')}"`,
      s.ordersCount,
      s.spend,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sastha_Procurement_Report_${new Date().toISOString().split("T")[0]}.csv`);
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
            Operational Intelligence & Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Aggregated audits and performance metrics for stock turnover, sales volume, and vendor procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeReport === "stock" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportStockReport}
              className="text-xs font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download Stock Report
            </Button>
          )}
          {activeReport === "sales" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSalesReport}
              className="text-xs font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download Sales Report
            </Button>
          )}
          {activeReport === "purchases" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPurchasesReport}
              className="text-xs font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download Purchase Report
            </Button>
          )}
        </div>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveReport("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeReport === "stock"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Stock Report</span>
        </button>

        <button
          onClick={() => setActiveReport("sales")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeReport === "sales"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Sales Report</span>
        </button>

        <button
          onClick={() => setActiveReport("purchases")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeReport === "purchases"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Purchase Report</span>
        </button>
      </div>

      {/* 1. STOCK REPORT TAB */}
      {activeReport === "stock" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Asset Value
                </span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalStockValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Across {totalStockItems} total on-hand units
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Healthy Stock Ratio
                </span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.round(((products.length - lowStockCount - outOfStockCount) / Math.max(1, products.length)) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {products.length - lowStockCount - outOfStockCount} of {products.length} SKUs optimal
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reorder Deficit
                </span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {lowStockCount + outOfStockCount} SKUs
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requiring purchase replenishment
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold">Category Distribution Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Asset concentration and unit count per classification.
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Tracked SKUs</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">On-Hand Quantity</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Category Valuation</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categoryStockData.map((cat, idx) => {
                    const share = Math.round((cat.value / Math.max(1, totalStockValue)) * 100);
                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{cat.category}</td>
                        <td className="py-3 px-4 text-center font-mono">{cat.count}</td>
                        <td className="py-3 px-4 text-center font-bold text-foreground">{cat.totalQty}</td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(cat.value)}</td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 2. SALES REPORT TAB */}
      {activeReport === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Gross Billed Revenue
                </span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalSalesAmount)}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  {salesOrders.length} total customer invoices
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Units Dispatched
                </span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {salesOrders.reduce((acc, so) => acc + so.items.reduce((a, i) => a + i.quantity, 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fulfilled to customers
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fulfillment Success
                </span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.round((salesOrders.filter((s) => s.status === "COMPLETED").length / Math.max(1, salesOrders.length)) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Orders dispatched without delay
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Chart */}
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold">Top Products by Revenue</CardTitle>
              <CardDescription className="text-xs">
                Volume and sales revenue generated across customer invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSellingProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                  <XAxis type="number" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={120} tickFormatter={(name) => name.slice(0, 15) + "..."} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold">Itemized Sales Ledger</CardTitle>
              <CardDescription className="text-xs">
                Items driving highest customer turnover and fulfillment demand.
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Item Name</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">SKU</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Units Sold</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topSellingProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{p.sku}</td>
                      <td className="py-3 px-4 text-center font-bold text-foreground">{p.qtySold}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. PURCHASE REPORT TAB */}
      {activeReport === "purchases" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Procurement Spend
                </span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalPurchasesAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Across {purchaseOrders.length} purchase orders
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Received Consignments
                </span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {purchaseOrders.filter((p) => p.status === "RECEIVED").length}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspected and added to stock
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  In-Transit Orders
                </span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {purchaseOrders.filter((p) => p.status === "PENDING").length}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Awaiting arrival at warehouses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold">Supplier Procurement Spend Summary</CardTitle>
              <CardDescription className="text-xs">
                Vendor volume and expenditure breakdown.
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Vendor / Supplier</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Purchase Orders</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Total Outlay (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topSuppliers.map((s, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{s.supplier}</td>
                      <td className="py-3 px-4 text-center font-bold text-foreground">{s.ordersCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-primary">
                        {formatCurrency(s.spend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
