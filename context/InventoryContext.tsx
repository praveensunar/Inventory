"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Product,
  PurchaseOrder,
  SalesOrder,
  StockMovement,
  Godown,
  StockStatus,
} from "@/types/inventory";
import {
  initialProducts,
  initialPurchaseOrders,
  initialSalesOrders,
  initialStockMovements,
  initialGodowns,
} from "@/data/initialData";
import { triggerCelebration } from "@/lib/confetti";

export interface ToastNotice {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

interface InventoryContextType {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  stockMovements: StockMovement[];
  godowns: Godown[];
  isLoaded: boolean;

  // Computed metrics
  totalStockValue: number;
  totalStockItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSalesAmount: number;
  totalPurchasesAmount: number;
  pendingPurchasesCount: number;
  completedSalesCount: number;

  // Actions
  receivePurchaseOrder: (orderId: string) => { success: boolean; message: string };
  fulfillSalesOrder: (orderId: string) => { success: boolean; message: string };
  createPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "orderNumber">) => PurchaseOrder;
  createSalesOrder: (so: Omit<SalesOrder, "id" | "invoiceNumber">) => { success: boolean; message: string; order?: SalesOrder };
  adjustStock: (productId: string, newQuantity: number, reason: string) => void;
  transferGodown: (productId: string, targetGodownId: string, locationNotes: string) => void;
  addProduct: (product: Omit<Product, "id" | "status" | "updatedAt">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addGodown: (godown: Omit<Godown, "id">) => Godown;
  addSamplePendingPO: () => void;
  resetToSampleData: () => void;

  // Notifications
  toasts: ToastNotice[];
  removeToast: (id: string) => void;
  addToast: (toast: Omit<ToastNotice, "id">) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function computeStatus(qty: number, minLevel: number): StockStatus {
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= minLevel) return "LOW_STOCK";
  return "IN_STOCK";
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const addToast = (toast: Omit<ToastNotice, "id">) => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    const newToast: ToastNotice = { ...toast, id };
    setToasts((prev) => [newToast, ...prev]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load from LocalStorage or seed with initial data
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem("sastha_products");
      const storedPOs = localStorage.getItem("sastha_pos");
      const storedSOs = localStorage.getItem("sastha_sos");
      const storedMovements = localStorage.getItem("sastha_movements");
      const storedGodowns = localStorage.getItem("sastha_godowns");

      if (storedProducts && storedPOs && storedSOs) {
        const parsedPOs: PurchaseOrder[] = JSON.parse(storedPOs);
        // If all POs in localStorage were already received, ensure fresh pending POs are available for testing
        const hasPending = parsedPOs.some((po) => po.status === "PENDING");
        if (!hasPending) {
          const existingIds = new Set(parsedPOs.map((po) => po.id));
          const freshPending = initialPurchaseOrders
            .filter((po) => po.status === "PENDING")
            .map((po) => {
              if (existingIds.has(po.id)) {
                return {
                  ...po,
                  id: "po-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                  orderNumber: "PO-2026-" + Math.floor(1060 + Math.random() * 200),
                };
              }
              return po;
            });
          setPurchaseOrders([...freshPending, ...parsedPOs]);
        } else {
          setPurchaseOrders(parsedPOs);
        }

        setProducts(JSON.parse(storedProducts));
        setSalesOrders(JSON.parse(storedSOs));
        setStockMovements(storedMovements ? JSON.parse(storedMovements) : initialStockMovements);
        setGodowns(storedGodowns ? JSON.parse(storedGodowns) : initialGodowns);
      } else {
        setProducts(initialProducts);
        setPurchaseOrders(initialPurchaseOrders);
        setSalesOrders(initialSalesOrders);
        setStockMovements(initialStockMovements);
        setGodowns(initialGodowns);
      }
    } catch {
      setProducts(initialProducts);
      setPurchaseOrders(initialPurchaseOrders);
      setSalesOrders(initialSalesOrders);
      setStockMovements(initialStockMovements);
      setGodowns(initialGodowns);
    }
    setIsLoaded(true);
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("sastha_products", JSON.stringify(products));
      localStorage.setItem("sastha_pos", JSON.stringify(purchaseOrders));
      localStorage.setItem("sastha_sos", JSON.stringify(salesOrders));
      localStorage.setItem("sastha_movements", JSON.stringify(stockMovements));
      localStorage.setItem("sastha_godowns", JSON.stringify(godowns));
    } catch {
      // ignore
    }
  }, [products, purchaseOrders, salesOrders, stockMovements, godowns, isLoaded]);

  // Core Action: Receive Purchase Order (Increases Stock)
  const receivePurchaseOrder = (orderId: string) => {
    const orderIndex = purchaseOrders.findIndex((po) => po.id === orderId);
    if (orderIndex === -1) {
      return { success: false, message: "Purchase order not found" };
    }

    const order = purchaseOrders[orderIndex];
    if (order.status === "RECEIVED") {
      return { success: false, message: "Purchase order has already been received" };
    }

    const now = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    // Increment stock quantities
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const itemInOrder = order.items.find((item) => item.productId === prod.id);
        if (!itemInOrder) return prod;

        const previousQty = prod.quantity;
        const newQty = previousQty + itemInOrder.quantity;
        const newStatus = computeStatus(newQty, prod.minLevel);

        newMovements.push({
          id: "mov-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "PURCHASE_RECEIPT",
          quantity: itemInOrder.quantity,
          previousQty,
          newQty,
          reference: order.orderNumber,
          notes: `Received from ${order.supplier}`,
          timestamp: now,
        });

        return {
          ...prod,
          quantity: newQty,
          status: newStatus,
          updatedAt: now,
        };
      })
    );

    // Append to stock movements
    setStockMovements((prev) => [...newMovements, ...prev]);

    // Update PO status to RECEIVED
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === orderId
          ? { ...po, status: "RECEIVED", receivedDate: now.split("T")[0] }
          : po
      )
    );

    triggerCelebration();

    addToast({
      type: "success",
      title: "Consignment Received & Stocked In!",
      message: `${order.orderNumber} received. Stock incremented for ${order.items.length} product(s).`,
    });

    return {
      success: true,
      message: `Stock updated successfully from ${order.orderNumber}`,
    };
  };

  // Core Action: Fulfill Pending Sales Order (Reduces Stock)
  const fulfillSalesOrder = (orderId: string) => {
    const order = salesOrders.find((so) => so.id === orderId);
    if (!order) return { success: false, message: "Order not found" };
    if (order.status === "COMPLETED") return { success: false, message: "Already completed" };

    // Validate stock
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.quantity < item.quantity) {
        addToast({
          type: "error",
          title: "Insufficient Stock to Fulfill",
          message: `Cannot dispatch ${item.productName}. Only ${prod?.quantity || 0} in stock.`,
        });
        return { success: false, message: "Insufficient stock" };
      }
    }

    const now = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    setProducts((prev) =>
      prev.map((prod) => {
        const itemSold = order.items.find((item) => item.productId === prod.id);
        if (!itemSold) return prod;

        const previousQty = prod.quantity;
        const newQty = Math.max(0, previousQty - itemSold.quantity);
        const newStatus = computeStatus(newQty, prod.minLevel);

        newMovements.push({
          id: "mov-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "SALE_DEDUCTION",
          quantity: -itemSold.quantity,
          previousQty,
          newQty,
          reference: order.invoiceNumber,
          notes: `Dispatched to ${order.customer}`,
          timestamp: now,
        });

        return {
          ...prod,
          quantity: newQty,
          status: newStatus,
          updatedAt: now,
        };
      })
    );

    setStockMovements((prev) => [...newMovements, ...prev]);

    setSalesOrders((prev) =>
      prev.map((so) => (so.id === orderId ? { ...so, status: "COMPLETED" } : so))
    );

    triggerCelebration();

    addToast({
      type: "success",
      title: "Invoice Dispatched & Fulfilled!",
      message: `${order.invoiceNumber} completed. Stock deducted from inventory.`,
    });

    return { success: true, message: "Order fulfilled" };
  };

  // Create Purchase Order
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, "id" | "orderNumber">) => {
    const id = "po-" + Date.now();
    const orderNumber = "PO-2026-" + Math.floor(1000 + Math.random() * 9000);
    const newPO: PurchaseOrder = {
      ...poData,
      id,
      orderNumber,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    if (newPO.status === "RECEIVED") {
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];

      setProducts((prevProducts) =>
        prevProducts.map((prod) => {
          const itemInOrder = newPO.items.find((item) => item.productId === prod.id);
          if (!itemInOrder) return prod;

          const previousQty = prod.quantity;
          const newQty = previousQty + itemInOrder.quantity;
          const newStatus = computeStatus(newQty, prod.minLevel);

          newMovements.push({
            id: "mov-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: "PURCHASE_RECEIPT",
            quantity: itemInOrder.quantity,
            previousQty,
            newQty,
            reference: orderNumber,
            notes: `Received immediately from ${newPO.supplier}`,
            timestamp: now,
          });

          return {
            ...prod,
            quantity: newQty,
            status: newStatus,
            updatedAt: now,
          };
        })
      );
      setStockMovements((prev) => [...newMovements, ...prev]);
      triggerCelebration();
    }

    addToast({
      type: "success",
      title: "Purchase Order Created",
      message: `${orderNumber} has been logged with ${newPO.items.length} line item(s).`,
    });

    return newPO;
  };

  // Create Sales Order (Reduces Stock)
  const createSalesOrder = (soData: Omit<SalesOrder, "id" | "invoiceNumber">) => {
    for (const item of soData.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        addToast({
          type: "error",
          title: "Product Not Found",
          message: `Item ${item.productName} does not exist in inventory.`,
        });
        return { success: false, message: `Product ${item.productName} not found` };
      }
      if (soData.status === "COMPLETED" && product.quantity < item.quantity) {
        addToast({
          type: "error",
          title: "Insufficient Stock!",
          message: `Cannot fulfill sale. ${product.name} only has ${product.quantity} in stock (requested ${item.quantity}).`,
        });
        return {
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, requested: ${item.quantity}`,
        };
      }
    }

    const id = "so-" + Date.now();
    const invoiceNumber = "INV-2026-" + Math.floor(8000 + Math.random() * 1999);
    const newSO: SalesOrder = {
      ...soData,
      id,
      invoiceNumber,
    };

    const now = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    if (newSO.status === "COMPLETED") {
      setProducts((prevProducts) =>
        prevProducts.map((prod) => {
          const itemSold = newSO.items.find((item) => item.productId === prod.id);
          if (!itemSold) return prod;

          const previousQty = prod.quantity;
          const newQty = Math.max(0, previousQty - itemSold.quantity);
          const newStatus = computeStatus(newQty, prod.minLevel);

          newMovements.push({
            id: "mov-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: "SALE_DEDUCTION",
            quantity: -itemSold.quantity,
            previousQty,
            newQty,
            reference: invoiceNumber,
            notes: `Sold to ${newSO.customer}`,
            timestamp: now,
          });

          return {
            ...prod,
            quantity: newQty,
            status: newStatus,
            updatedAt: now,
          };
        })
      );

      setStockMovements((prev) => [...newMovements, ...prev]);
      triggerCelebration();
    }

    setSalesOrders((prev) => [newSO, ...prev]);

    addToast({
      type: "success",
      title: "Invoice Billed & Recorded!",
      message: `${invoiceNumber} created. Stock deducted for ${newSO.items.length} item(s).`,
    });

    return { success: true, message: `Invoice ${invoiceNumber} created`, order: newSO };
  };

  // Adjust Stock manually
  const adjustStock = (productId: string, newQuantity: number, reason: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const previousQty = product.quantity;
    const diff = newQuantity - previousQty;
    const now = new Date().toISOString();
    const newStatus = computeStatus(newQuantity, product.minLevel);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, quantity: newQuantity, status: newStatus, updatedAt: now }
          : p
      )
    );

    const movement: StockMovement = {
      id: "mov-" + Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: "MANUAL_ADJUSTMENT",
      quantity: diff,
      previousQty,
      newQty: newQuantity,
      reference: "AUDIT-" + Math.floor(100 + Math.random() * 900),
      notes: reason || "Manual inventory cycle count",
      timestamp: now,
    };

    setStockMovements((prev) => [movement, ...prev]);

    addToast({
      type: "info",
      title: "Stock Audit Updated",
      message: `${product.name} quantity adjusted from ${previousQty} to ${newQuantity}.`,
    });
  };

  // Transfer Godown
  const transferGodown = (productId: string, targetGodownId: string, locationNotes: string) => {
    const product = products.find((p) => p.id === productId);
    const targetGodown = godowns.find((g) => g.id === targetGodownId);
    if (!product || !targetGodown) return;

    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, godownId: targetGodownId, location: locationNotes || `${targetGodown.name} - Bay 1`, updatedAt: now }
          : p
      )
    );

    const movement: StockMovement = {
      id: "mov-" + Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: "GODOWN_TRANSFER",
      quantity: product.quantity,
      previousQty: product.quantity,
      newQty: product.quantity,
      reference: "TRF-" + targetGodown.code,
      notes: `Transferred to ${targetGodown.name} (${locationNotes})`,
      timestamp: now,
    };

    setStockMovements((prev) => [movement, ...prev]);

    addToast({
      type: "info",
      title: "Stock Relocated",
      message: `${product.name} moved to ${targetGodown.name}.`,
    });
  };

  // Add Product
  const addProduct = (prodData: Omit<Product, "id" | "status" | "updatedAt">) => {
    const id = "prod-" + Date.now();
    const now = new Date().toISOString();
    const status = computeStatus(prodData.quantity, prodData.minLevel);
    const newProduct: Product = {
      ...prodData,
      id,
      status,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    addToast({
      type: "success",
      title: "New SKU Added",
      message: `${newProduct.name} is now tracked in inventory.`,
    });

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: now };
        if (updates.quantity !== undefined || updates.minLevel !== undefined) {
          updated.status = computeStatus(updated.quantity, updated.minLevel);
        }
        return updated;
      })
    );
    addToast({
      type: "info",
      title: "Product Updated",
      message: "Details saved successfully.",
    });
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast({
      type: "warning",
      title: "Product Deleted",
      message: prod ? `${prod.name} removed from inventory.` : "Item removed.",
    });
  };

  const addGodown = (godownData: Omit<Godown, "id">) => {
    const id = "g-" + Date.now();
    const newGodown: Godown = { ...godownData, id };
    setGodowns((prev) => [...prev, newGodown]);
    addToast({
      type: "success",
      title: "Warehouse Facility Added",
      message: `${newGodown.name} is now active.`,
    });
    return newGodown;
  };

  // Quick Action to inject a sample pending PO immediately
  const addSamplePendingPO = () => {
    const candidates = products.filter((p) => p.status === "LOW_STOCK" || p.status === "OUT_OF_STOCK");
    const targetProduct = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)] 
      : (products[0] || initialProducts[0]);
    if (!targetProduct) return;

    const suppliersList = [
      { name: "Apex Automation Components Ltd", email: "orders@apexautomation.in" },
      { name: "Global PackTech Supplies", email: "sales@packtechglobal.com" },
      { name: "ShieldTech Packaging Corp", email: "sales@shieldtechpkg.in" },
      { name: "Nova Micro Devices", email: "procurement@novamicro.com" },
      { name: "OmniCable Industries", email: "sales@omnicables.in" },
    ];
    const supplierObj = suppliersList[Math.floor(Math.random() * suppliersList.length)];
    const id = "po-" + Date.now();
    const poNum = "PO-2026-" + Math.floor(1050 + Math.random() * 500);
    const qty = targetProduct.status === "OUT_OF_STOCK" ? 50 : 25;
    const newPO: PurchaseOrder = {
      id,
      orderNumber: poNum,
      supplier: supplierObj.name,
      supplierEmail: supplierObj.email,
      items: [
        {
          productId: targetProduct.id,
          productName: targetProduct.name,
          sku: targetProduct.sku,
          quantity: qty,
          unitPrice: targetProduct.costPrice,
          subtotal: targetProduct.costPrice * qty,
        },
      ],
      totalAmount: targetProduct.costPrice * qty,
      status: "PENDING",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      notes: `Restocking consignment for ${targetProduct.name} (${targetProduct.sku})`,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    addToast({
      type: "info",
      title: "Pending Purchase Order Created",
      message: `${poNum} from ${supplierObj.name} added. Click 'Receive' to test stock increment!`,
    });
  };

  // Reset to initial mock dataset
  const resetToSampleData = () => {
    setProducts(initialProducts);
    setPurchaseOrders(initialPurchaseOrders);
    setSalesOrders(initialSalesOrders);
    setStockMovements(initialStockMovements);
    setGodowns(initialGodowns);
    try {
      localStorage.removeItem("sastha_products");
      localStorage.removeItem("sastha_pos");
      localStorage.removeItem("sastha_sos");
      localStorage.removeItem("sastha_movements");
      localStorage.removeItem("sastha_godowns");
    } catch {
      // ignore
    }
    addToast({
      type: "info",
      title: "Sample Data Restored",
      message: "Inventory reset to baseline trial scenario with pending shipments.",
    });
  };

  // Computed metrics
  const totalStockValue = products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
  const totalStockItems = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowStockCount = products.filter((p) => p.status === "LOW_STOCK").length;
  const outOfStockCount = products.filter((p) => p.status === "OUT_OF_STOCK").length;

  const totalSalesAmount = salesOrders
    .filter((so) => so.status === "COMPLETED")
    .reduce((acc, so) => acc + so.totalAmount, 0);

  const totalPurchasesAmount = purchaseOrders
    .filter((po) => po.status === "RECEIVED")
    .reduce((acc, po) => acc + po.totalAmount, 0);

  const pendingPurchasesCount = purchaseOrders.filter((po) => po.status === "PENDING").length;
  const completedSalesCount = salesOrders.filter((so) => so.status === "COMPLETED").length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        purchaseOrders,
        salesOrders,
        stockMovements,
        godowns,
        isLoaded,
        totalStockValue,
        totalStockItems,
        lowStockCount,
        outOfStockCount,
        totalSalesAmount,
        totalPurchasesAmount,
        pendingPurchasesCount,
        completedSalesCount,
        receivePurchaseOrder,
        fulfillSalesOrder,
        createPurchaseOrder,
        createSalesOrder,
        adjustStock,
        transferGodown,
        addProduct,
        updateProduct,
        deleteProduct,
        addGodown,
        addSamplePendingPO,
        resetToSampleData,
        toasts,
        removeToast,
        addToast,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
