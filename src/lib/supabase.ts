import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.code === 'PGRST116') {
    throw new Error('No data found');
  }
  
  if (error?.code === '23505') {
    throw new Error('Duplicate entry');
  }
  
  if (error?.message) {
    throw new Error(error.message);
  }
  
  throw new Error('An unexpected error occurred');
};

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Helper function to safely create Date objects
const safeDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Helper function to transform Supabase data to app format
export const transformSupabaseData = {
  product: (data: any) => ({
    ...data,
    createdAt: safeDate(data.created_at),
    updatedAt: safeDate(data.updated_at),
    currentStock: Number(data.stock) || 0,
    minStock: Number(data.min_stock) || 0,
    cost: Number(data.cost) || 0,
    price: Number(data.price) || 0,
    barcode: data.barcode || undefined
  }),
  
  sale: (data: any) => ({
    ...data,
    date: safeDate(data.created_at),
    customerId: data.customer_id?.toString() || '',
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    paymentType: data.payments?.[0]?.method || 'cash',
    invoiceNumber: data.receipt_number,
    items: data.items || []
  }),
  
  customer: (data: any) => ({
    ...data,
    createdAt: safeDate(data.created_at),
    isActive: data.is_active,
    creditLimit: Number(data.credit_limit) || 0,
    balance: Number(data.balance) || 0
  }),

  expense: (data: any) => ({
    ...data,
    date: safeDate(data.date),
    paymentMethod: data.payment_method,
    createdAt: safeDate(data.created_at)
  }),

  userSettings: (data: any) => ({
    ...data,
    monthlyGoal: Number(data.monthly_goal) || 50000,
    currency: data.currency || 'PHP',
    businessName: data.business_name,
    businessAddress: data.business_address,
    businessPhone: data.business_phone,
    businessEmail: data.business_email,
    createdAt: safeDate(data.created_at),
    updatedAt: safeDate(data.updated_at),
    plan: data.plan || 'free',
    subscriptionExpiry: data.subscription_expiry ? safeDate(data.subscription_expiry) : undefined
  })
};

// Helper function to transform app data to Supabase format
export const transformToSupabaseData = {
  product: (data: any, userId?: string) => ({
    name: data.name,
    description: data.description || null,
    category: data.category,
    cost: data.cost,
    price: data.price,
    stock: data.currentStock,
    min_stock: data.minStock,
    unit: data.unit || 'pcs',
    barcode: data.barcode || null,
    is_active: true,
    user_id: userId
  }),
  
  sale: (data: any, userId?: string) => ({
    receipt_number: data.invoiceNumber,
    items: data.items,
    subtotal: data.total,
    tax: 0,
    discount: 0,
    total: data.total,
    payments: [{
      method: data.paymentType,
      amount: data.total
    }],
    customer_id: data.customerId || null,
    customer_name: data.customerName,
    customer_email: data.customerEmail || null,
    cashier_id: userId || 'unknown',
    cashier_name: 'User',
    status: data.status,
    notes: null,
    user_id: userId
  }),
  
  customer: (data: any, userId?: string) => ({
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    balance: data.balance || 0,
    credit_limit: data.creditLimit || 0,
    is_active: data.isActive,
    user_id: userId
  }),

  expense: (data: any, userId?: string) => ({
    description: data.description,
    amount: data.amount,
    category: data.category,
    date: data.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    payment_method: data.paymentMethod,
    receipt: data.receipt || null,
    notes: data.notes || null,
    user_id: userId
  }),

  userSettings: (data: any, userId?: string) => ({
    monthly_goal: data.monthlyGoal,
    currency: data.currency || 'PHP',
    business_name: data.businessName || null,
    business_address: data.businessAddress || null,
    business_phone: data.businessPhone || null,
    business_email: data.businessEmail || null,
    plan: data.plan || 'free',
    subscription_expiry: data.subscriptionExpiry,
    user_id: userId
  })
};