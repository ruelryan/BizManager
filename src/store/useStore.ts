import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';
import { User, Product, Sale, Customer, Expense, InventoryTransaction, UserSettings, Return, PaymentType, InstallmentPlan, InstallmentPayment, CustomerInstallmentSummary } from '../types';
import { plans } from '../utils/plans';

// Helper function to generate a unique invoice number
const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Default payment types
const defaultPaymentTypes: PaymentType[] = [
  { id: 'cash', name: 'Cash', isDefault: true },
  { id: 'card', name: 'Card', isDefault: true },
  { id: 'transfer', name: 'Bank Transfer', isDefault: true },
  { id: 'gcash', name: 'GCash', isDefault: true },
];

// Helper function to check if user is in free trial
export const isInFreeTrial = (user: User | null) => {
  if (!user || !user.subscriptionExpiry) return false;
  return user.subscriptionExpiry > new Date();
};

// Helper function to get effective plan (considering trial)
export const getEffectivePlan = (user: User | null) => {
  if (!user) return 'free';
  if (isInFreeTrial(user)) return 'pro'; // During trial, user has pro features
  return user.plan;
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
  installmentPlans: InstallmentPlan[];
  installmentPayments: InstallmentPayment[];

  // Auth actions
  signIn: (email: string, password: string, plan?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;

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
  addReturn: (returnData: Omit<Return, 'id'>) => Promise<void>;

  // Payment type actions
  addPaymentType: (name: string) => Promise<void>;
  updatePaymentType: (id: string, name: string) => Promise<void>;
  deletePaymentType: (id: string) => Promise<void>;

  // Installment actions
  addInstallmentPlan: (plan: Omit<InstallmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'payments'>) => Promise<void>;
  updateInstallmentPlan: (id: string, plan: Partial<InstallmentPlan>) => Promise<void>;
  deleteInstallmentPlan: (id: string) => Promise<void>;
  addInstallmentPayment: (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => Promise<void>;
  updateInstallmentPayment: (id: string, payment: Partial<InstallmentPayment>) => Promise<void>;
  getCustomerInstallmentSummary: (customerId: string) => CustomerInstallmentSummary;

  // User settings
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserSettings: (data: Partial<UserSettings>) => Promise<void>;
  setMonthlyGoal: (goal: number) => void;

  // Export data
  exportReportData: () => string;

  // Internal methods
  initAuth: () => Promise<void>;
  loadUserData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
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
      installmentPlans: [],
      installmentPayments: [],

      // Auth actions
      signIn: async (email, password, plan = 'free') => {
        try {
          set({ isLoading: true });
          
          // For demo account, create a mock user
          if (email === 'demo@businessmanager.com' && password === 'demo123') {
            const demoUser: User = {
              id: 'demo-user-id',
              email: 'demo@businessmanager.com',
              name: 'Demo User',
              plan: plan as 'free' | 'starter' | 'pro',
              subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            };
            
            set({ user: demoUser });
            
            // Load demo data
            await get().loadDemoData();
            
            return;
          }
          
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
                .maybeSingle(); // Use maybeSingle() instead of single() to avoid PGRST116 error
              
              if (profileError && profileError.code !== 'PGRST116') {
                throw profileError;
              }
              
              profileData = profile;
            } catch (profileError) {
              console.warn('Could not fetch profile:', profileError);
            }

            const { data: settingsData } = await supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: profileData?.full_name || data.user.user_metadata?.full_name || 'User',
              plan: settingsData?.plan || 'free',
              subscriptionExpiry: settingsData?.subscription_expiry ? new Date(settingsData.subscription_expiry) : undefined,
            };

            set({ user });
            
            // Load user data
            await get().loadUserData();
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

            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: name,
              plan: 'free',
              // Set subscription expiry to 30 days from now for free trial
              subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };

            set({ user });
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
          
          // For demo account, just clear the state
          if (get().user?.id === 'demo-user-id') {
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
            return;
          }
          
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

      // Product actions
      addProduct: async (product) => {
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          // For demo account, just add to local state
          if (user.id === 'demo-user-id') {
            const newProduct: Product = {
              id: `product-${Date.now()}`,
              ...product,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            set(state => ({ products: [...state.products, newProduct] }));
            return;
          }

          const { data, error } = await supabase
            .from('products')
            .insert(transformToSupabaseData.product(product, user.id))
            .select()
            .single();

          if (error) throw handleSupabaseError(error);

          const newProduct = transformSupabaseData.product(data);
          set(state => ({ products: [...state.products, newProduct] }));
        } catch (error) {
          console.error('Add product error:', error);
          throw error;
        }
      },

      updateProduct: async (id, product) => {
        try {
          const { user, products } = get();
          if (!user) throw new Error('User not authenticated');

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const updatedProducts = products.map(p => 
              p.id === id ? { ...p, ...product, updatedAt: new Date() } : p
            );
            set({ products: updatedProducts });
            return;
          }

          const { error } = await supabase
            .from('products')
            .update(transformToSupabaseData.product(product, user.id))
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const filteredProducts = products.filter(p => p.id !== id);
            set({ products: filteredProducts });
            return;
          }

          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) throw handleSupabaseError(error);

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const newSale: Sale = {
              id: `sale-${Date.now()}`,
              ...sale,
              invoiceNumber,
              date: new Date(),
            };
            
            set({ 
              sales: [...sales, newSale],
              products: updatedProducts
            });
            return;
          }

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

          // No longer updating customer balance for credit

          const newSale = transformSupabaseData.sale(data);
          set({ 
            sales: [...sales, newSale],
            products: updatedProducts
          });
        } catch (error) {
          console.error('Add sale error:', error);
          throw error;
        }
      },

      updateSale: async (id, sale) => {
        try {
          const { user, sales } = get();
          if (!user) throw new Error('User not authenticated');

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const updatedSales = sales.map(s => 
              s.id === id ? { ...s, ...sale } : s
            );
            set({ sales: updatedSales });
            return;
          }

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const filteredSales = sales.filter(s => s.id !== id);
            set({ sales: filteredSales });
            return;
          }

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

          // For demo account, just add to local state
          if (user.id === 'demo-user-id') {
            const newCustomer: Customer = {
              id: `customer-${Date.now()}`,
              ...customer,
              createdAt: new Date(),
            };
            set({ customers: [...customers, newCustomer] });
            return;
          }

          const { data, error } = await supabase
            .from('customers')
            .insert(transformToSupabaseData.customer(customer, user.id))
            .select()
            .single();

          if (error) throw handleSupabaseError(error);

          const newCustomer = transformSupabaseData.customer(data);
          set({ customers: [...customers, newCustomer] });
        } catch (error) {
          console.error('Add customer error:', error);
          throw error;
        }
      },

      updateCustomer: async (id, customer) => {
        try {
          const { user, customers } = get();
          if (!user) throw new Error('User not authenticated');

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const updatedCustomers = customers.map(c => 
              c.id === id ? { ...c, ...customer } : c
            );
            set({ customers: updatedCustomers });
            return;
          }

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const filteredCustomers = customers.filter(c => c.id !== id);
            set({ customers: filteredCustomers });
            return;
          }

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
          
          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const updatedCustomers = customers.map(c => 
              c.id === customerId ? { ...c, specialPricing: pricingObject } : c
            );
            set({ customers: updatedCustomers });
            return;
          }
          
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

          // For demo account, just add to local state
          if (user.id === 'demo-user-id') {
            const newExpense: Expense = {
              id: `expense-${Date.now()}`,
              ...expense,
            };
            set({ expenses: [...expenses, newExpense] });
            return;
          }

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const updatedExpenses = expenses.map(e => 
              e.id === id ? { ...e, ...expense } : e
            );
            set({ expenses: updatedExpenses });
            return;
          }

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

          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            const filteredExpenses = expenses.filter(e => e.id !== id);
            set({ expenses: filteredExpenses });
            return;
          }

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
          const { user, returns, products, sales } = get();
          if (!user) throw new Error('User not authenticated');
          
          // Update product stock for returned items
          const updatedProducts = [...products];
          for (const item of returnData.items) {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
              updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                currentStock: updatedProducts[productIndex].currentStock + item.quantity,
                updatedAt: new Date()
              };
            }
          }
          
          // Add return to state
          const newReturn: Return = {
            id: `return-${Date.now()}`,
            ...returnData,
            date: new Date(),
          };
          
          set({ 
            returns: [...returns, newReturn],
            products: updatedProducts
          });
          
          // Update original sale status if needed
          if (returnData.originalSaleId) {
            const originalSale = sales.find(s => s.id === returnData.originalSaleId);
            if (originalSale) {
              // Check if all items were returned
              const allItemsReturned = originalSale.items.every(item => {
                const returnedItem = returnData.items.find(ri => ri.productId === item.productId);
                return returnedItem && returnedItem.quantity >= item.quantity;
              });
              
              if (allItemsReturned) {
                await get().updateSale(returnData.originalSaleId, { status: 'refunded' });
              }
            }
          }
        } catch (error) {
          console.error('Add return error:', error);
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

      // Installment actions
      addInstallmentPlan: async (plan) => {
        try {
          const { installmentPlans } = get();
          
          const newPlan: InstallmentPlan = {
            id: `plan-${Date.now()}`,
            ...plan,
            createdAt: new Date(),
            updatedAt: new Date(),
            payments: []
          };
          
          set({ installmentPlans: [...installmentPlans, newPlan] });
          
          // Generate installment payment schedule
          const monthlyAmount = (plan.remainingBalance * (1 + plan.interestRate / 100)) / plan.termMonths;
          const paymentSchedule: Omit<InstallmentPayment, 'id' | 'createdAt'>[] = [];
          
          for (let i = 0; i < plan.termMonths; i++) {
            const dueDate = new Date(plan.startDate);
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            
            paymentSchedule.push({
              installmentPlanId: newPlan.id,
              amount: monthlyAmount,
              dueDate,
              status: 'pending'
            });
          }
          
          // Add payment schedule
          for (const payment of paymentSchedule) {
            await get().addInstallmentPayment(payment);
          }
          
        } catch (error) {
          console.error('Add installment plan error:', error);
          throw error;
        }
      },

      updateInstallmentPlan: async (id, plan) => {
        try {
          const { installmentPlans } = get();
          
          const updatedPlans = installmentPlans.map(p => 
            p.id === id ? { ...p, ...plan, updatedAt: new Date() } : p
          );
          
          set({ installmentPlans: updatedPlans });
        } catch (error) {
          console.error('Update installment plan error:', error);
          throw error;
        }
      },

      deleteInstallmentPlan: async (id) => {
        try {
          const { installmentPlans, installmentPayments } = get();
          
          const filteredPlans = installmentPlans.filter(p => p.id !== id);
          const filteredPayments = installmentPayments.filter(p => p.installmentPlanId !== id);
          
          set({ 
            installmentPlans: filteredPlans,
            installmentPayments: filteredPayments
          });
        } catch (error) {
          console.error('Delete installment plan error:', error);
          throw error;
        }
      },

      addInstallmentPayment: async (payment) => {
        try {
          const { installmentPayments } = get();
          
          const newPayment: InstallmentPayment = {
            id: `payment-${Date.now()}`,
            ...payment,
            createdAt: new Date()
          };
          
          set({ installmentPayments: [...installmentPayments, newPayment] });
        } catch (error) {
          console.error('Add installment payment error:', error);
          throw error;
        }
      },

      updateInstallmentPayment: async (id, payment) => {
        try {
          const { installmentPayments } = get();
          
          const updatedPayments = installmentPayments.map(p => 
            p.id === id ? { ...p, ...payment } : p
          );
          
          set({ installmentPayments: updatedPayments });
        } catch (error) {
          console.error('Update installment payment error:', error);
          throw error;
        }
      },

      getCustomerInstallmentSummary: (customerId) => {
        const { installmentPlans, installmentPayments } = get();
        
        // Get all installment plans for the customer
        const customerPlans = installmentPlans.filter(p => p.customerId === customerId && p.status === 'active');
        
        // Get all payments for customer plans
        const customerPayments = installmentPayments.filter(p => 
          customerPlans.some(plan => plan.id === p.installmentPlanId)
        );
        
        // Calculate totals
        const totalUnpaidAmount = customerPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const overdueAmount = customerPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const activeInstallments = customerPlans.length;
        
        // Find next payment date
        const nextPaymentDate = customerPayments
          .filter(p => p.status === 'pending')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate;
        
        return {
          customerId,
          totalUnpaidAmount,
          overdueAmount,
          activeInstallments,
          nextPaymentDate
        };
      },

      // User settings
      updateUserProfile: async (data) => {
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');
          
          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            set({ user: { ...user, ...data } });
            return;
          }
          
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
          
          // For demo account, just update local state
          if (user.id === 'demo-user-id') {
            set({ 
              userSettings: userSettings ? { ...userSettings, ...data } : { userId: user.id, ...data } as UserSettings
            });
            return;
          }
          
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

            const { data: settingsData } = await supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', data.session.user.id)
              .single();

            const user: User = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: profileData?.full_name || data.session.user.user_metadata?.full_name || 'User',
              plan: settingsData?.plan || 'free',
              subscriptionExpiry: settingsData?.subscription_expiry ? new Date(settingsData.subscription_expiry) : undefined,
            };

            set({ user });
            
            // Load user data
            await get().loadUserData();
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
          
          // Skip for demo user
          if (user.id === 'demo-user-id') {
            return;
          }
          
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
            .single();
            
          if (settingsError && settingsError.code !== 'PGRST116') {
            throw handleSupabaseError(settingsError);
          }
          
          // Transform data
          const products = productsData.map(transformSupabaseData.product);
          const sales = salesData.map(transformSupabaseData.sale);
          const customers = customersData.map(transformSupabaseData.customer);
          const expenses = expensesData.map(transformSupabaseData.expense);
          const userSettings = settingsData ? transformSupabaseData.userSettings(settingsData) : null;
          
          // Update state
          set({ 
            products,
            sales,
            customers,
            expenses,
            userSettings,
            monthlyGoal: userSettings?.monthlyGoal || 50000
          });
        } catch (error) {
          console.error('Load user data error:', error);
          throw error;
        }
      },

      // Load demo data
      loadDemoData: async () => {
        try {
          // Generate demo products
          const demoProducts: Product[] = [
            {
              id: 'product-1',
              name: 'Smartphone X',
              category: 'Electronics',
              price: 15000,
              cost: 12000,
              currentStock: 25,
              minStock: 5,
              barcode: '1234567890123',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'product-2',
              name: 'Laptop Pro',
              category: 'Electronics',
              price: 45000,
              cost: 38000,
              currentStock: 10,
              minStock: 3,
              barcode: '2345678901234',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'product-3',
              name: 'Wireless Earbuds',
              category: 'Accessories',
              price: 2500,
              cost: 1800,
              currentStock: 30,
              minStock: 10,
              barcode: '3456789012345',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'product-4',
              name: 'Smart Watch',
              category: 'Wearables',
              price: 8000,
              cost: 6500,
              currentStock: 15,
              minStock: 5,
              barcode: '4567890123456',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'product-5',
              name: 'Bluetooth Speaker',
              category: 'Audio',
              price: 3500,
              cost: 2800,
              currentStock: 20,
              minStock: 8,
              barcode: '5678901234567',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
          
          // Generate demo customers
          const demoCustomers: Customer[] = [
            {
              id: 'customer-1',
              name: 'Juan Dela Cruz',
              phone: '+63 912 345 6789',
              email: 'juan@example.com',
              address: 'Makati City, Metro Manila',
              isActive: true,
              createdAt: new Date(),
            },
            {
              id: 'customer-2',
              name: 'Maria Santos',
              phone: '+63 923 456 7890',
              email: 'maria@example.com',
              address: 'Quezon City, Metro Manila',
              isActive: true,
              createdAt: new Date(),
            },
            {
              id: 'customer-3',
              name: 'Pedro Reyes',
              phone: '+63 934 567 8901',
              email: 'pedro@example.com',
              address: 'Pasig City, Metro Manila',
              isActive: true,
              createdAt: new Date(),
            },
          ];
          
          // Generate demo sales
          const demoSales: Sale[] = [
            {
              id: 'sale-1',
              customerId: 'customer-1',
              customerName: 'Juan Dela Cruz',
              customerEmail: 'juan@example.com',
              items: [
                {
                  productId: 'product-1',
                  productName: 'Smartphone X',
                  quantity: 1,
                  price: 15000,
                  total: 15000,
                },
                {
                  productId: 'product-3',
                  productName: 'Wireless Earbuds',
                  quantity: 1,
                  price: 2500,
                  total: 2500,
                },
              ],
              total: 17500,
              paymentType: 'cash',
              status: 'paid',
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
              invoiceNumber: 'INV-001234',
            },
            {
              id: 'sale-2',
              customerId: 'customer-2',
              customerName: 'Maria Santos',
              customerEmail: 'maria@example.com',
              items: [
                {
                  productId: 'product-2',
                  productName: 'Laptop Pro',
                  quantity: 1,
                  price: 45000,
                  total: 45000,
                },
              ],
              total: 45000,
              paymentType: 'card',
              status: 'paid',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
              invoiceNumber: 'INV-001235',
            },
            {
              id: 'sale-3',
              customerId: 'customer-3',
              customerName: 'Pedro Reyes',
              customerEmail: 'pedro@example.com',
              items: [
                {
                  productId: 'product-4',
                  productName: 'Smart Watch',
                  quantity: 1,
                  price: 8000,
                  total: 8000,
                },
                {
                  productId: 'product-5',
                  productName: 'Bluetooth Speaker',
                  quantity: 2,
                  price: 3500,
                  total: 7000,
                },
              ],
              total: 15000,
              paymentType: 'gcash',
              status: 'pending',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
              invoiceNumber: 'INV-001236',
              dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Due in 6 days
            },
          ];
          
          // Generate demo expenses
          const demoExpenses: Expense[] = [
            {
              id: 'expense-1',
              description: 'Office Rent',
              amount: 15000,
              category: 'Rent',
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              paymentMethod: 'transfer',
              notes: 'Monthly office rent payment',
            },
            {
              id: 'expense-2',
              description: 'Electricity Bill',
              amount: 5000,
              category: 'Utilities',
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
              paymentMethod: 'gcash',
              notes: 'Monthly electricity bill',
            },
            {
              id: 'expense-3',
              description: 'Internet Subscription',
              amount: 2500,
              category: 'Utilities',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              paymentMethod: 'card',
              notes: 'Monthly internet subscription',
            },
          ];
          
          // Generate demo user settings
          const demoUserSettings: UserSettings = {
            userId: 'demo-user-id',
            monthlyGoal: 500000,
            currency: 'PHP',
            businessName: 'Demo Business',
            businessAddress: 'Makati City, Metro Manila, Philippines',
            businessPhone: '+63 912 345 6789',
            businessEmail: 'demo@businessmanager.com',
            createdAt: new Date(),
            updatedAt: new Date(),
            plan: 'pro', // Demo users get pro features
          };
          
          // Generate additional payment types
          const additionalPaymentTypes: PaymentType[] = [
            { id: 'payment-type-1', name: 'PayMaya' },
            { id: 'payment-type-2', name: 'Grab Pay' },
            { id: 'payment-type-3', name: 'WeChat Pay' }
          ];
          
          // Set demo data
          set({
            products: demoProducts,
            customers: demoCustomers,
            sales: demoSales,
            expenses: demoExpenses,
            userSettings: demoUserSettings,
            monthlyGoal: demoUserSettings.monthlyGoal,
            inventoryTransactions: [],
            returns: [],
            paymentTypes: [...defaultPaymentTypes, ...additionalPaymentTypes]
          });
        } catch (error) {
          console.error('Load demo data error:', error);
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
        installmentPlans: state.installmentPlans,
        installmentPayments: state.installmentPayments,
      }),
    }
  )
);

// Initialize auth state
useStore.getState().initAuth();