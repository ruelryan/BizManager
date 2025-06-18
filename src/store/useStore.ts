import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { User, Product, Sale, InventoryTransaction } from '../types';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';

// Configure localforage
localforage.config({
  name: 'BizManager',
  storeName: 'bizmanager_data',
  description: 'BizManager offline data storage'
});

interface SyncItem {
  id: string;
  type: 'product' | 'sale' | 'inventory' | 'settings';
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
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  
  // Inventory
  inventoryTransactions: InventoryTransaction[];
  addInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => Promise<void>;
  
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
  
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

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
      
      // Sales
      sales: [],
      addSale: async (saleData) => {
        const newSale: Sale = {
          ...saleData,
          id: crypto.randomUUID(),
          invoiceNumber: `INV-${String(get().sales.length + 1).padStart(3, '0')}`,
        };
        
        // Update local state immediately
        set((state) => ({ sales: [...state.sales, newSale] }));
        
        // Update product stock
        saleData.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product) {
            get().updateProduct(item.productId, {
              currentStock: product.currentStock - item.quantity,
            });
          }
        });
        
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
            currentStock: product.currentStock + stockChange,
          });
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
      
      // Settings
      monthlyGoal: 50000,
      setMonthlyGoal: async (goal) => {
        set({ monthlyGoal: goal });
        
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
            await get().syncItem(item);
            removePendingSyncItem(item.id);
          } catch (error) {
            console.error('Failed to sync item:', item, error);
            // Keep item in pending sync for retry
          }
        }
        
        console.log('Sync completed');
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
      
      clearAllData: () => {
        set({
          products: [],
          sales: [],
          inventoryTransactions: [],
          pendingSyncItems: [],
          monthlyGoal: 50000,
        });
      },
      
      // Auth
      signIn: async (email: string, password: string) => {
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
            }
          });
          
          // Fetch initial data after login
          await get().fetchInitialData();
        }
      },
      
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        set({ user: null });
        get().clearAllData();
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