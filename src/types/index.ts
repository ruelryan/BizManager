export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'starter' | 'pro';
  subscriptionExpiry?: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  currentStock: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  items: SaleItem[];
  total: number;
  paymentType: 'cash' | 'card' | 'transfer' | 'gcash';
  status: 'paid' | 'pending' | 'overdue';
  date: Date;
  dueDate?: Date;
  invoiceNumber?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'stock-in' | 'stock-out';
  quantity: number;
  reason: string;
  date: Date;
}

export interface PlanFeatures {
  maxProducts: number | null;
  maxSalesPerMonth: number | null;
  hasReports: boolean;
  hasPdfInvoices: boolean;
  hasGoalTracking: boolean;
  hasCashFlowReport: boolean;
}

export interface Plan {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: number;
  currency: string;
  features: PlanFeatures;
  popular?: boolean;
}