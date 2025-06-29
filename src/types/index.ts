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
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail?: string;
  items: SaleItem[];
  total: number;
  paymentType: string;
  status: 'paid' | 'pending' | 'overdue';
  date: Date;
  dueDate?: Date;
  invoiceNumber?: string;
  useCredit?: boolean;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'stock-in' | 'stock-out' | 'return';
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
  paymentMethod: string;
  receipt?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  creditLimit: number;
  isActive: boolean;
  createdAt: Date;
  specialPricing?: Record<string, number>; // productId -> special price
}

export interface Return {
  id: string;
  originalSaleId: string;
  originalSale?: Sale;
  date: Date;
  items: ReturnItem[];
  total: number;
  refundMethod: 'original' | 'store_credit' | 'cash';
  status: 'completed' | 'pending';
  reason: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  reason: string;
  isDefective: boolean;
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
  plan?: 'free' | 'starter' | 'pro';
  subscriptionExpiry?: Date;
  paypalSubscriptionId?: string;
  paymentStatus?: string;
  lastPaymentDate?: Date;
}

export interface PaymentType {
  id: string;
  name: string;
  isDefault?: boolean;
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