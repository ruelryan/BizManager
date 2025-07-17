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
  subscription?: Subscription;
  // Trial management
  isInTrial: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialUsed: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string;
  paypal_plan_id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  plan_type: 'starter' | 'pro';
  start_time?: Date;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  cancelled_at?: Date;
  cancellation_reason?: string;
  next_billing_time?: Date;
  failed_payment_count: number;
  created_at: Date;
  updated_at: Date;
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