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
  status: 'paid' | 'pending' | 'overdue' | 'installment';
  date: Date;
  dueDate?: Date;
  invoiceNumber?: string;
  useCredit?: boolean;
  installmentPlanId?: string;
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
  isActive: boolean;
  createdAt: Date;
  specialPricing?: Record<string, number>; // productId -> special price
}

export interface CustomerInstallmentSummary {
  customerId: string;
  totalUnpaidAmount: number;
  overdueAmount: number;
  activeInstallments: number;
  nextPaymentDate?: Date;
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

interface ReturnItem {
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
  hasCompletedTour?: boolean;
}

export interface InstallmentPlan {
  id: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  downPayment: number;
  remainingBalance: number;
  termMonths: number;
  interestRate: number;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  saleId?: string;
  payments: InstallmentPayment[];
}

export interface InstallmentPayment {
  id: string;
  installmentPlanId: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
}

export interface PaymentReminder {
  id: string;
  installmentPaymentId: string;
  reminderDate: Date;
  sent: boolean;
  reminderType: 'upcoming' | 'due' | 'overdue';
  message: string;
  createdAt: Date;
}

export interface PaymentSummary {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  activePlans: number;
  completionRate: number;
}

export interface PaymentReport {
  startDate: Date;
  endDate: Date;
  payments: InstallmentPayment[];
  summary: {
    totalPayments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    delinquencyRate: number;
  };
}

export interface PaymentType {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface PlanFeatures {
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