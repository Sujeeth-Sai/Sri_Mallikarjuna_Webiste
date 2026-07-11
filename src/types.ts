export interface Product {
  id: string;
  name: string;
  stock: number; // in KGs
  costPerKg: number; // ₹ Cost Price
  pricePerKg: number; // ₹ Selling Price
  status: 'In Stock' | 'Out of Stock' | 'Low Stock';
  reorderThreshold?: number; // reorder threshold in KGs
  createdAt: string;
  type?: 'RawMaterial' | 'FinishedGood'; // classification for cashew business: buy raw material vs sell finished product
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT'; // IN = Receive Stock, OUT = Ship Stock
  quantity: number; // in KGs
  pricePerKg: number; // cost per KG or selling price per KG
  date: string; // ISO date or localized
  notes?: string;
}

export interface SupplierCustomer {
  id: string;
  name: string;
  type: 'Supplier' | 'Customer';
  email: string;
  phone: string;
  address: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number; // ₹ Monthly Salary
}

export interface Attendance {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  // Map of staff ID to attendance status
  status: Record<string, 'Present' | 'Absent'>;
}

export interface Expense {
  id: string;
  description: string;
  amount: number; // ₹ Amount
  category: string;
  status: 'Settled' | 'Pending';
  date: string; // YYYY-MM-DD
}

export interface ActivityLog {
  id: string;
  type: 'product_add' | 'stock_in' | 'stock_out' | 'contact' | 'attendance' | 'expense';
  message: string;
  date: string; // ISO format or relative string
}

export type ViewType =
  | 'Dashboard'
  | 'Stock & Inventory'
  | 'Suppliers & Customers'
  | 'Staff & Attendance'
  | 'Expenses Ledger'
  | 'AI CFO Reports';

export type LanguageType = 'English' | 'Telugu';
