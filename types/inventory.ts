export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minLevel: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  location: string;
  godownId: string;
  status: StockStatus;
  updatedAt: string;
}

export type MovementType =
  | "PURCHASE_RECEIPT"
  | "SALE_DEDUCTION"
  | "MANUAL_ADJUSTMENT"
  | "GODOWN_TRANSFER";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number; // positive = added, negative = deducted
  previousQty: number;
  newQty: number;
  reference: string; // e.g. PO-1024 or INV-3049
  notes: string;
  timestamp: string;
}

export type PurchaseStatus = "RECEIVED" | "PENDING" | "CANCELLED";

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  supplierEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: PurchaseStatus;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  notes?: string;
}

export type SalesStatus = "COMPLETED" | "PENDING" | "CANCELLED";

export interface SalesOrder {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: SalesStatus;
  date: string;
  paymentMethod: string;
  notes?: string;
}

export interface Godown {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  capacity: number;
  utilized: number;
  manager: string;
  phone: string;
}
