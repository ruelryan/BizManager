import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, handleSupabaseError, transformSupabaseData, transformToSupabaseData } from '../lib/supabase';
import { InstallmentPlan, InstallmentPayment, PaymentReminder, PaymentSummary, PaymentReport } from '../types';
import { format, addMonths, isAfter, isBefore, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface InstallmentState {
  installmentPlans: InstallmentPlan[];
  installmentPayments: InstallmentPayment[];
  paymentReminders: PaymentReminder[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInstallmentPlans: () => Promise<void>;
  fetchInstallmentPayments: (planId?: string) => Promise<void>;
  fetchPaymentReminders: (paymentId?: string) => Promise<void>;
  
  addInstallmentPlan: (plan: Omit<InstallmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'payments'>) => Promise<string>;
  updateInstallmentPlan: (id: string, plan: Partial<InstallmentPlan>) => Promise<void>;
  deleteInstallmentPlan: (id: string) => Promise<void>;
  
  addInstallmentPayment: (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => Promise<string>;
  updateInstallmentPayment: (id: string, payment: Partial<InstallmentPayment>) => Promise<void>;
  deleteInstallmentPayment: (id: string) => Promise<void>;
  
  addPaymentReminder: (reminder: Omit<PaymentReminder, 'id' | 'createdAt'>) => Promise<string>;
  updatePaymentReminder: (id: string, reminder: Partial<PaymentReminder>) => Promise<void>;
  deletePaymentReminder: (id: string) => Promise<void>;
  
  // Utility functions
  generatePaymentSchedule: (
    totalAmount: number, 
    downPayment: number, 
    termMonths: number, 
    interestRate: number, 
    startDate: Date
  ) => InstallmentPayment[];
  
  getPaymentSummary: (timeRange?: 'month' | 'year' | 'all') => PaymentSummary;
  generatePaymentReport: (startDate: Date, endDate: Date) => PaymentReport;
  
  // Reminder functions
  generateReminders: (paymentId: string, types: ('upcoming' | 'due' | 'overdue')[]) => Promise<void>;
  sendReminders: () => Promise<void>;
}

// Helper function to transform Supabase data to app format
const transformInstallmentPlan = (data: any): InstallmentPlan => ({
  id: data.id,
  customerId: data.customer_id,
  customerName: data.customer_name,
  totalAmount: Number(data.total_amount),
  downPayment: Number(data.down_payment),
  remainingBalance: Number(data.remaining_balance),
  termMonths: data.term_months,
  interestRate: Number(data.interest_rate),
  status: data.status,
  startDate: new Date(data.start_date),
  endDate: new Date(data.end_date),
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  notes: data.notes,
  saleId: data.sale_id,
  payments: [],
});

const transformInstallmentPayment = (data: any): InstallmentPayment => ({
  id: data.id,
  installmentPlanId: data.installment_plan_id,
  amount: Number(data.amount),
  dueDate: new Date(data.due_date),
  paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
  status: data.status,
  paymentMethod: data.payment_method,
  notes: data.notes,
  createdAt: new Date(data.created_at),
});

const transformPaymentReminder = (data: any): PaymentReminder => ({
  id: data.id,
  installmentPaymentId: data.installment_payment_id,
  reminderDate: new Date(data.reminder_date),
  sent: data.sent,
  reminderType: data.reminder_type,
  message: data.message,
  createdAt: new Date(data.created_at),
});

// Create the store
export const useInstallmentStore = create<InstallmentState>()(
  persist(
    (set, get) => ({
      installmentPlans: [],
      installmentPayments: [],
      paymentReminders: [],
      isLoading: false,
      error: null,
      
      fetchInstallmentPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('installment_plans')
            .select(`
              *,
              customers (id, name)
            `)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          // Transform data and include customer name
          const transformedData = data.map(plan => ({
            ...transformInstallmentPlan(plan),
            customerName: plan.customers?.name
          }));
          
          set({ installmentPlans: transformedData, isLoading: false });
        } catch (error) {
          console.error('Error fetching installment plans:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      fetchInstallmentPayments: async (planId) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('installment_payments')
            .select('*')
            .order('due_date', { ascending: true });
            
          if (planId) {
            query = query.eq('installment_plan_id', planId);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const transformedData = data.map(transformInstallmentPayment);
          
          set({ installmentPayments: transformedData, isLoading: false });
          
          // Update the payments array in each installment plan
          if (planId) {
            set(state => ({
              installmentPlans: state.installmentPlans.map(plan => 
                plan.id === planId 
                  ? { ...plan, payments: transformedData }
                  : plan
              )
            }));
          } else {
            // Group payments by plan ID
            const paymentsByPlan: Record<string, InstallmentPayment[]> = {};
            transformedData.forEach(payment => {
              if (!paymentsByPlan[payment.installmentPlanId]) {
                paymentsByPlan[payment.installmentPlanId] = [];
              }
              paymentsByPlan[payment.installmentPlanId].push(payment);
            });
            
            // Update each plan with its payments
            set(state => ({
              installmentPlans: state.installmentPlans.map(plan => ({
                ...plan,
                payments: paymentsByPlan[plan.id] || []
              }))
            }));
          }
        } catch (error) {
          console.error('Error fetching installment payments:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      fetchPaymentReminders: async (paymentId) => {
        set({ isLoading: true, error: null });
        try {
          let query = supabase
            .from('payment_reminders')
            .select('*')
            .order('reminder_date', { ascending: true });
            
          if (paymentId) {
            query = query.eq('installment_payment_id', paymentId);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const transformedData = data.map(transformPaymentReminder);
          
          set({ paymentReminders: transformedData, isLoading: false });
        } catch (error) {
          console.error('Error fetching payment reminders:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      addInstallmentPlan: async (plan) => {
        set({ isLoading: true, error: null });
        try {
          // Get customer name for display purposes
          const { data: customerData } = await supabase
            .from('customers')
            .select('name')
            .eq('id', plan.customerId)
            .single();
            
          const customerName = customerData?.name || '';
          
          // Convert to Supabase format
          const planData = {
            customer_id: plan.customerId,
            total_amount: plan.totalAmount,
            down_payment: plan.downPayment,
            remaining_balance: plan.totalAmount - plan.downPayment,
            term_months: plan.termMonths,
            interest_rate: plan.interestRate,
            status: plan.status,
            start_date: format(plan.startDate, 'yyyy-MM-dd'),
            end_date: format(plan.endDate, 'yyyy-MM-dd'),
            notes: plan.notes,
            sale_id: plan.saleId
          };
          
          const { data, error } = await supabase
            .from('installment_plans')
            .insert(planData)
            .select()
            .single();
            
          if (error) throw error;
          
          // Generate payment schedule
          const paymentSchedule = get().generatePaymentSchedule(
            plan.totalAmount,
            plan.downPayment,
            plan.termMonths,
            plan.interestRate,
            plan.startDate
          );
          
          // Insert payment schedule
          const paymentData = paymentSchedule.map(payment => ({
            installment_plan_id: data.id,
            amount: payment.amount,
            due_date: format(payment.dueDate, 'yyyy-MM-dd'),
            status: payment.status
          }));
          
          const { error: paymentError } = await supabase
            .from('installment_payments')
            .insert(paymentData);
            
          if (paymentError) throw paymentError;
          
          // Add the new plan to the state
          const newPlan: InstallmentPlan = {
            ...transformInstallmentPlan(data),
            customerName,
            payments: paymentSchedule.map(p => ({
              ...p,
              id: '', // IDs will be fetched in the next step
              installmentPlanId: data.id,
              createdAt: new Date()
            }))
          };
          
          set(state => ({
            installmentPlans: [newPlan, ...state.installmentPlans],
            isLoading: false
          }));
          
          // Fetch the actual payments with their IDs
          get().fetchInstallmentPayments(data.id);
          
          return data.id;
        } catch (error) {
          console.error('Error adding installment plan:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
          throw error;
        }
      },
      
      updateInstallmentPlan: async (id, plan) => {
        set({ isLoading: true, error: null });
        try {
          // Convert to Supabase format
          const planData: any = {};
          
          if (plan.customerId) planData.customer_id = plan.customerId;
          if (plan.totalAmount !== undefined) planData.total_amount = plan.totalAmount;
          if (plan.downPayment !== undefined) planData.down_payment = plan.downPayment;
          if (plan.remainingBalance !== undefined) planData.remaining_balance = plan.remainingBalance;
          if (plan.termMonths !== undefined) planData.term_months = plan.termMonths;
          if (plan.interestRate !== undefined) planData.interest_rate = plan.interestRate;
          if (plan.status) planData.status = plan.status;
          if (plan.startDate) planData.start_date = format(plan.startDate, 'yyyy-MM-dd');
          if (plan.endDate) planData.end_date = format(plan.endDate, 'yyyy-MM-dd');
          if (plan.notes !== undefined) planData.notes = plan.notes;
          if (plan.saleId) planData.sale_id = plan.saleId;
          
          const { error } = await supabase
            .from('installment_plans')
            .update(planData)
            .eq('id', id);
            
          if (error) throw error;
          
          // Update the plan in the state
          set(state => ({
            installmentPlans: state.installmentPlans.map(p => 
              p.id === id ? { ...p, ...plan } : p
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating installment plan:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      deleteInstallmentPlan: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('installment_plans')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          // Remove the plan from the state
          set(state => ({
            installmentPlans: state.installmentPlans.filter(p => p.id !== id),
            installmentPayments: state.installmentPayments.filter(p => p.installmentPlanId !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error deleting installment plan:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      addInstallmentPayment: async (payment) => {
        set({ isLoading: true, error: null });
        try {
          // Convert to Supabase format
          const paymentData = {
            installment_plan_id: payment.installmentPlanId,
            amount: payment.amount,
            due_date: format(payment.dueDate, 'yyyy-MM-dd'),
            payment_date: payment.paymentDate ? format(payment.paymentDate, 'yyyy-MM-dd') : null,
            status: payment.status,
            payment_method: payment.paymentMethod,
            notes: payment.notes
          };
          
          const { data, error } = await supabase
            .from('installment_payments')
            .insert(paymentData)
            .select()
            .single();
            
          if (error) throw error;
          
          const newPayment = transformInstallmentPayment(data);
          
          // Add the new payment to the state
          set(state => ({
            installmentPayments: [...state.installmentPayments, newPayment],
            installmentPlans: state.installmentPlans.map(plan => 
              plan.id === payment.installmentPlanId
                ? { 
                    ...plan, 
                    payments: [...plan.payments, newPayment],
                    // If payment is marked as paid, update the remaining balance
                    ...(payment.status === 'paid' && {
                      remainingBalance: plan.remainingBalance - payment.amount
                    })
                  }
                : plan
            ),
            isLoading: false
          }));
          
          return data.id;
        } catch (error) {
          console.error('Error adding installment payment:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
          throw error;
        }
      },
      
      updateInstallmentPayment: async (id, payment) => {
        set({ isLoading: true, error: null });
        try {
          // Get the original payment to check for status change
          const originalPayment = get().installmentPayments.find(p => p.id === id);
          if (!originalPayment) throw new Error('Payment not found');
          
          // Convert to Supabase format
          const paymentData: any = {};
          
          if (payment.amount !== undefined) paymentData.amount = payment.amount;
          if (payment.dueDate) paymentData.due_date = format(payment.dueDate, 'yyyy-MM-dd');
          if (payment.paymentDate) paymentData.payment_date = format(payment.paymentDate, 'yyyy-MM-dd');
          if (payment.status) paymentData.status = payment.status;
          if (payment.paymentMethod !== undefined) paymentData.payment_method = payment.paymentMethod;
          if (payment.notes !== undefined) paymentData.notes = payment.notes;
          
          const { error } = await supabase
            .from('installment_payments')
            .update(paymentData)
            .eq('id', id);
            
          if (error) throw error;
          
          // Update the payment in the state
          set(state => {
            const updatedPayments = state.installmentPayments.map(p => 
              p.id === id ? { ...p, ...payment } : p
            );
            
            // If payment status changed to 'paid', update the plan's remaining balance
            let updatedPlans = state.installmentPlans;
            if (payment.status === 'paid' && originalPayment.status !== 'paid') {
              updatedPlans = state.installmentPlans.map(plan => 
                plan.id === originalPayment.installmentPlanId
                  ? { 
                      ...plan, 
                      remainingBalance: plan.remainingBalance - originalPayment.amount,
                      payments: plan.payments.map(p => p.id === id ? { ...p, ...payment } : p)
                    }
                  : plan
              );
            } else if (payment.status !== 'paid' && originalPayment.status === 'paid') {
              // If payment status changed from 'paid' to something else, add the amount back
              updatedPlans = state.installmentPlans.map(plan => 
                plan.id === originalPayment.installmentPlanId
                  ? { 
                      ...plan, 
                      remainingBalance: plan.remainingBalance + originalPayment.amount,
                      payments: plan.payments.map(p => p.id === id ? { ...p, ...payment } : p)
                    }
                  : plan
              );
            } else {
              // Just update the payment in the plan
              updatedPlans = state.installmentPlans.map(plan => ({
                ...plan,
                payments: plan.payments.map(p => p.id === id ? { ...p, ...payment } : p)
              }));
            }
            
            return {
              installmentPayments: updatedPayments,
              installmentPlans: updatedPlans,
              isLoading: false
            };
          });
        } catch (error) {
          console.error('Error updating installment payment:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      deleteInstallmentPayment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Get the payment before deleting it
          const payment = get().installmentPayments.find(p => p.id === id);
          if (!payment) throw new Error('Payment not found');
          
          const { error } = await supabase
            .from('installment_payments')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          // Remove the payment from the state
          set(state => ({
            installmentPayments: state.installmentPayments.filter(p => p.id !== id),
            installmentPlans: state.installmentPlans.map(plan => 
              plan.id === payment.installmentPlanId
                ? { 
                    ...plan, 
                    payments: plan.payments.filter(p => p.id !== id),
                    // If payment was paid, add the amount back to the remaining balance
                    ...(payment.status === 'paid' && {
                      remainingBalance: plan.remainingBalance + payment.amount
                    })
                  }
                : plan
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error deleting installment payment:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      addPaymentReminder: async (reminder) => {
        set({ isLoading: true, error: null });
        try {
          // Convert to Supabase format
          const reminderData = {
            installment_payment_id: reminder.installmentPaymentId,
            reminder_date: format(reminder.reminderDate, 'yyyy-MM-dd'),
            sent: reminder.sent,
            reminder_type: reminder.reminderType,
            message: reminder.message
          };
          
          const { data, error } = await supabase
            .from('payment_reminders')
            .insert(reminderData)
            .select()
            .single();
            
          if (error) throw error;
          
          const newReminder = transformPaymentReminder(data);
          
          // Add the new reminder to the state
          set(state => ({
            paymentReminders: [...state.paymentReminders, newReminder],
            isLoading: false
          }));
          
          return data.id;
        } catch (error) {
          console.error('Error adding payment reminder:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
          throw error;
        }
      },
      
      updatePaymentReminder: async (id, reminder) => {
        set({ isLoading: true, error: null });
        try {
          // Convert to Supabase format
          const reminderData: any = {};
          
          if (reminder.reminderDate) reminderData.reminder_date = format(reminder.reminderDate, 'yyyy-MM-dd');
          if (reminder.sent !== undefined) reminderData.sent = reminder.sent;
          if (reminder.reminderType) reminderData.reminder_type = reminder.reminderType;
          if (reminder.message) reminderData.message = reminder.message;
          
          const { error } = await supabase
            .from('payment_reminders')
            .update(reminderData)
            .eq('id', id);
            
          if (error) throw error;
          
          // Update the reminder in the state
          set(state => ({
            paymentReminders: state.paymentReminders.map(r => 
              r.id === id ? { ...r, ...reminder } : r
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating payment reminder:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      deletePaymentReminder: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('payment_reminders')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          // Remove the reminder from the state
          set(state => ({
            paymentReminders: state.paymentReminders.filter(r => r.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error deleting payment reminder:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      generatePaymentSchedule: (totalAmount, downPayment, termMonths, interestRate, startDate) => {
        const remainingAmount = totalAmount - downPayment;
        const monthlyInterestRate = interestRate / 100 / 12;
        
        // Calculate monthly payment amount (with interest if applicable)
        let monthlyPayment;
        if (interestRate > 0) {
          // Formula for monthly payment with interest: P * r * (1 + r)^n / ((1 + r)^n - 1)
          const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths);
          const denominator = Math.pow(1 + monthlyInterestRate, termMonths) - 1;
          monthlyPayment = remainingAmount * (numerator / denominator);
        } else {
          // Simple division for zero interest
          monthlyPayment = remainingAmount / termMonths;
        }
        
        // Round to 2 decimal places
        monthlyPayment = Math.round(monthlyPayment * 100) / 100;
        
        // Generate payment schedule
        const payments: InstallmentPayment[] = [];
        let remainingBalance = remainingAmount;
        
        for (let i = 0; i < termMonths; i++) {
          const dueDate = addMonths(startDate, i + 1);
          
          // For the last payment, adjust to account for rounding errors
          let paymentAmount = i === termMonths - 1 ? remainingBalance : monthlyPayment;
          
          // Ensure payment amount is positive and not greater than remaining balance
          paymentAmount = Math.min(Math.max(0, paymentAmount), remainingBalance);
          
          payments.push({
            id: '', // Will be assigned by the database
            installmentPlanId: '', // Will be assigned later
            amount: paymentAmount,
            dueDate,
            status: 'pending',
            createdAt: new Date()
          });
          
          remainingBalance -= paymentAmount;
        }
        
        return payments;
      },
      
      getPaymentSummary: (timeRange = 'month') => {
        const { installmentPlans, installmentPayments } = get();
        
        // Define date range based on selected time range
        let startDate: Date, endDate: Date;
        const now = new Date();
        
        if (timeRange === 'month') {
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        } else if (timeRange === 'year') {
          startDate = startOfYear(now);
          endDate = endOfYear(now);
        } else {
          // All time - use a very old start date
          startDate = new Date(2000, 0, 1);
          endDate = new Date(2100, 11, 31);
        }
        
        // Filter payments by date range
        const filteredPayments = installmentPayments.filter(payment => {
          const paymentDate = payment.paymentDate || payment.dueDate;
          return isAfter(paymentDate, startDate) && isBefore(paymentDate, endDate);
        });
        
        // Calculate metrics
        const totalCollected = filteredPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
          
        const totalPending = filteredPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
          
        const totalOverdue = filteredPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + p.amount, 0);
          
        // Count active plans
        const activePlans = installmentPlans.filter(p => p.status === 'active').length;
        
        // Calculate completion rate (paid payments / total payments)
        const totalPayments = filteredPayments.length;
        const paidPayments = filteredPayments.filter(p => p.status === 'paid').length;
        const completionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
        
        return {
          totalCollected,
          totalPending,
          totalOverdue,
          activePlans,
          completionRate
        };
      },
      
      generatePaymentReport: (startDate, endDate) => {
        const { installmentPayments } = get();
        
        // Filter payments by date range
        const filteredPayments = installmentPayments.filter(payment => {
          const paymentDate = payment.paymentDate || payment.dueDate;
          return isAfter(paymentDate, startDate) && isBefore(paymentDate, endDate);
        });
        
        // Calculate summary metrics
        const totalPayments = filteredPayments.length;
        const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const paidAmount = filteredPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = filteredPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0);
        const overdueAmount = filteredPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + p.amount, 0);
          
        // Calculate delinquency rate (overdue payments / total payments)
        const overduePayments = filteredPayments.filter(p => p.status === 'overdue').length;
        const delinquencyRate = totalPayments > 0 ? (overduePayments / totalPayments) * 100 : 0;
        
        return {
          startDate,
          endDate,
          payments: filteredPayments,
          summary: {
            totalPayments,
            totalAmount,
            paidAmount,
            pendingAmount,
            overdueAmount,
            delinquencyRate
          }
        };
      },
      
      generateReminders: async (paymentId, types) => {
        set({ isLoading: true, error: null });
        try {
          // Get the payment
          const payment = get().installmentPayments.find(p => p.id === paymentId);
          if (!payment) throw new Error('Payment not found');
          
          // Get the plan
          const plan = get().installmentPlans.find(p => p.id === payment.installmentPlanId);
          if (!plan) throw new Error('Installment plan not found');
          
          // Generate reminders based on types
          const reminders: Omit<PaymentReminder, 'id' | 'createdAt'>[] = [];
          
          const now = new Date();
          
          if (types.includes('upcoming')) {
            // Create reminder for 3 days before due date
            const reminderDate = new Date(payment.dueDate);
            reminderDate.setDate(reminderDate.getDate() - 3);
            
            if (isAfter(reminderDate, now)) {
              reminders.push({
                installmentPaymentId: paymentId,
                reminderDate,
                sent: false,
                reminderType: 'upcoming',
                message: `Your payment of ${payment.amount} is due in 3 days on ${format(payment.dueDate, 'MMM dd, yyyy')}.`
              });
            }
          }
          
          if (types.includes('due')) {
            // Create reminder for the due date
            if (isAfter(payment.dueDate, now)) {
              reminders.push({
                installmentPaymentId: paymentId,
                reminderDate: payment.dueDate,
                sent: false,
                reminderType: 'due',
                message: `Your payment of ${payment.amount} is due today.`
              });
            }
          }
          
          if (types.includes('overdue')) {
            // Create reminder for 3 days after due date
            const reminderDate = new Date(payment.dueDate);
            reminderDate.setDate(reminderDate.getDate() + 3);
            
            reminders.push({
              installmentPaymentId: paymentId,
              reminderDate,
              sent: false,
              reminderType: 'overdue',
              message: `Your payment of ${payment.amount} is overdue. Please make your payment as soon as possible.`
            });
          }
          
          // Insert reminders into database
          if (reminders.length > 0) {
            const reminderData = reminders.map(r => ({
              installment_payment_id: r.installmentPaymentId,
              reminder_date: format(r.reminderDate, 'yyyy-MM-dd'),
              sent: r.sent,
              reminder_type: r.reminderType,
              message: r.message
            }));
            
            const { error } = await supabase
              .from('payment_reminders')
              .insert(reminderData);
              
            if (error) throw error;
            
            // Refresh reminders
            await get().fetchPaymentReminders(paymentId);
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Error generating reminders:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      },
      
      sendReminders: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get unsent reminders that are due today or earlier
          const today = new Date();
          const unsent = get().paymentReminders.filter(r => 
            !r.sent && (isAfter(today, r.reminderDate) || format(today, 'yyyy-MM-dd') === format(r.reminderDate, 'yyyy-MM-dd'))
          );
          
          if (unsent.length === 0) {
            set({ isLoading: false });
            return;
          }
          
          // In a real implementation, this would send emails or SMS
          // For now, we'll just mark them as sent
          
          // Update reminders in database
          const reminderIds = unsent.map(r => r.id);
          
          const { error } = await supabase
            .from('payment_reminders')
            .update({ sent: true })
            .in('id', reminderIds);
            
          if (error) throw error;
          
          // Update reminders in state
          set(state => ({
            paymentReminders: state.paymentReminders.map(r => 
              reminderIds.includes(r.id) ? { ...r, sent: true } : r
            ),
            isLoading: false
          }));
          
          console.log(`Sent ${unsent.length} payment reminders`);
        } catch (error) {
          console.error('Error sending reminders:', error);
          set({ error: handleSupabaseError(error), isLoading: false });
        }
      }
    }),
    {
      name: 'installment-store',
      partialize: (state) => ({
        installmentPlans: state.installmentPlans,
        installmentPayments: state.installmentPayments,
        paymentReminders: state.paymentReminders
      })
    }
  )
);