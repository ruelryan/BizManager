import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

interface SubscriptionData {
  user_id: string;
  paypal_subscription_id: string;
  paypal_plan_id: string;
  status: string;
  plan_type: string;
  start_time: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_time: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  failed_payment_count: number;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  cycle_count: number | null;
  billing_cycles: any;
}

interface PaymentTransaction {
  id: string;
  paypal_transaction_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string;
  payment_method: string;
  created_at: string;
  metadata: any;
}

export function useSubscriptionStatus() {
  const { user, userSettings } = useStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Calculate subscription status
  const subscriptionStatus = subscription ? {
    isActive: subscription.status === 'ACTIVE',
    isCancelled: subscription.cancel_at_period_end || subscription.cancelled_at !== null,
    isExpired: new Date() > new Date(subscription.current_period_end),
    hasFailedPayments: (subscription.failed_payment_count || 0) > 0,
    daysUntilRenewal: Math.ceil((new Date(subscription.next_billing_time).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    daysUntilExpiry: Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    shouldShowRenewalNotice: subscription.status === 'ACTIVE' && !subscription.cancel_at_period_end,
    shouldShowCancellationNotice: subscription.cancel_at_period_end && new Date() < new Date(subscription.current_period_end),
    shouldShowExpiredNotice: new Date() > new Date(subscription.current_period_end) && subscription.status !== 'CANCELLED',
    riskLevel: (subscription.failed_payment_count || 0) >= 2 ? 'high' : (subscription.failed_payment_count || 0) >= 1 ? 'medium' : 'low'
  } : null;

  const fetchSubscriptionData = useCallback(async () => {
    if (!user || user.id === 'demo-user-id') return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch subscription details
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      setSubscription(subscriptionData);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('transaction_type', ['subscription_activation', 'subscription_renewal', 'payment'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setRecentTransactions(transactionsData || []);
      }

      setLastFetched(new Date());
    } catch (err: any) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to fetch subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-refresh subscription data periodically
  useEffect(() => {
    if (!user || user.id === 'demo-user-id') return;

    fetchSubscriptionData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchSubscriptionData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, fetchSubscriptionData]);

  // Manual refresh function
  const refreshSubscriptionStatus = useCallback(() => {
    return fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Check for PayPal subscription updates
  const syncWithPayPal = useCallback(async () => {
    if (!subscription?.paypal_subscription_id || !user || user.id === 'demo-user-id') return;

    try {
      setIsLoading(true);
      
      // Call Supabase edge function to sync with PayPal
      const { data, error } = await supabase.functions.invoke('sync-paypal-subscription', {
        body: {
          subscription_id: subscription.paypal_subscription_id,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Refresh local data after sync
      await fetchSubscriptionData();
      
      return data;
    } catch (err: any) {
      console.error('Error syncing with PayPal:', err);
      setError(err.message || 'Failed to sync with PayPal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, user, fetchSubscriptionData]);

  return {
    subscription,
    subscriptionStatus,
    recentTransactions,
    isLoading,
    error,
    lastFetched,
    refreshSubscriptionStatus,
    syncWithPayPal
  };
}