import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';
import { User, Product, Sale, InventoryTransaction, Expense, UserSettings } from '../types';

interface StoreState {
  // Auth
  user: User | null;
  isLoading: boolean;
  
  // Data
  products: Product[];
  sales: Sale[];
  inventoryTransactions: InventoryTransaction[];
  expenses: Expense[];
  userSettings: UserSettings | null;
  
  // Offline sync
  isOnline: boolean;
  pendingSyncItems: any[];
  
  // Settings
  monthlyGoal: number;
  
  // Actions
  signIn: (email: string, password: string, plan?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductCategories: () => string[];
  
  // Sale actions
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Inventory actions
  addInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseCategories: () => string[];
  
  // Settings actions
  setMonthlyGoal: (goal: number) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Sync actions
  syncData: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  
  // Utility actions
  exportReportData: () => string;
  loadData: () => Promise<void>;
}

// Configure localforage for offline storage
localforage.config({
  name: 'BizManager',
  storeName: 'offline_data',
});

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      products: [],
      sales: [],
      inventoryTransactions: [],
      expenses: [],
      userSettings: null,
      isOnline: navigator.onLine,
      pendingSyncItems: [],
      monthlyGoal: 50000,

      // Auth actions
      signIn: async (email: string, password: string, plan = 'free') => {
        set({ isLoading: true });
        try {
          if (email === 'demo@businessmanager.com' && password === 'demo123') {
            // Demo user login
            const demoUser: User = {
              id: 'demo-user-id',
              email: 'demo@businessmanager.com',
              name: 'Demo User',
              plan: plan as any,
              currency: 'PHP',
              businessName: 'Demo Business',
            };
            set({ user: demoUser });
            await get().loadData();
          } else {
            // Real Supabase authentication
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (error) throw error;
            
            if (data.user) {
              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || 'User',
                plan: 'free',
                currency: 'PHP',
              };
              set({ user });
              await get().loadData();
            }
          }
        } catch (error: any) {
          throw new Error(error.message || 'Sign in failed');
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/`,
            },
          });
          if (error) throw error;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Google sign in failed');
        }
      },

      signInWithFacebook: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: `${window.location.origin}/`,
            },
          });
          if (error) throw error;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Facebook sign in failed');
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });
          
          if (error) throw error;
          
          if (data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name,
              plan: 'free',
              currency: 'PHP',
            };
            set({ user });
          }
        } catch (error: any) {
          throw new Error(error.message || 'Sign up failed');
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            products: [],
            sales: [],
            inventoryTransactions: [],
            expenses: [],
            userSettings: null,
            pendingSyncItems: [],
          });
        } catch (error: any) {
          throw new Error(error.message || 'Sign out failed');
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      // Product actions
      addProduct: async (productData) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        const product: Product = {
          id: crypto.randomUUID(),
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Always update local state immediately (optimistic update)
        set(state => ({
          products: [...state.products, product]
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'product',
              action: 'create',
              data: product,
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.product(product, user.id);
            const { error } = await supabase
              .from('products')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'product',
                action: 'create',
                data: product,
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync product to server:', error);
          }
        }
      },

      updateProduct: async (id: string, updates) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        const updatedProduct = { ...updates, updatedAt: new Date() };

        // Always update local state immediately (optimistic update)
        set(state => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, ...updatedProduct } : p
          )
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'product',
              action: 'update',
              data: { id, ...updatedProduct },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.product(updatedProduct, user.id);
            const { error } = await supabase
              .from('products')
              .update(supabaseData)
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'product',
                action: 'update',
                data: { id, ...updatedProduct },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync product update to server:', error);
          }
        }
      },

      deleteProduct: async (id: string) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        // Always update local state immediately (optimistic update)
        set(state => ({
          products: state.products.filter(p => p.id !== id)
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'product',
              action: 'delete',
              data: { id },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'product',
                action: 'delete',
                data: { id },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync product deletion to server:', error);
          }
        }
      },

      getProductCategories: () => {
        const { products } = get();
        const categories = [...new Set(products.map(p => p.category))];
        return categories.sort();
      },

      // Sale actions
      addSale: async (saleData) => {
        const { user, isOnline, products } = get();
        if (!user) throw new Error('User not authenticated');

        const sale: Sale = {
          id: crypto.randomUUID(),
          ...saleData,
          invoiceNumber: saleData.invoiceNumber || `INV-${Date.now()}`,
        };

        // Always update local state immediately (optimistic update)
        set(state => ({
          sales: [...state.sales, sale]
        }));

        // Update product stock locally
        const updatedProducts = products.map(product => {
          const saleItem = sale.items.find(item => item.productId === product.id);
          if (saleItem) {
            return {
              ...product,
              currentStock: Math.max(0, product.currentStock - saleItem.quantity),
              updatedAt: new Date(),
            };
          }
          return product;
        });

        set({ products: updatedProducts });

        // Add inventory transactions for stock changes
        const inventoryTransactions = sale.items.map(item => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          type: 'stock-out' as const,
          quantity: item.quantity,
          reason: `Sale: ${sale.invoiceNumber}`,
          date: sale.date,
        }));

        set(state => ({
          inventoryTransactions: [...state.inventoryTransactions, ...inventoryTransactions]
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'sale',
              action: 'create',
              data: sale,
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.sale(sale, user.id);
            const { error } = await supabase
              .from('sales')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }

            // Update product stock in database
            for (const item of sale.items) {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                const newStock = Math.max(0, product.currentStock - item.quantity);
                await supabase
                  .from('products')
                  .update({ stock: newStock, updated_at: new Date().toISOString() })
                  .eq('id', item.productId);
              }
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'sale',
                action: 'create',
                data: sale,
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync sale to server:', error);
          }
        }
      },

      updateSale: async (id: string, updates) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        // Always update local state immediately (optimistic update)
        set(state => ({
          sales: state.sales.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'sale',
              action: 'update',
              data: { id, ...updates },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.sale(updates, user.id);
            const { error } = await supabase
              .from('sales')
              .update(supabaseData)
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'sale',
                action: 'update',
                data: { id, ...updates },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync sale update to server:', error);
          }
        }
      },

      deleteSale: async (id: string) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        // Always update local state immediately (optimistic update)
        set(state => ({
          sales: state.sales.filter(s => s.id !== id)
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'sale',
              action: 'delete',
              data: { id },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('sales')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'sale',
                action: 'delete',
                data: { id },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync sale deletion to server:', error);
          }
        }
      },

      // Inventory actions
      addInventoryTransaction: async (transactionData) => {
        const { user, products } = get();
        if (!user) throw new Error('User not authenticated');

        const transaction: InventoryTransaction = {
          id: crypto.randomUUID(),
          ...transactionData,
        };

        // Update local state
        set(state => ({
          inventoryTransactions: [...state.inventoryTransactions, transaction]
        }));

        // Update product stock
        const updatedProducts = products.map(product => {
          if (product.id === transaction.productId) {
            const stockChange = transaction.type === 'stock-in' 
              ? transaction.quantity 
              : -transaction.quantity;
            return {
              ...product,
              currentStock: Math.max(0, product.currentStock + stockChange),
              updatedAt: new Date(),
            };
          }
          return product;
        });

        set({ products: updatedProducts });
      },

      // Expense actions
      addExpense: async (expenseData) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        const expense: Expense = {
          id: crypto.randomUUID(),
          ...expenseData,
        };

        // Always update local state immediately (optimistic update)
        set(state => ({
          expenses: [...state.expenses, expense]
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'expense',
              action: 'create',
              data: expense,
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.expense(expense, user.id);
            const { error } = await supabase
              .from('expenses')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'expense',
                action: 'create',
                data: expense,
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync expense to server:', error);
          }
        }
      },

      updateExpense: async (id: string, updates) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        // Always update local state immediately (optimistic update)
        set(state => ({
          expenses: state.expenses.map(e => 
            e.id === id ? { ...e, ...updates } : e
          )
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'expense',
              action: 'update',
              data: { id, ...updates },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.expense(updates, user.id);
            const { error } = await supabase
              .from('expenses')
              .update(supabaseData)
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'expense',
                action: 'update',
                data: { id, ...updates },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync expense update to server:', error);
          }
        }
      },

      deleteExpense: async (id: string) => {
        const { user, isOnline } = get();
        if (!user) throw new Error('User not authenticated');

        // Always update local state immediately (optimistic update)
        set(state => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));

        // Only add to pending sync if offline OR if online sync fails
        if (!isOnline) {
          set(state => ({
            pendingSyncItems: [...state.pendingSyncItems, {
              id: crypto.randomUUID(),
              type: 'expense',
              action: 'delete',
              data: { id },
              timestamp: new Date(),
            }]
          }));
        } else if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            // Add to pending sync only if online sync fails
            set(state => ({
              pendingSyncItems: [...state.pendingSyncItems, {
                id: crypto.randomUUID(),
                type: 'expense',
                action: 'delete',
                data: { id },
                timestamp: new Date(),
              }]
            }));
            console.error('Failed to sync expense deletion to server:', error);
          }
        }
      },

      getExpenseCategories: () => {
        const { expenses } = get();
        const categories = [...new Set(expenses.map(e => e.category))];
        return categories.sort();
      },

      // Settings actions
      setMonthlyGoal: (goal: number) => {
        set({ monthlyGoal: goal });
      },

      updateUserProfile: async (data) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        const updatedUser = { ...user, ...data };
        set({ user: updatedUser });

        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase.auth.updateUser({
              data: data,
            });
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update user profile:', error);
          }
        }
      },

      updateUserSettings: async (settings) => {
        const { user, userSettings } = get();
        if (!user) throw new Error('User not authenticated');

        const updatedSettings = { ...userSettings, ...settings };
        set({ userSettings: updatedSettings });

        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.userSettings(settings, user.id);
            const { error } = await supabase
              .from('user_settings')
              .upsert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update user settings:', error);
          }
        }
      },

      // Sync actions
      syncData: async () => {
        const { user, pendingSyncItems, isOnline } = get();
        if (!user || !isOnline || user.id === 'demo-user-id') return;

        try {
          // Process pending sync items
          for (const item of pendingSyncItems) {
            try {
              switch (item.type) {
                case 'product':
                  if (item.action === 'create') {
                    const supabaseData = transformToSupabaseData.product(item.data, user.id);
                    await supabase.from('products').insert(supabaseData);
                  } else if (item.action === 'update') {
                    const supabaseData = transformToSupabaseData.product(item.data, user.id);
                    await supabase.from('products').update(supabaseData).eq('id', item.data.id);
                  } else if (item.action === 'delete') {
                    await supabase.from('products').delete().eq('id', item.data.id);
                  }
                  break;
                case 'sale':
                  if (item.action === 'create') {
                    const supabaseData = transformToSupabaseData.sale(item.data, user.id);
                    await supabase.from('sales').insert(supabaseData);
                  } else if (item.action === 'update') {
                    const supabaseData = transformToSupabaseData.sale(item.data, user.id);
                    await supabase.from('sales').update(supabaseData).eq('id', item.data.id);
                  } else if (item.action === 'delete') {
                    await supabase.from('sales').delete().eq('id', item.data.id);
                  }
                  break;
                case 'expense':
                  if (item.action === 'create') {
                    const supabaseData = transformToSupabaseData.expense(item.data, user.id);
                    await supabase.from('expenses').insert(supabaseData);
                  } else if (item.action === 'update') {
                    const supabaseData = transformToSupabaseData.expense(item.data, user.id);
                    await supabase.from('expenses').update(supabaseData).eq('id', item.data.id);
                  } else if (item.action === 'delete') {
                    await supabase.from('expenses').delete().eq('id', item.data.id);
                  }
                  break;
              }
            } catch (error) {
              console.error(`Failed to sync ${item.type} ${item.action}:`, error);
            }
          }

          // Clear pending sync items after successful sync
          set({ pendingSyncItems: [] });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },

      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
        if (status) {
          // Auto-sync when coming back online
          get().syncData();
        }
      },

      // Utility actions
      exportReportData: () => {
        const { sales } = get();
        const headers = ['Date', 'Invoice', 'Customer', 'Amount', 'Payment', 'Status'];
        const rows = sales.map(sale => [
          sale.date.toISOString().split('T')[0],
          sale.invoiceNumber || '',
          sale.customerName || 'Walk-in Customer',
          sale.total.toString(),
          sale.paymentType,
          sale.status,
        ]);
        
        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        return csvContent;
      },

      loadData: async () => {
        const { user } = get();
        if (!user) return;

        if (user.id === 'demo-user-id') {
          // Load demo data
          const demoProducts: Product[] = [
            {
              id: '1',
              name: 'Premium Coffee Beans',
              category: 'Food & Beverage',
              price: 250,
              cost: 150,
              currentStock: 100,
              minStock: 20,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '2',
              name: 'Artisan Pastry',
              category: 'Food & Beverage',
              price: 120,
              cost: 80,
              currentStock: 50,
              minStock: 10,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

          const demoSales: Sale[] = [
            {
              id: '1',
              customerId: '1',
              customerName: 'John Doe',
              items: [
                {
                  productId: '1',
                  productName: 'Premium Coffee Beans',
                  quantity: 2,
                  price: 250,
                  total: 500,
                },
              ],
              total: 500,
              paymentType: 'card',
              status: 'paid',
              date: new Date(),
              invoiceNumber: 'INV-001',
            },
          ];

          set({
            products: demoProducts,
            sales: demoSales,
            expenses: [],
            inventoryTransactions: [],
          });
        } else {
          // Load real data from Supabase
          try {
            const [productsResult, salesResult, expensesResult, settingsResult] = await Promise.all([
              supabase.from('products').select('*').eq('user_id', user.id),
              supabase.from('sales').select('*').eq('user_id', user.id),
              supabase.from('expenses').select('*').eq('user_id', user.id),
              supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
            ]);

            const products = productsResult.data?.map(transformSupabaseData.product) || [];
            const sales = salesResult.data?.map(transformSupabaseData.sale) || [];
            const expenses = expensesResult.data?.map(transformSupabaseData.expense) || [];
            const userSettings = settingsResult.data ? transformSupabaseData.userSettings(settingsResult.data) : null;

            set({
              products,
              sales,
              expenses,
              userSettings,
              monthlyGoal: userSettings?.monthlyGoal || 50000,
            });
          } catch (error) {
            console.error('Failed to load data:', error);
          }
        }
      },
    }),
    {
      name: 'bizmanager-store',
      storage: createJSONStorage(() => localforage),
      partialize: (state) => ({
        user: state.user,
        products: state.products,
        sales: state.sales,
        inventoryTransactions: state.inventoryTransactions,
        expenses: state.expenses,
        userSettings: state.userSettings,
        monthlyGoal: state.monthlyGoal,
        pendingSyncItems: state.pendingSyncItems,
      }),
    }
  )
);

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useStore.getState().setOnlineStatus(false);
  });
}

export { useStore };