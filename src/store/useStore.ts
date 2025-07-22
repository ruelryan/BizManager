import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';
import { User, Product, Sale, Customer, Expense, InventoryTransaction, UserSettings, Return, PaymentType, Subscription } from '../types';

// Helper function to generate a unique invoice number
const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Helper function to generate a unique ID for various records
const generateId = (prefix: string) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`;
};

// Default payment types
const defaultPaymentTypes: PaymentType[] = [
  { id: 'cash', name: 'Cash', isDefault: true },
  { id: 'card', name: 'Card', isDefault: true },
  { id: 'transfer', name: 'Bank Transfer', isDefault: true },
  { id: 'gcash', name: 'GCash', isDefault: true },
];

// Helper function to check if user is in active free trial
export const isInFreeTrial = (user: User | null) => {
  if (!user) return false;
  
  // Check if user is explicitly in trial and trial hasn't expired
  if (user.isInTrial && user.trialEndDate) {
    return user.trialEndDate > new Date();
  }
  
  return false;
};

// Helper function to check if user has used their trial
export const hasUsedTrial = (user: User | null) => {
  if (!user) return false;
  return user.trialUsed || false;
};

// Helper function to get days remaining in trial
export const getTrialDaysRemaining = (user: User | null) => {
  if (!isInFreeTrial(user) || !user?.trialEndDate) return 0;
  
  const now = new Date();
  const diffTime = user.trialEndDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Helper function to get effective plan (considering trial and subscription)
export const getEffectivePlan = (user: User | null) => {
  if (!user) return 'free';
  
  // Priority 1: Active subscription takes precedence over everything
  if (isSubscriptionActive(user) && user.subscription) {
    return user.subscription.plan_type;
  }
  
  // Priority 2: If user is in active trial (and no subscription), they get pro features
  if (isInFreeTrial(user)) return 'pro';
  
  // Priority 3: Otherwise, use their base plan
  return user.plan;
};

// Helper function to check if subscription is active
export const isSubscriptionActive = (user: User | null) => {
  if (!user?.subscription) return false;
  return user.subscription.status === 'ACTIVE' && !user.subscription.cancel_at_period_end;
};

// Helper function to check if subscription will cancel at period end
export const willCancelAtPeriodEnd = (user: User | null) => {
  if (!user?.subscription) return false;
  return user.subscription.cancel_at_period_end;
};

// Helper function to get next billing date
export const getNextBillingDate = (user: User | null) => {
  if (!user?.subscription) return null;
  return user.subscription.next_billing_time || user.subscription.current_period_end;
};

interface StoreState {
  // Auth state
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isOnline: boolean;

  // Data
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  inventoryTransactions: InventoryTransaction[];
  returns: Return[];
  userSettings: UserSettings | null;
  monthlyGoal: number;
  paymentTypes: PaymentType[];

  // Auth actions
  signIn: (email: string, password: string, plan?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductCategories: () => string[];

  // Sale actions
  addSale: (sale: Omit<Sale, 'id' | 'invoiceNumber'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerSpecialPricing: (customerId: string) => Promise<any[]>;
  updateCustomerSpecialPricing: (customerId: string, specialPricing: any[]) => Promise<void>;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseCategories: () => string[];

  // Inventory actions
  addInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id'>) => Promise<void>;

  // Return actions
  addReturn: (returnData: Omit<Return, 'id'>) => Promise<string>;
  processOriginalSaleUpdate: (originalSaleId: string, returnItems: any[]) => Promise<void>;
  saveReturnToDatabase: (returnData: Return, inventoryTransactions: InventoryTransaction[]) => Promise<void>;
 
  // Payment type actions
  addPaymentType: (name: string) => Promise<void>;
  updatePaymentType: (id: string, name: string) => Promise<void>;
  deletePaymentType: (id: string) => Promise<void>;

  // User settings
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserSettings: (data: Partial<UserSettings>) => Promise<void>;
  setMonthlyGoal: (goal: number) => void;

  // Subscription management
  cancelSubscription: (reason?: string) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  loadSubscriptionData: () => Promise<void>;

  // Trial management
  startFreeTrial: () => Promise<void>;
  terminateTrialOnSubscription: (subscriptionData: Subscription) => Promise<void>;
  endTrial: () => Promise<void>;
  checkTrialExpiry: () => Promise<void>;

  // Export data
  exportReportData: () => string;

  // Internal methods
  initAuth: () => Promise<void>;
  loadUserData: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: true,
      isInitialized: false,
      isOnline: navigator.onLine,
      products: [],
      sales: [],
      customers: [],
      expenses: [],
      inventoryTransactions: [],
      returns: [],
      userSettings: null,
      monthlyGoal: 50000,
      paymentTypes: [...defaultPaymentTypes],

      // Auth actions
      signIn: async (email, password, plan = 'free') => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            // Try to get profile data, but don't fail if table doesn't exist or no profile found
            let profileData = null;
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
              if (profileError && profileError.code !== 'PGRST116') {
                throw profileError;
              }
              profileData = profile;
            } catch (profileError) {
              console.warn('Could not fetch profile:', profileError);
            }
            // Try to get user settings, but don't fail if they don't exist
            let settingsData = null;
            try {
              const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', data.user.id)
                .maybeSingle();
              
              if (settingsError && settingsError.code !== 'PGRST116') {
                throw settingsError;
              }
              settingsData = settings;
            } catch (settingsError) {
              console.warn('Could not fetch user settings:', settingsError);
            }
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: profileData?.full_name || data.user.user_metadata?.full_name || 'User',
              plan: settingsData?.plan || 'free',
              subscriptionExpiry: settingsData?.subscription_expiry ? new Date(settingsData.subscription_expiry) : undefined,
              isInTrial: settingsData?.is_in_trial || false,
              trialStartDate: settingsData?.trial_start_date ? new Date(settingsData.trial_start_date) : undefined,
              trialEndDate: settingsData?.trial_end_date ? new Date(settingsData.trial_end_date) : undefined,
              trialUsed: settingsData?.trial_used || false,
            };
            set({ user });
            // Load user data and subscription data
            await get().loadUserData();
            await get().loadSubscriptionData();
            
            // Check if trial has expired
            await get().checkTrialExpiry();
          }
        } catch (error) {
          console.error('Sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
          });
          if (error) throw error;
        } catch (error) {
          console.error('Google sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (email, password, name) => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            // Try to create profile, but don't fail if table doesn't exist
            try {
              await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  full_name: name,
                  email: email,
                });
            } catch (profileError) {
              console.warn('Could not create profile, table may not exist:', profileError);
            }

            const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: name,
              plan: 'free',
              subscriptionExpiry: undefined, // Will be set when they subscribe
              isInTrial: true,
              trialStartDate: new Date(),
              trialEndDate: trialEndDate,
              trialUsed: false,
            };

            set({ user });
            
            // Start the free trial
            await get().startFreeTrial();
          }
        } catch (error) {
          console.error('Sign up error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          // Clear all data
          set({ 
            user: null,
            products: [],
            sales: [],
            customers: [],
            expenses: [],
            inventoryTransactions: [],
            returns: [],
            userSettings: null
          });
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user) => {
        set({ user });
      },

      sendPasswordReset: async (email) => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
        } catch (error) {
          console.error('Send password reset error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, newPassword) => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (error) throw error;
        } catch (error) {
          console.error('Reset password error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Product actions
      addProduct: async (product) => {
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          const newProduct = {
            ...product,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Only make database call for real users, not demo users
          if (user.id !== 'demo-user-id') {
            const { data, error } = await supabase
              .from('products')
              .insert(transformToSupabaseData.product(product, user.id))
              .select()
              .single();

            if (error) throw handleSupabaseError(error);
            const dbProduct = transformSupabaseData.product(data);
            set(state => ({ products: [...state.products, dbProduct] }));
          } else {
            // For demo users, just update local state
            set(state => ({ products: [...state.products, newProduct] }));
          }
        } catch (error) {
          console.error('Add product error:', error);
          throw error;
        }
      },

      updateProduct: async (id, product) => {
        try {
          const { user, products } = get();
          if (!user) throw new Error('User not authenticated');

          // Only make database call for real users, not demo users
          if (user.id !== 'demo-user-id') {
            const { error } = await supabase
              .from('products')
              .update(transformToSupabaseData.product(product, user.id))
              .eq('id', id);

            if (error) throw handleSupabaseError(error);
          }

          const updatedProducts = products.map(p => 
            p.id === id ? { ...p, ...product, updatedAt: new Date() } : p
          );
          set({ products: updatedProducts });
        } catch (error) {
          console.error('Update product error:', error);
          throw error;
        }
      },

      deleteProduct: async (id) => {
        try {
          const { user, products } = get();
          if (!user) throw new Error('User not authenticated');

          // Only make database call for real users, not demo users
          if (user.id !== 'demo-user-id') {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', id);

            if (error) throw handleSupabaseError(error);
          }

          const filteredProducts = products.filter(p => p.id !== id);
          set({ products: filteredProducts });
        } catch (error) {
          console.error('Delete product error:', error);
          throw error;
        }
      },

      getProductCategories: () => {
        const { products } = get();
        const categories = [...new Set(products.map(p => p.category))];
        return categories.sort();
      },

      // Sale actions
      addSale: async (sale) => {
        try {
          const { user, products, sales, customers } = get();
          if (!user) throw new Error('User not authenticated');

          const invoiceNumber = generateInvoiceNumber();
          
          // Update product stock
          const updatedProducts = [...products];
          for (const item of sale.items) {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
              const newStock = updatedProducts[productIndex].currentStock - item.quantity;
              updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                currentStock: Math.max(0, newStock),
                updatedAt: new Date()
              };
            }
          }

          // No longer updating customer balance for credit

          const newSale = {
            ...sale,
            id: Date.now().toString(),
            invoiceNumber,
            date: new Date(),
          };

          // Only make database call for real users, not demo users
          if (user.id !== 'demo-user-id') {
            // Create sale in database
            const { data, error } = await supabase
              .from('sales')
              .insert(transformToSupabaseData.sale({
                ...sale,
                invoiceNumber,
              }, user.id))
              .select()
              .single();

            if (error) throw handleSupabaseError(error);

            // Update products in database
            for (const product of updatedProducts) {
              if (products.find(p => p.id === product.id)?.currentStock !== product.currentStock) {
                await supabase
                  .from('products')
                  .update({ stock: product.currentStock })
                  .eq('id', product.id);
              }
            }

            const dbSale = transformSupabaseData.sale(data);
            set({ 
              sales: [...sales, dbSale],
              products: updatedProducts
            });
          } else {
            // For demo users, just update local state
            set({ 
              sales: [...sales, newSale],
              products: updatedProducts
            });
          }
        } catch (error) {
          console.error('Add sale error:', error);
          throw error;
        }
      },

      updateSale: async (id, sale) => {
        try {
          const { user, sales } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('sales')
            .update(transformToSupabaseData.sale(sale, user.id))
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const updatedSales = sales.map(s => 
            s.id === id ? { ...s, ...sale } : s
          );
          set({ sales: updatedSales });
        } catch (error) {
          console.error('Update sale error:', error);
          throw error;
        }
      },

      deleteSale: async (id) => {
        try {
          const { user, sales } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const filteredSales = sales.filter(s => s.id !== id);
          set({ sales: filteredSales });
        } catch (error) {
          console.error('Delete sale error:', error);
          throw error;
        }
      },

      // Customer actions
      addCustomer: async (customer) => {
        try {
          const { user, customers } = get();
          if (!user) throw new Error('User not authenticated');

          const newCustomer = {
            ...customer,
            id: Date.now().toString(),
            createdAt: new Date(),
          };

          // Only make database call for real users, not demo users
          if (user.id !== 'demo-user-id') {
            const { data, error } = await supabase
              .from('customers')
              .insert(transformToSupabaseData.customer(customer, user.id))
              .select()
              .single();

            if (error) throw handleSupabaseError(error);
            const dbCustomer = transformSupabaseData.customer(data);
            set({ customers: [...customers, dbCustomer] });
          } else {
            // For demo users, just update local state
            set({ customers: [...customers, newCustomer] });
          }
        } catch (error) {
          console.error('Add customer error:', error);
          throw error;
        }
      },

      updateCustomer: async (id, customer) => {
        try {
          const { user, customers } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('customers')
            .update(transformToSupabaseData.customer(customer, user.id))
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const updatedCustomers = customers.map(c => 
            c.id === id ? { ...c, ...customer } : c
          );
          set({ customers: updatedCustomers });
        } catch (error) {
          console.error('Update customer error:', error);
          throw error;
        }
      },

      deleteCustomer: async (id) => {
        try {
          const { user, customers } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const filteredCustomers = customers.filter(c => c.id !== id);
          set({ customers: filteredCustomers });
        } catch (error) {
          console.error('Delete customer error:', error);
          throw error;
        }
      },

      getCustomerSpecialPricing: async (customerId) => {
        try {
          const { customers, products } = get();
          const customer = customers.find(c => c.id === customerId);
          
          if (!customer || !customer.specialPricing) {
            return [];
          }
          
          const specialPrices = [];
          for (const [productId, price] of Object.entries(customer.specialPricing)) {
            const product = products.find(p => p.id === productId);
            if (product) {
              specialPrices.push({
                productId,
                productName: product.name,
                regularPrice: product.price,
                specialPrice: price,
              });
            }
          }
          
          return specialPrices;
        } catch (error) {
          console.error('Get customer special pricing error:', error);
          throw error;
        }
      },

      updateCustomerSpecialPricing: async (customerId, specialPricing) => {
        try {
          const { user, customers } = get();
          if (!user) throw new Error('User not authenticated');
          
          // Convert array to object format
          const pricingObject = specialPricing.reduce((obj, item) => {
            obj[item.productId] = item.specialPrice;
            return obj;
          }, {} as Record<string, number>);
          
          // Update in database
          const { error } = await supabase
            .from('customers')
            .update({ special_pricing: pricingObject })
            .eq('id', customerId);
            
          if (error) throw handleSupabaseError(error);
          
          // Update local state
          const updatedCustomers = customers.map(c => 
            c.id === customerId ? { ...c, specialPricing: pricingObject } : c
          );
          set({ customers: updatedCustomers });
        } catch (error) {
          console.error('Update customer special pricing error:', error);
          throw error;
        }
      },

      // Expense actions
      addExpense: async (expense) => {
        try {
          const { user, expenses } = get();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('expenses')
            .insert(transformToSupabaseData.expense(expense, user.id))
            .select()
            .single();

          if (error) throw handleSupabaseError(error);

          const newExpense = transformSupabaseData.expense(data);
          set({ expenses: [...expenses, newExpense] });
        } catch (error) {
          console.error('Add expense error:', error);
          throw error;
        }
      },

      updateExpense: async (id, expense) => {
        try {
          const { user, expenses } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('expenses')
            .update(transformToSupabaseData.expense(expense, user.id))
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const updatedExpenses = expenses.map(e => 
            e.id === id ? { ...e, ...expense } : e
          );
          set({ expenses: updatedExpenses });
        } catch (error) {
          console.error('Update expense error:', error);
          throw error;
        }
      },

      deleteExpense: async (id) => {
        try {
          const { user, expenses } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

          const filteredExpenses = expenses.filter(e => e.id !== id);
          set({ expenses: filteredExpenses });
        } catch (error) {
          console.error('Delete expense error:', error);
          throw error;
        }
      },

      getExpenseCategories: () => {
        const { expenses } = get();
        const categories = [...new Set(expenses.map(e => e.category))];
        return categories.sort();
      },

      // Inventory actions
      addInventoryTransaction: async (transaction) => {
        try {
          const { products, inventoryTransactions } = get();
          
          // Find the product
          const productIndex = products.findIndex(p => p.id === transaction.productId);
          if (productIndex === -1) {
            throw new Error('Product not found');
          }
          
          // Update product stock
          const updatedProducts = [...products];
          if (transaction.type === 'stock-in') {
            updatedProducts[productIndex].currentStock += transaction.quantity;
          } else if (transaction.type === 'stock-out') {
            updatedProducts[productIndex].currentStock = Math.max(
              0, 
              updatedProducts[productIndex].currentStock - transaction.quantity
            );
          }
          
          // Add transaction to state
          const newTransaction: InventoryTransaction = {
            id: `transaction-${Date.now()}`,
            ...transaction,
            date: new Date(),
          };
          
          set({ 
            inventoryTransactions: [...inventoryTransactions, newTransaction],
            products: updatedProducts
          });
          
          // Update product in database (if not demo)
          const { user } = get();
          if (user && user.id !== 'demo-user-id') {
            await supabase
              .from('products')
              .update({ stock: updatedProducts[productIndex].currentStock })
              .eq('id', transaction.productId);
          }
        } catch (error) {
          console.error('Add inventory transaction error:', error);
          throw error;
        }
      },

      // Return actions
      addReturn: async (returnData) => {
        try {
          if (!returnData.items || !Array.isArray(returnData.items)) {
            throw new Error('Return data must include an array of items.');
          }

          const { user, returns, products, sales, inventoryTransactions } = get();
          if (!user) throw new Error('User not authenticated');
          
          // Generate unique return ID
          const returnId = generateId('RET');
          const newReturn: Return = {
            id: returnId,
            ...returnData,
            date: new Date(),
          };
          
          // Update product stock and create inventory transactions
          const updatedProducts = [...products];
          const newInventoryTransactions = [...inventoryTransactions];
          
          for (const item of returnData.items) {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
              const product = updatedProducts[productIndex];
              
              // Only add to sellable stock if item is not defective
              if (!item.isDefective) {
                product.currentStock += item.quantity;
              }
              
              product.updatedAt = new Date();
              updatedProducts[productIndex] = product;
              
              // Create inventory transaction for the return
              const inventoryTransaction: InventoryTransaction = {
                id: `inv-${returnId}-${item.productId}`,
                productId: item.productId,
                productName: item.productName,
                type: item.isDefective ? 'return_defective' : 'return',
                quantity: item.quantity,
                previousStock: product.currentStock - (item.isDefective ? 0 : item.quantity),
                newStock: product.currentStock,
                reason: `Return: ${item.reason}${item.isDefective ? ' (Defective)' : ''}`,
                date: new Date(),
                userId: user.id,
                referenceId: returnId,
                referenceType: 'return'
              };
              
              newInventoryTransactions.push(inventoryTransaction);
            }
          }
          
          // Update state with all changes
          set({ 
            returns: [...returns, newReturn],
            products: updatedProducts,
            inventoryTransactions: newInventoryTransactions
          });
          
          // Handle original sale status updates
          if (returnData.originalSaleId) {
            await get().processOriginalSaleUpdate(returnData.originalSaleId, returnData.items);
          }
          
          // Save to database if not demo user
          if (user.id !== 'demo-user-id') {
            await get().saveReturnToDatabase(newReturn, newInventoryTransactions.slice(-returnData.items.length));
          }
          
          console.log(`Return ${returnId} processed successfully`);
          return returnId;
          
        } catch (error) {
          console.error('Add return error:', error);
          // Re-throw the original error to be caught by the UI
          if (error instanceof Error) {
            throw new Error(`Failed to process return: ${error.message}`);
          }
          throw new Error('An unknown error occurred while processing the return.');
        }
      },
      
      // Helper method to process original sale updates
      processOriginalSaleUpdate: async (originalSaleId, returnItems) => {
        const { sales } = get();
        const originalSale = sales.find(s => s.id === originalSaleId);
        
        if (!originalSale) return;
        
        // Calculate total returned quantities for each product
        const returnedQuantities: Record<string, number> = {};
        
        // Get all previous returns for this sale
        const existingReturns = get().returns.filter(r => r.originalSaleId === originalSaleId);
        
        existingReturns.forEach(ret => {
          // The migration should prevent invalid items, but as a safeguard:
          if (ret.items && Array.isArray(ret.items)) {
            ret.items.forEach(item => {
              returnedQuantities[item.productId] = (returnedQuantities[item.productId] || 0) + item.quantity;
            });
          }
        });
        
        // Add current return quantities
        returnItems.forEach(item => {
          returnedQuantities[item.productId] = (returnedQuantities[item.productId] || 0) + item.quantity;
        });
        
        // Check if all items were returned
        const allItemsReturned = originalSale.items.every(item => {
          const totalReturned = returnedQuantities[item.productId] || 0;
          return totalReturned >= item.quantity;
        });
        
        // Check if any items were returned (partial return)
        const anyItemsReturned = originalSale.items.some(item => {
          const totalReturned = returnedQuantities[item.productId] || 0;
          return totalReturned > 0;
        });
        
        // Update sale status accordingly
        let newStatus: 'paid' | 'pending' | 'overdue' | 'refunded' | 'partially_refunded' = originalSale.status;
        
        if (allItemsReturned) {
          newStatus = 'refunded';
        } else if (anyItemsReturned) {
          newStatus = 'partially_refunded';
        }
        
        if (newStatus !== originalSale.status) {
          await get().updateSale(originalSaleId, { status: newStatus });
        }
      },
      
      // Helper method to save return to database
      saveReturnToDatabase: async (returnData, inventoryTransactions) => {
        try {
          // Save return record
          const { error: returnError } = await supabase.from('returns').insert({
            id: returnData.id,
            user_id: get().user?.id,
            sale_id: returnData.originalSaleId,
            refund_amount: returnData.total,
            refund_method: returnData.refundMethod,
            status: returnData.status,
            reason: returnData.reason,
            return_date: returnData.date.toISOString().split('T')[0]
          });
          
          if (returnError) throw returnError;
          
          // Save return items to return_items table
          const returnItems = returnData.items.map(item => ({
            return_id: returnData.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice || 0,
            reason: item.reason || returnData.reason,
            condition: item.isDefective ? 'defective' : 'used'
          }));
          
          const { error: returnItemsError } = await supabase.from('return_items').insert(returnItems);
          if (returnItemsError) throw returnItemsError;
          
          // Save inventory transactions
          const inventoryRecords = inventoryTransactions.map(transaction => ({
            id: transaction.id,
            user_id: get().user?.id,
            product_id: transaction.productId,
            type: transaction.type,
            quantity: transaction.quantity,
            previous_stock: transaction.previousStock,
            new_stock: transaction.newStock,
            reason: transaction.reason,
            date: transaction.date.toISOString(),
            reference_id: transaction.referenceId,
            reference_type: transaction.referenceType
          }));
          
          const { error: inventoryError } = await supabase.from('inventory_transactions').insert(inventoryRecords);
          if (inventoryError) throw inventoryError;
          
          // Update product stocks in database
          for (const transaction of inventoryTransactions) {
            const { error: productError } = await supabase
              .from('products')
              .update({ 
                stock: transaction.newStock,
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.productId)
              .eq('user_id', get().user?.id);
            
            if (productError) throw productError;
          }
          
        } catch (error) {
          console.error('Error saving return to database:', error);
          // Throw the error so the UI can catch it
          throw error;
        }
      },

      // Payment type actions
      addPaymentType: async (name) => {
        try {
          const { paymentTypes } = get();
          
          // Check if payment type already exists
          if (paymentTypes.some(pt => pt.name.toLowerCase() === name.toLowerCase())) {
            throw new Error('Payment type already exists');
          }
          
          // Create new payment type
          const newPaymentType: PaymentType = {
            id: `payment-type-${Date.now()}`,
            name,
          };
          
          set({ paymentTypes: [...paymentTypes, newPaymentType] });
          
          // In a real app, you would save to database here
          // For now, we're just using local state
        } catch (error) {
          console.error('Add payment type error:', error);
          throw error;
        }
      },
      
      updatePaymentType: async (id, name) => {
        try {
          const { paymentTypes } = get();
          
          // Check if this is a default payment type
          const isDefault = defaultPaymentTypes.some(pt => pt.id === id);
          if (isDefault) {
            throw new Error('Cannot modify default payment types');
          }
          
          // Check if payment type already exists
          if (paymentTypes.some(pt => pt.id !== id && pt.name.toLowerCase() === name.toLowerCase())) {
            throw new Error('Payment type already exists');
          }
          
          // Update payment type
          const updatedPaymentTypes = paymentTypes.map(pt => 
            pt.id === id ? { ...pt, name } : pt
          );
          
          set({ paymentTypes: updatedPaymentTypes });
          
          // In a real app, you would save to database here
        } catch (error) {
          console.error('Update payment type error:', error);
          throw error;
        }
      },
      
      deletePaymentType: async (id) => {
        try {
          const { paymentTypes, sales } = get();
          
          // Check if this is a default payment type
          const isDefault = defaultPaymentTypes.some(pt => pt.id === id);
          if (isDefault) {
            throw new Error('Cannot delete default payment types');
          }
          
          // Check if payment type is in use
          const isInUse = sales.some(sale => sale.paymentType === id);
          if (isInUse) {
            throw new Error('Cannot delete payment type that is in use');
          }
          
          // Delete payment type
          const filteredPaymentTypes = paymentTypes.filter(pt => pt.id !== id);
          
          set({ paymentTypes: filteredPaymentTypes });
          
          // In a real app, you would delete from database here
        } catch (error) {
          console.error('Delete payment type error:', error);
          throw error;
        }
      },

      // User settings
      updateUserProfile: async (data) => {
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');
          // Update auth metadata if name is provided
          if (data.name) {
            await supabase.auth.updateUser({
              data: { full_name: data.name }
            });
          }
          // Try to update profile, but don't fail if table doesn't exist
          try {
            const { error } = await supabase
              .from('profiles')
              .update({
                full_name: data.name,
              })
              .eq('id', user.id);
            if (error) throw handleSupabaseError(error);
          } catch (profileError) {
            console.warn('Could not update profile, table may not exist:', profileError);
          }
          // Update local state
          set({ user: { ...user, ...data } });
        } catch (error) {
          console.error('Update user profile error:', error);
          throw error;
        }
      },

      updateUserSettings: async (data) => {
        try {
          const { user, userSettings } = get();
          if (!user) throw new Error('User not authenticated');
          
          // Update or insert user settings with explicit conflict resolution
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              ...transformToSupabaseData.userSettings(data, user.id),
              user_id: user.id,
            }, {
              onConflict: 'user_id'
            });
            
          if (error) throw handleSupabaseError(error);
          
          // Update local state
          set({ 
            userSettings: userSettings ? { ...userSettings, ...data } : { userId: user.id, ...data } as UserSettings
          });
          
          // Update monthly goal if provided
          if (data.monthlyGoal) {
            set({ monthlyGoal: data.monthlyGoal });
          }
        } catch (error) {
          console.error('Update user settings error:', error);
          throw error;
        }
      },

      setMonthlyGoal: (goal) => {
        set({ monthlyGoal: goal });
      },

      // Export data
      exportReportData: () => {
        const { sales, products } = get();
        
        // Create CSV header
        let csv = 'Date,Invoice,Customer,Total,Items,Status\n';
        
        // Add rows
        sales.forEach(sale => {
          const date = sale.date.toISOString().split('T')[0];
          const invoice = sale.invoiceNumber || '';
          const customer = sale.customerName || 'Walk-in Customer';
          const total = sale.total;
          const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
          const status = sale.status;
          
          csv += `${date},${invoice},${customer},${total},${itemsCount},${status}\n`;
        });
        
        return csv;
      },

      // Subscription management
      cancelSubscription: async (reason?: string) => {
        const { user } = get();
        if (!user?.subscription) {
          throw new Error('No active subscription to cancel');
        }

        try {
          // Call the cancel subscription edge function
          const { error } = await supabase.functions.invoke('cancel-subscription', {
            body: {
              subscriptionId: user.subscription.paypal_subscription_id,
              reason: reason || 'User requested cancellation',
            },
          });
 
          if (error) {
            throw new Error(`Failed to cancel subscription: ${error.message}`);
          }

          // Update local state
          set(state => ({
            user: state.user ? {
              ...state.user,
              subscription: state.user.subscription ? {
                ...state.user.subscription,
                cancel_at_period_end: true,
                cancelled_at: new Date(),
                cancellation_reason: reason || 'User requested cancellation'
              } : undefined
            } : null
          }));

          // Reload subscription data to ensure sync
          await get().loadSubscriptionData();

        } catch (error) {
          console.error('Failed to cancel subscription:', error);
          throw error;
        }
      },

      reactivateSubscription: async () => {
        const { user } = get();
        if (!user?.subscription) {
          throw new Error('No subscription to reactivate');
        }

        try {
          // Call the reactivate subscription edge function
          const { error } = await supabase.functions.invoke('reactivate-subscription', {
            body: {
              subscriptionId: user.subscription.paypal_subscription_id,
            },
          });
 
          if (error) {
            throw new Error(`Failed to reactivate subscription: ${error.message}`);
          }

          // Update local state
          set(state => ({
            user: state.user ? {
              ...state.user,
              subscription: state.user.subscription ? {
                ...state.user.subscription,
                cancel_at_period_end: false,
                cancelled_at: undefined,
                cancellation_reason: undefined
              } : undefined
            } : null
          }));

          // Reload subscription data to ensure sync
          await get().loadSubscriptionData();

        } catch (error) {
          console.error('Failed to reactivate subscription:', error);
          throw error;
        }
      },

      loadSubscriptionData: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Load subscription data from database
          const { data: subscriptionData, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .single();

          if (error && error.code !== 'PGRST116') {
            throw handleSupabaseError(error);
          }

          // Transform subscription data
          const subscription = subscriptionData ? {
            ...subscriptionData,
            start_time: subscriptionData.start_time ? new Date(subscriptionData.start_time) : undefined,
            current_period_start: subscriptionData.current_period_start ? new Date(subscriptionData.current_period_start) : undefined,
            current_period_end: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : undefined,
            cancelled_at: subscriptionData.cancelled_at ? new Date(subscriptionData.cancelled_at) : undefined,
            next_billing_time: subscriptionData.next_billing_time ? new Date(subscriptionData.next_billing_time) : undefined,
            created_at: new Date(subscriptionData.created_at),
            updated_at: new Date(subscriptionData.updated_at)
          } : undefined;

          // Update user with subscription data
          set(state => ({
            user: state.user ? {
              ...state.user,
              subscription
            } : null
          }));

        } catch (error) {
          console.error('Failed to load subscription data:', error);
          // Don't throw error here as it would break the app if subscription data is missing
        }
      },

      // Trial management
      startFreeTrial: async () => {
        const { user } = get();
        if (!user) {
          throw new Error('User must be logged in to start trial');
        }

        // Check if user has already used their trial
        if (user.trialUsed) {
          throw new Error('User has already used their free trial');
        }

        // Check if user already has an active subscription
        if (isSubscriptionActive(user)) {
          console.log('User already has active subscription, skipping trial');
          return;
        }

        try {
          const trialStartDate = new Date();
          const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

          // Update user settings in database
          const { error } = await supabase.from('user_settings').upsert({
            user_id: user.id,
            is_in_trial: true,
            trial_start_date: trialStartDate.toISOString(),
            trial_end_date: trialEndDate.toISOString(),
            trial_used: true, // Mark as used immediately to prevent re-activation
            plan: 'free' // Keep base plan as free during trial
          }, {
            onConflict: 'user_id'
          });

          if (error) {
            throw error;
          }

          // Update local state
          set(state => ({
            user: state.user ? {
              ...state.user,
              isInTrial: true,
              trialStartDate,
              trialEndDate,
              trialUsed: true
            } : null
          }));

          console.log('✅ Free trial started successfully');

        } catch (error) {
          console.error('Failed to start free trial:', error);
          throw error;
        }
      },

      // Terminate trial when subscription is activated
      terminateTrialOnSubscription: async (subscriptionData: Subscription) => {
        const { user } = get();
        if (!user || !user.isInTrial) {
          console.log('User not in trial, no need to terminate');
          return;
        }

        try {
          // Update local state - trial is terminated, subscription is active
          set(state => ({
            user: state.user ? {
              ...state.user,
              isInTrial: false,
              plan: subscriptionData.plan_type,
              subscription: subscriptionData
            } : null
          }));

          console.log('✅ Trial terminated, subscription activated');

        } catch (error) {
          console.error('Failed to terminate trial:', error);
          throw error;
        }
      },

      endTrial: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Update user settings in database
          const { error } = await supabase.from('user_settings').update({
            is_in_trial: false,
            plan: 'free' // Ensure they're on free plan after trial
          }).eq('user_id', user.id);

          if (error) {
            throw error;
          }

          // Update local state
          set(state => ({
            user: state.user ? {
              ...state.user,
              isInTrial: false,
              plan: 'free'
            } : null
          }));

          console.log('✅ Trial ended, user moved to free plan');

        } catch (error) {
          console.error('Failed to end trial:', error);
          throw error;
        }
      },

      checkTrialExpiry: async () => {
        const { user } = get();
        if (!user || !user.isInTrial || !user.trialEndDate) return;

        // Check if trial has expired
        const now = new Date();
        if (user.trialEndDate <= now) {
          console.log('Trial has expired, ending trial...');
          await get().endTrial();
        }
      },

      // Initialize auth state
      initAuth: async () => {
        try {
          set({ isLoading: true });
          
          // Set up online/offline detection
          window.addEventListener('online', () => set({ isOnline: true }));
          window.addEventListener('offline', () => set({ isOnline: false }));
          
          const { data } = await supabase.auth.getSession();
          
          if (data.session?.user) {
            // Try to get profile data, but don't fail if table doesn't exist or no profile found
            let profileData = null;
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .maybeSingle(); // Use maybeSingle() instead of single() to avoid PGRST116 error
              
              if (profileError && profileError.code !== 'PGRST116') {
                throw profileError;
              }
              
              profileData = profile;
            } catch (profileError) {
              console.warn('Could not fetch profile:', profileError);
            }

            // Try to get user settings, but don't fail if they don't exist
            let settingsData = null;
            try {
              const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', data.session.user.id)
                .maybeSingle();
              
              if (settingsError && settingsError.code !== 'PGRST116') {
                throw settingsError;
              }
              settingsData = settings;
            } catch (settingsError) {
              console.warn('Could not fetch user settings:', settingsError);
            }

            const user: User = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: profileData?.full_name || data.session.user.user_metadata?.full_name || 'User',
              plan: settingsData?.plan || 'free',
              subscriptionExpiry: settingsData?.subscription_expiry ? new Date(settingsData.subscription_expiry) : undefined,
              isInTrial: settingsData?.is_in_trial || false,
              trialStartDate: settingsData?.trial_start_date ? new Date(settingsData.trial_start_date) : undefined,
              trialEndDate: settingsData?.trial_end_date ? new Date(settingsData.trial_end_date) : undefined,
              trialUsed: settingsData?.trial_used || false,
            };

            set({ user });
            
            // Load user data and subscription data
            await get().loadUserData();
            await get().loadSubscriptionData();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Load user data from Supabase
      loadUserData: async () => {
        try {
          const { user } = get();
          if (!user) return;
          
          // Load products
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id);
            
          if (productsError) throw handleSupabaseError(productsError);
          
          // Load sales
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id);
            
          if (salesError) throw handleSupabaseError(salesError);
          
          // Load customers
          const { data: customersData, error: customersError } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id);
            
          if (customersError) throw handleSupabaseError(customersError);
          
          // Load expenses
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id);
            
          if (expensesError) throw handleSupabaseError(expensesError);
          
          // Load user settings
          const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (settingsError && settingsError.code !== 'PGRST116') {
            throw handleSupabaseError(settingsError);
          }
          
          // Load inventory transactions
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
            
          if (inventoryError) throw handleSupabaseError(inventoryError);
          
          // Transform data
          const products = productsData.map(transformSupabaseData.product);
          const sales = salesData.map(transformSupabaseData.sale);
          const customers = customersData.map(transformSupabaseData.customer);
          const expenses = expensesData.map(transformSupabaseData.expense);
          const inventoryTransactions = inventoryData.map(transformSupabaseData.inventoryTransaction);
          const userSettings = settingsData ? transformSupabaseData.userSettings(settingsData) : null;
          
          // Update state
          set({ 
            products,
            sales,
            customers,
            expenses,
            inventoryTransactions,
            userSettings,
            monthlyGoal: userSettings?.monthlyGoal || 50000
          });
        } catch (error) {
          console.error('Load user data error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'bizmanager-storage',
      partialize: (state) => ({
        user: state.user,
        products: state.products,
        sales: state.sales,
        customers: state.customers,
        expenses: state.expenses,
        inventoryTransactions: state.inventoryTransactions,
        returns: state.returns,
        userSettings: state.userSettings,
        monthlyGoal: state.monthlyGoal,
        paymentTypes: state.paymentTypes,
      }),
      version: 1, // Start with version 1 for migration
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1: Fix malformed return items
          if (persistedState && persistedState.returns) {
            persistedState.returns = persistedState.returns.map((r: any) => {
              if (!r) return null; // Remove null entries

              // Rename `returnItems` to `items`
              if (r.returnItems && !r.items) {
                r.items = r.returnItems;
                delete r.returnItems;
              }

              // Ensure `items` is an array
              if (!Array.isArray(r.items)) {
                r.items = [];
              }
              
              return r;
            }).filter(Boolean); // Filter out any null entries
          }
        }
        return persistedState;
      },
    }
  )
);

// Initialize auth state
useStore.getState().initAuth();