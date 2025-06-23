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
  
  // Offline sync (removed functionality)
  isOnline: boolean;
  
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
  
  // Utility actions
  exportReportData: () => string;
  loadData: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
}

// Configure localforage for offline storage
localforage.config({
  name: 'BizManager',
  storeName: 'offline_data',
});

// Helper function to check if user is in free trial period
const isInFreeTrial = (user: User): boolean => {
  if (!user.subscriptionExpiry) return false;
  return new Date() < user.subscriptionExpiry;
};

// Helper function to get effective plan (considering free trial)
const getEffectivePlan = (user: User): string => {
  if (isInFreeTrial(user)) {
    return 'pro'; // During trial, user gets all pro features
  }
  return user.plan;
};

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
              // Give new users a free one-month trial with all features
              const trialExpiry = new Date();
              trialExpiry.setMonth(trialExpiry.getMonth() + 1);
              
              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name || 'User',
                plan: 'free',
                currency: 'PHP',
                subscriptionExpiry: trialExpiry, // Free trial for one month
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
          // Note: The actual user setup will happen in the auth state change listener
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
            // Give new users a free one-month trial with all features
            const trialExpiry = new Date();
            trialExpiry.setMonth(trialExpiry.getMonth() + 1);
            
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name,
              plan: 'free',
              currency: 'PHP',
              subscriptionExpiry: trialExpiry, // Free trial for one month
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
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        const product: Product = {
          id: crypto.randomUUID(),
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update local state immediately
        set(state => ({
          products: [...state.products, product]
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.product(product, user.id);
            const { error } = await supabase
              .from('products')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to save product to database:', error);
            throw error;
          }
        }
      },

      updateProduct: async (id: string, updates) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        const updatedProduct = { ...updates, updatedAt: new Date() };

        // Update local state immediately
        set(state => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, ...updatedProduct } : p
          )
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
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
            console.error('Failed to update product in database:', error);
            throw error;
          }
        }
      },

      deleteProduct: async (id: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          products: state.products.filter(p => p.id !== id)
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to delete product from database:', error);
            throw error;
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
        const { user, products } = get();
        if (!user) throw new Error('User not authenticated');

        const sale: Sale = {
          id: crypto.randomUUID(),
          ...saleData,
          invoiceNumber: saleData.invoiceNumber || `INV-${Date.now()}`,
        };

        // Update local state immediately
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

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            // Prepare sale data for Supabase
            const supabaseData = {
              id: sale.id,
              receipt_number: sale.invoiceNumber || `INV-${Date.now()}`,
              items: sale.items,
              subtotal: sale.total,
              tax: 0,
              discount: 0,
              total: sale.total,
              payments: [{
                method: sale.paymentType,
                amount: sale.total
              }],
              customer_id: sale.customerId || null,
              customer_name: sale.customerName,
              customer_email: sale.customerEmail || null,
              cashier_id: user.id,
              cashier_name: user.name,
              status: sale.status,
              user_id: user.id,
              created_at: sale.date.toISOString(),
              notes: null
            };

            console.log('Saving sale to database:', supabaseData);

            const { data, error } = await supabase
              .from('sales')
              .insert(supabaseData)
              .select();
            
            if (error) {
              console.error('Supabase error:', error);
              handleSupabaseError(error);
            } else {
              console.log('Sale saved successfully:', data);
            }

            // Update product stock in database
            for (const item of sale.items) {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                const newStock = Math.max(0, product.currentStock - item.quantity);
                const { error: stockError } = await supabase
                  .from('products')
                  .update({ 
                    stock: newStock, 
                    updated_at: new Date().toISOString() 
                  })
                  .eq('id', item.productId)
                  .eq('user_id', user.id);
                
                if (stockError) {
                  console.error('Failed to update product stock:', stockError);
                }
              }
            }
          } catch (error) {
            console.error('Failed to save sale to database:', error);
            // Don't throw error here to prevent UI from breaking
            // The sale is already saved locally
          }
        }
      },

      updateSale: async (id: string, updates) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          sales: state.sales.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.sale(updates, user.id);
            const { error } = await supabase
              .from('sales')
              .update(supabaseData)
              .eq('id', id)
              .eq('user_id', user.id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update sale in database:', error);
            throw error;
          }
        }
      },

      deleteSale: async (id: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          sales: state.sales.filter(s => s.id !== id)
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('sales')
              .delete()
              .eq('id', id)
              .eq('user_id', user.id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to delete sale from database:', error);
            throw error;
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
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        const expense: Expense = {
          id: crypto.randomUUID(),
          ...expenseData,
        };

        // Update local state immediately
        set(state => ({
          expenses: [...state.expenses, expense]
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.expense(expense, user.id);
            const { error } = await supabase
              .from('expenses')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to save expense to database:', error);
            throw error;
          }
        }
      },

      updateExpense: async (id: string, updates) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          expenses: state.expenses.map(e => 
            e.id === id ? { ...e, ...updates } : e
          )
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
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
            console.error('Failed to update expense in database:', error);
            throw error;
          }
        }
      },

      deleteExpense: async (id: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to delete expense from database:', error);
            throw error;
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
            console.log('Loading data for user:', user.id);
            
            const [productsResult, salesResult, expensesResult, settingsResult] = await Promise.all([
              supabase.from('products').select('*').eq('user_id', user.id),
              supabase.from('sales').select('*').eq('user_id', user.id),
              supabase.from('expenses').select('*').eq('user_id', user.id),
              supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
            ]);

            console.log('Products result:', productsResult);
            console.log('Sales result:', salesResult);
            console.log('Expenses result:', expensesResult);
            console.log('Settings result:', settingsResult);

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

            console.log('Data loaded successfully:', { products: products.length, sales: sales.length, expenses: expenses.length });
          } catch (error) {
            console.error('Failed to load data:', error);
          }
        }
      },

      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
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

// Set up Supabase auth state listener for Google/Facebook OAuth
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { user: authUser } = session;
      
      // Check if this is a new OAuth user
      if (authUser.app_metadata.provider === 'google' || authUser.app_metadata.provider === 'facebook') {
        // Give new OAuth users a free one-month trial with all features
        const trialExpiry = new Date();
        trialExpiry.setMonth(trialExpiry.getMonth() + 1);
        
        const user: User = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
          plan: 'free',
          currency: 'PHP',
          subscriptionExpiry: trialExpiry, // Free trial for one month
        };
        
        useStore.getState().setUser(user);
        await useStore.getState().loadData();
        
        // Redirect to dashboard
        window.location.href = '/';
      }
    }
  });
}

// Export helper functions for use in components
export { useStore, isInFreeTrial, getEffectivePlan };