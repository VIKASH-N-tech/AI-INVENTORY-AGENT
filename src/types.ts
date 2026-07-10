export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  stockLevel: number;
  unit: string;
  price: number;
  cost: number;
  minStock: number;
  warehouseId: string;
  supplierId: string;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  rating: number; // 1 to 5 stars
  performanceScore: number; // 0 to 100
  activeOrdersCount: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  qty: number;
  cost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'Pending' | 'Shipped' | 'Completed';
  totalAmount: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  expectedDeliveryDate: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number; // Max items it can hold
  usedSpace: number; // Current count of items stored
  rackLayout: {
    racksCount: number;
    shelvesPerRack: number;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: 'Stock In' | 'Stock Out' | 'Transfer' | 'PO Created' | 'PO Status Change' | 'Forecast Run';
  description: string;
  user: string;
}

export interface NotificationAlert {
  id: string;
  type: 'low_stock' | 'pending_delivery' | 'anomaly' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface ProductForecast {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  historicalSales: number[]; // Last 6 months sales e.g. [120, 115, 140, 130, 150, 160]
  predictedDemand: number; // AI forecast for next month
  recommendedReorderQty: number; // AI suggested reorder qty
  confidenceScore: number; // 0 - 100
  reasoning: string;
}

export interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'anomaly' | 'pricing';
  title: string;
  description: string;
  impactScore: number; // 0 - 100
  actionableStep: string;
}
