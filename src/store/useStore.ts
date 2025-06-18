import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { User, Product, Sale, InventoryTransaction, Expense } from '../types';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';

// Configure localforage
localforage.config({
  name: 'BizManager',
  storeName: 'bizmanager_data',
  description: 'BizManager offline data storage'
});

interface SyncItem {
  id: string;
  type: 'product' | 'sale' | 'inventory' | 'expense' | 'settings';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount?: number;
}

interface Store {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductCategories: () => string[];
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  
  // Inventory
  inventoryTransactions: InventoryTransaction[];
  addInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => Promise<void>;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Settings
  monthlyGoal: number;
  setMonthlyGoal: (goal: number) => Promise<void>;
  
  // Offline state
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  pendingSyncItems: SyncItem[];
  addPendingSyncItem: (item: SyncItem) => void;
  removePendingSyncItem: (id: string) => void;
  
  // Data management
  fetchInitialData: () => Promise<void>;
  syncData: () => Promise<void>;
  clearAllData: () => void;
  loadDemoData: () => Promise<void>;
  shouldSkipSync: (item: SyncItem) => boolean;
  syncItem: (item: SyncItem) => Promise<void>;
  exportReportData: () => string;
  
  // Auth
  signIn: (email: string, password: string, plan?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// UUID validation function
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Check if an ID is a demo ID (starts with 'demo-')
const isDemoId = (id: string): boolean => {
  return id.startsWith('demo-');
};

// Date reviver function to convert ISO strings back to Date objects
const dateReviver = (key: string, value: any) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
};

// Custom storage implementation using localforage with proper date handling
const localforageStorage = {
  getItem: async (name: string) => {
    try {
      const value = await localforage.getItem(name);
      if (value) {
        return JSON.stringify(value, null, 0);
      }
      return null;
    } catch (error) {
      console.error('Error getting item from localforage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      const parsedValue = JSON.parse(value, dateReviver);
      await localforage.setItem(name, parsedValue);
    } catch (error) {
      console.error('Error setting item in localforage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await localforage.removeItem(name);
    } catch (error) {
      console.error('Error removing item from localforage:', error);
    }
  },
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      // Loading states
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Products
      products: [],
      addProduct: async (productData) => {
        const newProduct: Product = {
          ...productData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Update local state immediately
        set((state) => ({ products: [...state.products, newProduct] }));
        
        // Skip Supabase operations for demo user
        if (get().user?.id === 'demo-user-id') {
          return;
        }
        
        try {
          if (get().isOnline) {
            const { error } = await supabase
              .from('products')
              .insert(transformToSupabaseData.product(newProduct));
            
            if (error) throw error;
          } else {
            // Add to pending sync
            get().addPendingSyncItem({
              id: newProduct.id,
              type: 'product',
              action: 'create',
              data: newProduct,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to add product:', error);
          // Add to pending sync for retry
          get().addPendingSyncItem({
            id: newProduct.id,
            type: 'product',
            action: 'create',
            data: newProduct,
            timestamp: Date.now(),
          });
        }
      },
      
      updateProduct: async (id, updates) => {
        const updatedProduct = { ...updates, updatedAt: new Date() };
        
        // Update local state immediately
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...updatedProduct } : product
          ),
        }));
        
        // Skip Supabase operations for demo user or demo data
        if (get().user?.id === 'demo-user-id' || isDemoId(id)) {
          return;
        }
        
        try {
          if (get().isOnline) {
            const { error } = await supabase
              .from('products')
              .update(transformToSupabaseData.product(updatedProduct))
              .eq('id', id);
            
            if (error) throw error;
          } else {
            // Add to pending sync
            get().addPendingSyncItem({
              id: `${id}-${Date.now()}`,
              type: 'product',
              action: 'update',
              data: { id, updates: updatedProduct },
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to update product:', error);
          // Add to pending sync for retry
          get().addPendingSyncItem({
            id: `${id}-${Date.now()}`,
            type: 'product',
            action: 'update',
            data: { id, updates: updatedProduct },
            timestamp: Date.now(),
          });
        }
      },
      
      deleteProduct: async (id) => {
        // Update local state immediately
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
        
        // Skip Supabase operations for demo user or demo data
        if (get().user?.id === 'demo-user-id' || isDemoId(id)) {
          return;
        }
        
        try {
          if (get().isOnline) {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          } else {
            // Add to pending sync
            get().addPendingSyncItem({
              id: `${id}-delete-${Date.now()}`,
              type: 'product',
              action: 'delete',
              data: { id },
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to delete product:', error);
          // Add to pending sync for retry
          get().addPendingSyncItem({
            id: `${id}-delete-${Date.now()}`,
            type: 'product',
            action: 'delete',
            data: { id },
            timestamp: Date.now(),
          });
        }
      },

      getProductCategories: () => {
        const categories = get().products.map(product => product.category);
        return [...new Set(categories)].filter(Boolean).sort();
      },
      
      // Sales
      sales: [],
      addSale: async (saleData) => {
        const newSale: Sale = {
          ...saleData,
          id: crypto.randomUUID(),
          invoiceNumber: `INV-${String(get().sales.length + 1).padStart(3, '0')}`,
        };
        
        // Check stock availability and prevent negative stock
        const stockErrors: string[] = [];
        saleData.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product && product.currentStock < item.quantity) {
            stockErrors.push(`${product.name} has only ${product.currentStock} units in stock`);
          }
        });

        if (stockErrors.length > 0) {
          throw new Error(`Stock Error:\n${stockErrors.join('\n')}`);
        }
        
        // Update local state immediately
        set((state) => ({ sales: [...state.sales, newSale] }));
        
        // Update product stock only if sufficient stock is available
        saleData.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product && product.currentStock >= item.quantity) {
            get().updateProduct(item.productId, {
              currentStock: Math.max(0, product.currentStock - item.quantity),
            });
          }
        });
        
        // Skip Supabase operations for demo user
        if (get().user?.id === 'demo-user-id') {
          return;
        }
        
        try {
          if (get().isOnline) {
            const { error } = await supabase
              .from('sales')
              .insert(transformToSupabaseData.sale(newSale));
            
            if (error) throw error;
          } else {
            // Add to pending sync
            get().addPendingSyncItem({
              id: newSale.id,
              type: 'sale',
              action: 'create',
              data: newSale,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to add sale:', error);
          // Add to pending sync for retry
          get().addPendingSyncItem({
            id: newSale.id,
            type: 'sale',
            action: 'create',
            data: newSale,
            timestamp: Date.now(),
          });
        }
      },
      
      updateSale: async (id, updates) => {
        // Update local state immediately
        set((state) => ({
          sales: state.sales.map((sale) => (sale.id === id ? { ...sale, ...updates } : sale)),
        }));
        
        // Skip Supabase operations for demo user or demo data
        if (get().user?.id === 'demo-user-id' || isDemoId(id)) {
          return;
        }
        
        try {
          if (get().isOnline) {
            const { error } = await supabase
              .from('sales')
              .update(transformToSupabaseData.sale(updates))
              .eq('id', id);
            
            if (error) throw error;
          } else {
            // Add to pending sync
            get().addPendingSyncItem({
              id: `${id}-${Date.now()}`,
              type: 'sale',
              action: 'update',
              data: { id, updates },
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to update sale:', error);
          // Add to pending sync for retry
          get().addPendingSyncItem({
            id: `${id}-${Date.now()}`,
            type: 'sale',
            action: 'update',
            data: { id, updates },
            timestamp: Date.now(),
          });
        }
      },
      
      // Inventory
      inventoryTransactions: [],
      addInventoryTransaction: async (transactionData) => {
        const newTransaction: InventoryTransaction = {
          ...transactionData,
          id: crypto.randomUUID(),
        };
        
        // Update local state immediately
        set((state) => ({
          inventoryTransactions: [...state.inventoryTransactions, newTransaction],
        }));
        
        // Update product stock
        const product = get().products.find((p) => p.id === transactionData.productId);
        if (product) {
          const stockChange = transactionData.type === 'stock-in' 
            ? transactionData.quantity 
            : -transactionData.quantity;
          get().updateProduct(transactionData.productId, {
            currentStock: Math.max(0, product.currentStock + stockChange),
          });
        }
        
        // Skip Supabase operations for demo user
        if (get().user?.id === 'demo-user-id') {
          return;
        }
        
        // Note: Inventory transactions would need their own table in Supabase
        // For now, we'll just store them locally
        if (!get().isOnline) {
          get().addPendingSyncItem({
            id: newTransaction.id,
            type: 'inventory',
            action: 'create',
            data: newTransaction,
            timestamp: Date.now(),
          });
        }
      },
      
      // Expenses
      expenses: [],
      addExpense: async (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: crypto.randomUUID(),
        };
        
        // Update local state immediately
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
        
        // Skip Supabase operations for demo user
        if (get().user?.id === 'demo-user-id') {
          return;
        }
        
        // Note: Expenses would need their own table in Supabase
        if (!get().isOnline) {
          get().addPendingSyncItem({
            id: newExpense.id,
            type: 'expense',
            action: 'create',
            data: newExpense,
            timestamp: Date.now(),
          });
        }
      },
      
      updateExpense: async (id, updates) => {
        // Update local state immediately
        set((state) => ({
          expenses: state.expenses.map((expense) => (expense.id === id ? { ...expense, ...updates } : expense)),
        }));
        
        // Skip Supabase operations for demo user or demo data
        if (get().user?.id === 'demo-user-id' || isDemoId(id)) {
          return;
        }
        
        if (!get().isOnline) {
          get().addPendingSyncItem({
            id: `${id}-${Date.now()}`,
            type: 'expense',
            action: 'update',
            data: { id, updates },
            timestamp: Date.now(),
          });
        }
      },
      
      deleteExpense: async (id) => {
        // Update local state immediately
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
        
        // Skip Supabase operations for demo user or demo data
        if (get().user?.id === 'demo-user-id' || isDemoId(id)) {
          return;
        }
        
        if (!get().isOnline) {
          get().addPendingSyncItem({
            id: `${id}-delete-${Date.now()}`,
            type: 'expense',
            action: 'delete',
            data: { id },
            timestamp: Date.now(),
          });
        }
      },
      
      // Settings
      monthlyGoal: 50000,
      setMonthlyGoal: async (goal) => {
        set({ monthlyGoal: goal });
        
        // Skip Supabase operations for demo user
        if (get().user?.id === 'demo-user-id') {
          return;
        }
        
        // Note: Settings would need their own table in Supabase
        if (!get().isOnline) {
          get().addPendingSyncItem({
            id: `goal-${Date.now()}`,
            type: 'settings',
            action: 'update',
            data: { monthlyGoal: goal },
            timestamp: Date.now(),
          });
        }
      },
      
      // Offline state
      isOnline: navigator.onLine,
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        
        // Trigger sync when coming back online
        if (status && get().pendingSyncItems.length > 0) {
          get().syncData();
        }
      },
      pendingSyncItems: [],
      addPendingSyncItem: (item) => {
        set((state) => ({
          pendingSyncItems: [...state.pendingSyncItems, item],
        }));
      },
      removePendingSyncItem: (id) => {
        set((state) => ({
          pendingSyncItems: state.pendingSyncItems.filter((item) => item.id !== id),
        }));
      },
      
      // Data management
      fetchInitialData: async () => {
        if (!get().isOnline) return;
        
        set({ isLoading: true });
        
        try {
          // Fetch products
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          
          if (productsError) throw productsError;
          
          // Fetch sales
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (salesError) throw salesError;
          
          // Transform and set data
          const transformedProducts = productsData?.map(transformSupabaseData.product) || [];
          const transformedSales = salesData?.map(transformSupabaseData.sale) || [];
          
          set({
            products: transformedProducts,
            sales: transformedSales,
            isLoading: false,
          });
          
        } catch (error) {
          console.error('Failed to fetch initial data:', error);
          set({ isLoading: false });
        }
      },
      
      // Sync functions
      syncData: async () => {
        const { pendingSyncItems, removePendingSyncItem } = get();
        
        if (!navigator.onLine || pendingSyncItems.length === 0) {
          return;
        }
        
        console.log(`Syncing ${pendingSyncItems.length} items...`);
        
        // Sort by timestamp to maintain order
        const sortedItems = [...pendingSyncItems].sort((a, b) => a.timestamp - b.timestamp);
        
        for (const item of sortedItems) {
          try {
            // Skip demo data from syncing
            const shouldSkipSync = get().shouldSkipSync(item);
            
            if (shouldSkipSync) {
              console.log('Skipping sync for demo data:', item.id);
              removePendingSyncItem(item.id);
              continue;
            }
            
            await get().syncItem(item);
            removePendingSyncItem(item.id);
          } catch (error) {
            console.error('Failed to sync item:', item, error);
            // Keep item in pending sync for retry
          }
        }
        
        console.log('Sync completed');
      },
      
      // Helper function to determine if sync should be skipped
      shouldSkipSync: (item: SyncItem): boolean => {
        // Skip if user is demo user
        if (get().user?.id === 'demo-user-id') {
          return true;
        }
        
        // Skip if item involves demo data
        if (item.type === 'product' || item.type === 'sale') {
          if (item.action === 'create' && item.data?.id && isDemoId(item.data.id)) {
            return true;
          }
          
          if (item.action === 'update' && item.data?.id && isDemoId(item.data.id)) {
            return true;
          }
          
          if (item.action === 'delete' && item.data?.id && isDemoId(item.data.id)) {
            return true;
          }
          
          // Additional check for invalid UUIDs
          const idToCheck = item.data?.id || (item.action === 'update' ? item.data?.id : null);
          if (idToCheck && !isValidUUID(idToCheck)) {
            return true;
          }
        }
        
        return false;
      },
      
      syncItem: async (item: SyncItem) => {
        switch (item.type) {
          case 'product':
            if (item.action === 'create') {
              const { error } = await supabase
                .from('products')
                .insert(transformToSupabaseData.product(item.data));
              if (error) throw error;
            } else if (item.action === 'update') {
              const { error } = await supabase
                .from('products')
                .update(transformToSupabaseData.product(item.data.updates))
                .eq('id', item.data.id);
              if (error) throw error;
            } else if (item.action === 'delete') {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', item.data.id);
              if (error) throw error;
            }
            break;
            
          case 'sale':
            if (item.action === 'create') {
              const { error } = await supabase
                .from('sales')
                .insert(transformToSupabaseData.sale(item.data));
              if (error) throw error;
            } else if (item.action === 'update') {
              const { error } = await supabase
                .from('sales')
                .update(transformToSupabaseData.sale(item.data.updates))
                .eq('id', item.data.id);
              if (error) throw error;
            }
            break;
            
          // Add other sync cases as needed
        }
      },
      
      exportReportData: () => {
        const { sales, products } = get();
        
        // Create CSV data
        const headers = [
          'Date',
          'Invoice Number',
          'Customer Name',
          'Items',
          'Total Amount (PHP)',
          'Payment Method',
          'Status'
        ];
        
        const rows = sales.map(sale => [
          new Date(sale.date).toLocaleDateString(),
          sale.invoiceNumber || 'N/A',
          sale.customerName || 'Walk-in Customer',
          sale.items.map(item => `${item.productName} (${item.quantity})`).join('; '),
          `₱${sale.total.toLocaleString()}`,
          sale.paymentType,
          sale.status
        ]);
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        return csvContent;
      },
      
      clearAllData: () => {
        set({
          products: [],
          sales: [],
          inventoryTransactions: [],
          expenses: [],
          pendingSyncItems: [],
          monthlyGoal: 50000,
        });
      },
      
      // Auth
      signIn: async (email: string, password: string, plan: string = 'free') => {
        set({ isLoading: true });
        
        try {
          // Check if this is the demo account
          if (email === 'demo@businessmanager.com' && password === 'demo123') {
            // Demo authentication - bypass Supabase
            const demoUser: User = {
              id: 'demo-user-id',
              email: email,
              name: 'Demo User',
              plan: plan as 'free' | 'starter' | 'pro',
            };
            
            set({ user: demoUser, isLoading: false });
            
            // Load demo data if no products exist
            if (get().products.length === 0) {
              await get().loadDemoData();
            }
            
            return;
          }
          
          // Try Supabase authentication for non-demo accounts
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          if (data.user) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || 'User',
                plan: data.user.user_metadata?.plan || 'free',
              },
              isLoading: false,
            });
            
            // Fetch initial data after login
            await get().fetchInitialData();
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to sign in');
        }
      },
      
      signOut: async () => {
        const { user } = get();
        
        // If demo user, just clear local state
        if (user?.id === 'demo-user-id') {
          set({ user: null });
          get().clearAllData();
          return;
        }
        
        // Otherwise, sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        set({ user: null });
        get().clearAllData();
      },
      
      // Demo data loader
      loadDemoData: async () => {
        const demoProducts: Product[] = [
          {
            id: 'demo-product-1',
            name: 'Wireless Headphones',
            category: 'Electronics',
            price: 2499.99,
            cost: 1250.00,
            currentStock: 25,
            minStock: 5,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'demo-product-2',
            name: 'Coffee Beans',
            category: 'Food & Beverage',
            price: 399.99,
            cost: 200.00,
            currentStock: 50,
            minStock: 10,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
          },
          {
            id: 'demo-product-3',
            name: 'Notebook',
            category: 'Stationery',
            price: 124.99,
            cost: 50.00,
            currentStock: 100,
            minStock: 20,
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-03'),
          },
          {
            id: 'demo-product-4',
            name: 'Smartphone Case',
            category: 'Electronics',
            price: 624.99,
            cost: 300.00,
            currentStock: 30,
            minStock: 8,
            createdAt: new Date('2024-01-04'),
            updatedAt: new Date('2024-01-04'),
          },
          {
            id: 'demo-product-5',
            name: 'Organic Tea',
            category: 'Food & Beverage',
            price: 324.99,
            cost: 162.50,
            currentStock: 40,
            minStock: 12,
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-05'),
          },
        ];
        
        const demoSales: Sale[] = [
          {
            id: 'demo-sale-1',
            customerId: 'demo-customer-1',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            items: [
              {
                productId: 'demo-product-1',
                productName: 'Wireless Headphones',
                quantity: 1,
                price: 2499.99,
                total: 2499.99,
              },
            ],
            total: 2499.99,
            paymentType: 'cash',
            status: 'paid',
            date: new Date('2024-01-15'),
            invoiceNumber: 'INV-001',
          },
          {
            id: 'demo-sale-2',
            customerId: 'demo-customer-2',
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            items: [
              {
                productId: 'demo-product-2',
                productName: 'Coffee Beans',
                quantity: 2,
                price: 399.99,
                total: 799.98,
              },
              {
                productId: 'demo-product-3',
                productName: 'Notebook',
                quantity: 3,
                price: 124.99,
                total: 374.97,
              },
            ],
            total: 1174.95,
            paymentType: 'card',
            status: 'paid',
            date: new Date('2024-01-16'),
            invoiceNumber: 'INV-002',
          },
          {
            id: 'demo-sale-3',
            customerId: 'demo-customer-3',
            customerName: 'Bob Johnson',
            items: [
              {
                productId: 'demo-product-4',
                productName: 'Smartphone Case',
                quantity: 1,
                price: 624.99,
                total: 624.99,
              },
            ],
            total: 624.99,
            paymentType: 'gcash',
            status: 'pending',
            date: new Date('2024-01-17'),
            dueDate: new Date('2024-01-24'),
            invoiceNumber: 'INV-003',
          
          },
        ];

        const demoExpenses: Expense[] = [
          {
            id: 'demo-expense-1',
            description: 'Office Rent',
            amount: 15000,
            category: 'Rent',
            date: new Date('2024-01-01'),
            paymentMethod: 'transfer',
            notes: 'Monthly office rent payment',
          },
          {
            id: 'demo-expense-2',
            description: 'Electricity Bill',
            amount: 3500,
            category: 'Utilities',
            date: new Date('2024-01-05'),
            paymentMethod: 'card',
          },
          {
            id: 'demo-expense-3',
            description: 'Office Supplies',
            amount: 2500,
            category: 'Supplies',
            date: new Date('2024-01-10'),
            paymentMethod: 'cash',
            notes: 'Pens, papers, and other office supplies',
          },
        ];
        
        set({
          products: demoProducts,
          sales: demoSales,
          expenses: demoExpenses,
        });
      },
    }),
    {
      name: 'bizmanager-storage',
      storage: createJSONStorage(() => localforageStorage),
      partialize: (state) => ({
        user: state.user,
        products: state.products,
        sales: state.sales,
        inventoryTransactions: state.inventoryTransactions,
        expenses: state.expenses,
        monthlyGoal: state.monthlyGoal,
        pendingSyncItems: state.pendingSyncItems,
      }),
      deserialize: (str) => {
        try {
          return JSON.parse(str, dateReviver);
        } catch (error) {
          console.error('Error deserializing data:', error);
          return {};
        }
      },
    }
  )
);

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  const store = useStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    store.setUser({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || 'User',
      plan: session.user.user_metadata?.plan || 'free',
    });
    
    // Fetch initial data
    store.fetchInitialData();
  } else if (event === 'SIGNED_OUT') {
    store.setUser(null);
    store.clearAllData();
  }
});

// Set up online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useStore.getState().setOnlineStatus(false);
  });
}