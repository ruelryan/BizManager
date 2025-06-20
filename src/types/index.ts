export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'starter' | 'pro';
  subscriptionExpiry?: Date;
  currency?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
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
  customerName: string | null;
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

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'gcash';
  receipt?: string;
  notes?: string;
}

export interface UserSettings {
  id?: string;
  userId: string;
  monthlyGoal: number;
  currency: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlanFeatures {
  maxProducts: number | null;
  maxSalesPerMonth: number | null;
  hasReports: boolean;
  hasPdfInvoices: boolean;
  hasGoalTracking: boolean;
  hasCashFlowReport: boolean;
  hasExpenseTracking: boolean;
}

export interface Plan {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: number;
  currency: string;
  features: PlanFeatures;
  popular?: boolean;
}