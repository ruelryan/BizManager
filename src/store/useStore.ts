import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';
import { User, Product, Sale, InventoryTransaction, Expense, UserSettings, Customer, Return, ReturnItem } from '../types';

interface StoreState {
  // Auth
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Data
  products: Product[];
  sales: Sale[];
  inventoryTransactions: InventoryTransaction[];
  expenses: Expense[];
  userSettings: UserSettings | null;
  customers: Customer[];
  returns: Return[];
  
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
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'isActive' | 'specialPricing'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateCustomerSpecialPricing: (customerId: string, specialPrices: any[]) => Promise<void>;
  getCustomerSpecialPricing: (customerId: string) => Promise<any[]>;
  
  // Return actions
  addReturn: (returnData: Omit<Return, 'id'>) => Promise<void>;
  
  // Settings actions
  setMonthlyGoal: (goal: number) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Utility actions
  exportReportData: () => string;
  loadData: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  initializeAuth: () => Promise<void>;
  setInitialized: (initialized: boolean) => void;
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

// Helper function to safely convert date strings to Date objects
const safeParseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  const date = new Date(dateValue);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date value encountered:', dateValue, 'Using current date as fallback');
    return new Date();
  }
  
  return date;
};

// Helper function to convert date strings back to Date objects
const deserializeState = (str: string) => {
  const state = JSON.parse(str);
  
  // Convert user dates
  if (state.user?.subscriptionExpiry) {
    state.user.subscriptionExpiry = safeParseDate(state.user.subscriptionExpiry);
  }
  
  // Convert product dates
  if (state.products) {
    state.products = state.products.map((product: any) => ({
      ...product,
      createdAt: product.createdAt ? safeParseDate(product.createdAt) : undefined,
      updatedAt: product.updatedAt ? safeParseDate(product.updatedAt) : undefined,
    }));
  }
  
  // Convert sale dates
  if (state.sales) {
    state.sales = state.sales.map((sale: any) => ({
      ...sale,
      date: sale.date ? safeParseDate(sale.date) : undefined,
      dueDate: sale.dueDate ? safeParseDate(sale.dueDate) : undefined,
    }));
  }
  
  // Convert inventory transaction dates
  if (state.inventoryTransactions) {
    state.inventoryTransactions = state.inventoryTransactions.map((transaction: any) => ({
      ...transaction,
      date: transaction.date ? safeParseDate(transaction.date) : new Date(),
    }));
  }
  
  // Convert expense dates
  if (state.expenses) {
    state.expenses = state.expenses.map((expense: any) => ({
      ...expense,
      date: expense.date ? safeParseDate(expense.date) : undefined,
    }));
  }
  
  // Convert user settings dates
  if (state.userSettings) {
    if (state.userSettings.createdAt) {
      state.userSettings.createdAt = safeParseDate(state.userSettings.createdAt);
    }
    if (state.userSettings.updatedAt) {
      state.userSettings.updatedAt = safeParseDate(state.userSettings.updatedAt);
    }
    if (state.userSettings.subscriptionExpiry) {
      state.userSettings.subscriptionExpiry = safeParseDate(state.userSettings.subscriptionExpiry);
    }
  }
  
  // Convert customer dates
  if (state.customers) {
    state.customers = state.customers.map((customer: any) => ({
      ...customer,
      createdAt: customer.createdAt ? safeParseDate(customer.createdAt) : new Date(),
    }));
  }
  
  // Convert return dates
  if (state.returns) {
    state.returns = state.returns.map((returnData: any) => ({
      ...returnData,
      date: returnData.date ? safeParseDate(returnData.date) : new Date(),
    }));
  }
  
  return state;
};

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isInitialized: false,
      products: [],
      sales: [],
      inventoryTransactions: [],
      expenses: [],
      userSettings: null,
      customers: [],
      returns: [],
      isOnline: navigator.onLine,
      monthlyGoal: 50000,

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },

      // Initialize auth state from Supabase and localStorage
      initializeAuth: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        try {
          // Check for existing Supabase session first
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            // Clear local user state if Supabase session is invalid
            set({ user: null, isInitialized: true });
            return;
          }
          
          if (session?.user) {
            // User has active Supabase session
            const authUser = session.user;
            console.log('Found active Supabase session for:', authUser.email);
            
            // Check if user is new (created in last 5 minutes)
            const userCreatedAt = new Date(authUser.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isNewUser = userCreatedAt > fiveMinutesAgo;
            
            // Give new users a free one-month trial with all features
            const trialExpiry = isNewUser ? (() => {
              const expiry = new Date();
              expiry.setMonth(expiry.getMonth() + 1);
              return expiry;
            })() : undefined;
            
            const user: User = {
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
              plan: 'free',
              currency: 'PHP',
              subscriptionExpiry: trialExpiry,
            };
            
            set({ user, isInitialized: true });
            await get().loadData();
          } else {
            // No active Supabase session - clear any persisted user state
            console.log('No active Supabase session found, clearing local user state');
            set({ 
              user: null, 
              isInitialized: true,
              products: [],
              sales: [],
              inventoryTransactions: [],
              expenses: [],
              userSettings: null,
              customers: [],
              returns: [],
            });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // Clear user state on any auth initialization error
          set({ 
            user: null, 
            isInitialized: true,
            products: [],
            sales: [],
            inventoryTransactions: [],
            expenses: [],
            userSettings: null,
            customers: [],
            returns: [],
          });
        } finally {
          set({ isLoading: false });
        }
      },

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
                subscriptionExpiry: trialExpiry,
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
            // Give new users a free one-month trial with all features
            const trialExpiry = new Date();
            trialExpiry.setMonth(trialExpiry.getMonth() + 1);
            
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name,
              plan: 'free',
              currency: 'PHP',
              subscriptionExpiry: trialExpiry,
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
            customers: [],
            returns: [],
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

      // Customer actions
      addCustomer: async (customerData) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        const customer: Customer = {
          id: crypto.randomUUID(),
          ...customerData,
          balance: 0,
          creditLimit: customerData.creditLimit || 0,
          isActive: true,
          createdAt: new Date(),
          specialPricing: {}
        };

        // Update local state immediately
        set(state => ({
          customers: [...state.customers, customer]
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.customer(customer, user.id);
            const { error } = await supabase
              .from('customers')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to save customer to database:', error);
            throw error;
          }
        }
      },

      updateCustomer: async (id: string, updates) => {
        const { user, customers } = get();
        if (!user) throw new Error('User not authenticated');

        const existingCustomer = customers.find(c => c.id === id);
        if (!existingCustomer) throw new Error('Customer not found');

        const updatedCustomer = { ...existingCustomer, ...updates };

        // Update local state immediately
        set(state => ({
          customers: state.customers.map(c => 
            c.id === id ? updatedCustomer : c
          )
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = transformToSupabaseData.customer(updatedCustomer, user.id);
            const { error } = await supabase
              .from('customers')
              .update(supabaseData)
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update customer in database:', error);
            throw error;
          }
        }
      },

      deleteCustomer: async (id: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        // Update local state immediately
        set(state => ({
          customers: state.customers.filter(c => c.id !== id)
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('customers')
              .delete()
              .eq('id', id);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to delete customer from database:', error);
            throw error;
          }
        }
      },

      updateCustomerSpecialPricing: async (customerId: string, specialPrices: any[]) => {
        const { user, customers } = get();
        if (!user) throw new Error('User not authenticated');

        const customer = customers.find(c => c.id === customerId);
        if (!customer) throw new Error('Customer not found');

        // Convert special prices array to object format
        const specialPricingObj: Record<string, number> = {};
        specialPrices.forEach(item => {
          specialPricingObj[item.productId] = item.specialPrice;
        });

        // Update local state
        const updatedCustomer = {
          ...customer,
          specialPricing: specialPricingObj
        };

        set(state => ({
          customers: state.customers.map(c => 
            c.id === customerId ? updatedCustomer : c
          )
        }));

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const { error } = await supabase
              .from('customers')
              .update({ 
                special_pricing: specialPricingObj 
              })
              .eq('id', customerId);
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update customer special pricing:', error);
            throw error;
          }
        }
      },

      getCustomerSpecialPricing: async (customerId: string) => {
        const { customers, products } = get();
        
        const customer = customers.find(c => c.id === customerId);
        if (!customer || !customer.specialPricing) {
          return [];
        }
        
        // Convert object format to array format with product details
        const specialPrices = Object.entries(customer.specialPricing).map(([productId, specialPrice]) => {
          const product = products.find(p => p.id === productId);
          return {
            productId,
            productName: product?.name || 'Unknown Product',
            regularPrice: product?.price || 0,
            specialPrice
          };
        });
        
        return specialPrices;
      },

      // Helper function to find or create customer
      findOrCreateCustomer: async (customerName: string, customerEmail?: string, userId?: string) => {
        if (!customerName || customerName === 'Walk-in Customer' || !userId) {
          return null;
        }

        try {
          // First, try to find existing customer by name
          const { data: existingCustomers, error: searchError } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', userId)
            .eq('name', customerName)
            .limit(1);

          if (searchError) {
            console.error('Error searching for customer:', searchError);
            return null;
          }

          if (existingCustomers && existingCustomers.length > 0) {
            return existingCustomers[0].id;
          }

          // Customer doesn't exist, create new one
          const newCustomer = {
            id: crypto.randomUUID(),
            name: customerName,
            email: customerEmail || null,
            phone: null,
            address: null,
            balance: 0,
            credit_limit: 0,
            is_active: true,
            user_id: userId,
            created_at: new Date().toISOString(),
            special_pricing: {}
          };

          const { data: createdCustomer, error: createError } = await supabase
            .from('customers')
            .insert(newCustomer)
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating customer:', createError);
            return null;
          }

          return createdCustomer.id;
        } catch (error) {
          console.error('Error in findOrCreateCustomer:', error);
          return null;
        }
      },

      // Sale actions
      addSale: async (saleData) => {
        const { user, products, customers } = get();
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

        // Update customer balance if using credit
        if (sale.status === 'pending' && sale.useCredit && sale.customerId) {
          const customer = customers.find(c => c.id === sale.customerId);
          if (customer) {
            const updatedCustomer = {
              ...customer,
              balance: customer.balance + sale.total
            };
            
            set(state => ({
              customers: state.customers.map(c => 
                c.id === sale.customerId ? updatedCustomer : c
              )
            }));
            
            // Update customer balance in database
            if (user.id !== 'demo-user-id') {
              try {
                const { error } = await supabase
                  .from('customers')
                  .update({ balance: updatedCustomer.balance })
                  .eq('id', sale.customerId);
                
                if (error) {
                  console.error('Failed to update customer balance:', error);
                }
              } catch (error) {
                console.error('Failed to update customer balance:', error);
              }
            }
          }
        }

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            // Handle customer creation/lookup
            let customerId = null;
            if (sale.customerName && sale.customerName !== 'Walk-in Customer') {
              customerId = await get().findOrCreateCustomer(sale.customerName, sale.customerEmail, user.id);
            }

            // Prepare sale data for Supabase with proper UUID handling
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
              customer_id: customerId,
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
              throw error;
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
            throw new Error('Failed to save sale to database: ' + error.message);
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
            // Handle customer creation/lookup if customer name is being updated
            let customerId = updates.customerId;
            if (updates.customerName && updates.customerName !== 'Walk-in Customer') {
              customerId = await get().findOrCreateCustomer(updates.customerName, updates.customerEmail, user.id);
            } else if (updates.customerName === 'Walk-in Customer') {
              customerId = null;
            }

            const supabaseData = transformToSupabaseData.sale({ ...updates, customerId }, user.id);
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

      // Return actions
      addReturn: async (returnData) => {
        const { user, products, customers, sales } = get();
        if (!user) throw new Error('User not authenticated');

        const returnRecord: Return = {
          id: crypto.randomUUID(),
          ...returnData,
        };

        // Update local state
        set(state => ({
          returns: [...state.returns, returnRecord]
        }));

        // Update product stock for returned items
        const updatedProducts = [...products];
        for (const item of returnData.items) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex >= 0) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              currentStock: updatedProducts[productIndex].currentStock + item.quantity,
              updatedAt: new Date()
            };
          }
        }
        set({ products: updatedProducts });

        // Add inventory transactions for returned items
        const inventoryTransactions = returnData.items.map(item => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          type: 'return' as const,
          quantity: item.quantity,
          reason: `Return: ${returnData.originalSaleId} - ${item.reason}`,
          date: returnData.date,
        }));

        set(state => ({
          inventoryTransactions: [...state.inventoryTransactions, ...inventoryTransactions]
        }));

        // Update customer balance if refunding to store credit
        if (returnData.refundMethod === 'store_credit' && returnData.originalSale?.customerId) {
          const customer = customers.find(c => c.id === returnData.originalSale?.customerId);
          if (customer) {
            const updatedCustomer = {
              ...customer,
              balance: Math.max(0, customer.balance - returnData.total)
            };
            
            set(state => ({
              customers: state.customers.map(c => 
                c.id === customer.id ? updatedCustomer : c
              )
            }));
            
            // Update customer balance in database
            if (user.id !== 'demo-user-id') {
              try {
                const { error } = await supabase
                  .from('customers')
                  .update({ balance: updatedCustomer.balance })
                  .eq('id', customer.id);
                
                if (error) {
                  console.error('Failed to update customer balance:', error);
                }
              } catch (error) {
                console.error('Failed to update customer balance:', error);
              }
            }
          }
        }

        // Persist to database if not demo user
        if (user.id !== 'demo-user-id') {
          try {
            const supabaseData = {
              id: returnRecord.id,
              original_sale_id: returnRecord.originalSaleId,
              date: returnRecord.date.toISOString(),
              items: returnRecord.items,
              total: returnRecord.total,
              refund_method: returnRecord.refundMethod,
              status: returnRecord.status,
              reason: returnRecord.reason,
              user_id: user.id,
              created_at: new Date().toISOString()
            };

            const { error } = await supabase
              .from('returns')
              .insert(supabaseData);
            
            if (error) {
              handleSupabaseError(error);
            }

            // Update product stock in database
            for (const item of returnData.items) {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                const newStock = product.currentStock + item.quantity;
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
            console.error('Failed to save return to database:', error);
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
            // Only pass standard user metadata fields to Supabase auth
            const authData: any = {};
            if (data.name) {
              authData.name = data.name;
            }
            
            // Only update auth if we have valid auth data
            if (Object.keys(authData).length > 0) {
              const { error } = await supabase.auth.updateUser({
                data: authData,
              });
              
              if (error) {
                handleSupabaseError(error);
              }
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
              .upsert(supabaseData, { 
                onConflict: 'user_id' 
              });
            
            if (error) {
              handleSupabaseError(error);
            }
          } catch (error) {
            console.error('Failed to update user settings:', error);
            throw error;
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
              barcode: '8901234567890',
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
              barcode: '8901234567891',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '3',
              name: 'Herbal Tea Blend',
              category: 'Food & Beverage',
              price: 180,
              cost: 120,
              currentStock: 75,
              minStock: 15,
              barcode: '8901234567892',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

          const demoCustomers: Customer[] = [
            {
              id: '1',
              name: 'John Doe',
              phone: '+63 912 345 6789',
              email: 'john.doe@example.com',
              address: '123 Main St, Manila',
              balance: 0,
              creditLimit: 5000,
              isActive: true,
              createdAt: new Date(),
              specialPricing: {
                '1': 230, // Special price for Premium Coffee Beans
              }
            },
            {
              id: '2',
              name: 'Jane Smith',
              phone: '+63 917 234 5678',
              email: 'jane.smith@example.com',
              address: '456 Oak Ave, Quezon City',
              balance: 1500,
              creditLimit: 3000,
              isActive: true,
              createdAt: new Date(),
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
            customers: demoCustomers,
            returns: [],
          });
        } else {
          // Load real data from Supabase
          try {
            console.log('Loading data for user:', user.id);
            
            const [productsResult, salesResult, expensesResult, settingsResult, customersResult, returnsResult] = await Promise.all([
              supabase.from('products').select('*').eq('user_id', user.id),
              supabase.from('sales').select('*').eq('user_id', user.id),
              supabase.from('expenses').select('*').eq('user_id', user.id),
              supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
              supabase.from('customers').select('*').eq('user_id', user.id),
              supabase.from('returns').select('*').eq('user_id', user.id),
            ]);

            console.log('Products result:', productsResult);
            console.log('Sales result:', salesResult);
            console.log('Expenses result:', expensesResult);
            console.log('Settings result:', settingsResult);
            console.log('Customers result:', customersResult);
            console.log('Returns result:', returnsResult);

            const products = productsResult.data?.map(transformSupabaseData.product) || [];
            const sales = salesResult.data?.map(transformSupabaseData.sale) || [];
            const expenses = expensesResult.data?.map(transformSupabaseData.expense) || [];
            const userSettings = settingsResult.data ? transformSupabaseData.userSettings(settingsResult.data) : null;
            const customers = customersResult.data?.map(transformSupabaseData.customer) || [];
            
            // For returns, we need to transform the data
            const returns = returnsResult.data?.map((returnData: any) => ({
              id: returnData.id,
              originalSaleId: returnData.original_sale_id,
              date: new Date(returnData.date),
              items: returnData.items,
              total: returnData.total,
              refundMethod: returnData.refund_method,
              status: returnData.status,
              reason: returnData.reason,
            })) || [];

            set({
              products,
              sales,
              expenses,
              userSettings,
              customers,
              returns,
              monthlyGoal: userSettings?.monthlyGoal || 50000,
            });

            // If user settings has a plan, update the user object
            if (userSettings?.plan) {
              set(state => ({
                user: state.user ? {
                  ...state.user,
                  plan: userSettings.plan as any,
                  subscriptionExpiry: userSettings.subscriptionExpiry
                } : state.user
              }));
            }

            console.log('Data loaded successfully:', { 
              products: products.length, 
              sales: sales.length, 
              expenses: expenses.length,
              customers: customers.length,
              returns: returns.length
            });
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
        customers: state.customers,
        returns: state.returns,
        monthlyGoal: state.monthlyGoal,
      }),
      deserialize: deserializeState,
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

// Set up Supabase auth state listener for OAuth and session changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN' && session?.user) {
      const { user: authUser } = session;
      
      // Check if this is an OAuth user or regular sign in
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
          subscriptionExpiry: trialExpiry,
        };
        
        useStore.getState().setUser(user);
        await useStore.getState().loadData();
        
        // Redirect to dashboard if on login page
        if (window.location.pathname === '/login') {
          window.location.href = '/';
        }
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear user data on sign out
      useStore.getState().signOut();
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Session was refreshed, ensure user is still set
      const currentUser = useStore.getState().user;
      if (!currentUser && session.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User',
          plan: 'free',
          currency: 'PHP',
        };
        
        useStore.getState().setUser(user);
        await useStore.getState().loadData();
      }
    }
  });

  // Initialize auth when the store is created
  setTimeout(() => {
    useStore.getState().initializeAuth();
  }, 100);
}

// Export helper functions for use in components
export { useStore, isInFreeTrial, getEffectivePlan };