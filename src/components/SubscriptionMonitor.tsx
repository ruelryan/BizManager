import React from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard, RefreshCw, Calendar } from 'lucide-react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { useStore } from '../store/useStore';
import { PaymentFailureHandler } from './PaymentFailureHandler';
import { GracePeriodNotice } from './GracePeriodNotice';

interface SubscriptionMonitorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function SubscriptionMonitor({ 
  showDetails = false, 
  compact = false, 
  className = '' 
}: SubscriptionMonitorProps) {
  const { user } = useStore();
  const { 
    subscription, 
    subscriptionStatus, 
    recentTransactions,
    isLoading, 
    error, 
    lastFetched,
    refreshSubscriptionStatus,
    syncWithPayPal 
  } = useSubscriptionStatus();

  // Don't show for demo user
  if (!user || user.id === 'demo-user-id') {
    return null;
  }

  // Don't show if no subscription
  if (!subscription) {
    return null;
  }

  const handleRefresh = async () => {
    await refreshSubscriptionStatus();
  };

  const handleSync = async () => {
    try {
      await syncWithPayPal();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const getStatusColor = () => {
    if (!subscriptionStatus) return 'gray';
    if (subscriptionStatus.isExpired) return 'red';
    if (subscriptionStatus.hasFailedPayments && subscriptionStatus.riskLevel === 'high') return 'red';
    if (subscriptionStatus.hasFailedPayments) return 'yellow';
    if (subscriptionStatus.isCancelled) return 'orange';
    if (subscriptionStatus.isActive) return 'green';
    return 'gray';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'green') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (color === 'red') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (color === 'yellow') return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    if (color === 'orange') return <Clock className="h-5 w-5 text-orange-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-500" />;
  };

  const getStatusMessage = () => {
    if (!subscriptionStatus) return 'Loading subscription status...';
    
    if (subscriptionStatus.isExpired) {
      return 'Subscription expired - Please renew your subscription';
    }
    
    if (subscriptionStatus.hasFailedPayments) {
      if (subscriptionStatus.riskLevel === 'high') {
        return 'Multiple payment failures - Subscription at risk of cancellation';
      }
      return `Payment failed (${subscription.failed_payment_count} attempts) - Please update payment method`;
    }
    
    if (subscriptionStatus.isCancelled) {
      return `Subscription cancelled - Access until ${new Date(subscription.current_period_end).toLocaleDateString()}`;
    }
    
    if (subscriptionStatus.shouldShowRenewalNotice) {
      const days = subscriptionStatus.daysUntilRenewal;
      if (days <= 7) {
        return `Auto-renewal in ${days} day${days !== 1 ? 's' : ''}`;
      }
      return `Next billing: ${new Date(subscription.next_billing_time).toLocaleDateString()}`;
    }
    
    return 'Subscription active';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusMessage()}
        </span>
        {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${className}`} style={{
      borderColor: getStatusColor() === 'green' ? '#10b981' :
                   getStatusColor() === 'red' ? '#ef4444' :
                   getStatusColor() === 'yellow' ? '#f59e0b' :
                   getStatusColor() === 'orange' ? '#f97316' : '#6b7280',
      backgroundColor: getStatusColor() === 'green' ? '#ecfdf5' :
                      getStatusColor() === 'red' ? '#fef2f2' :
                      getStatusColor() === 'yellow' ? '#fffbeb' :
                      getStatusColor() === 'orange' ? '#fff7ed' : '#f9fafb'
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h4 className="font-medium text-gray-900 dark:text-white">
            Subscription Status
          </h4>
        </div>
        
        <div className="flex items-center space-x-2">
          {error && (
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Retry"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            title="Sync with PayPal"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {getStatusMessage()}
      </p>

      {/* Grace Period Notice - Show if there are failed payments but still in grace period */}
      {subscription && subscriptionStatus?.hasFailedPayments && (subscription.failed_payment_count || 0) < 3 && (
        <div className="mt-4">
          <GracePeriodNotice
            subscription={subscription}
            failureCount={subscription.failed_payment_count || 0}
          />
        </div>
      )}

      {/* Payment Failure Handler - Show if there are failed payments */}
      {subscription && subscriptionStatus?.hasFailedPayments && (
        <div className="mt-4">
          <PaymentFailureHandler
            subscription={subscription}
            failureCount={subscription.failed_payment_count || 0}
            onSuccess={() => {
              refreshSubscriptionStatus();
            }}
          />
        </div>
      )}

      {showDetails && subscription && subscriptionStatus && (
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-3 w-3" />
            <span>Plan: {subscription.plan_type}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>
              Current period: {new Date(subscription.current_period_start).toLocaleDateString()} - 
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>
          
          {subscription.last_payment_date && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>
                Last payment: ${subscription.last_payment_amount} on {new Date(subscription.last_payment_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {recentTransactions.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium mb-2">Recent Transactions</h5>
              <div className="space-y-1">
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <span className="capitalize">
                      {transaction.transaction_type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span>${transaction.amount}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {lastFetched && (
        <div className="mt-3 text-xs text-gray-500">
          Last updated: {lastFetched.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}