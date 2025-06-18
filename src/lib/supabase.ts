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

// Helper function to transform Supabase data to app format
export const transformSupabaseData = {
  product: (data: any) => ({
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    currentStock: Number(data.stock) || 0,
    minStock: Number(data.min_stock) || 0,
    cost: Number(data.cost) || 0,
    price: Number(data.price) || 0
  }),
  
  sale: (data: any) => ({
    ...data,
    date: new Date(data.created_at),
    customerId: data.customer_id?.toString() || '',
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    paymentType: data.payments?.[0]?.method || 'cash',
    invoiceNumber: data.receipt_number,
    items: data.items || []
  }),
  
  customer: (data: any) => ({
    ...data,
    createdAt: new Date(data.created_at)
  })
};

// Helper function to transform app data to Supabase format
export const transformToSupabaseData = {
  product: (data: any) => ({
    name: data.name,
    description: data.description || null,
    category: data.category,
    cost: data.cost,
    price: data.price,
    stock: data.currentStock,
    min_stock: data.minStock,
    unit: data.unit || 'pcs',
    is_active: true
  }),
  
  sale: (data: any) => ({
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
    customer_id: data.customerId ? parseInt(data.customerId) : null,
    customer_name: data.customerName,
    customer_email: data.customerEmail || null,
    cashier_id: 'demo-user',
    cashier_name: 'Demo User',
    status: data.status,
    notes: null
  }),
  
  customer: (data: any) => ({
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    balance: data.balance || 0,
    credit_limit: data.creditLimit || 0,
    is_active: true
  })
};