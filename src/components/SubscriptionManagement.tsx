import React, { useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Pause, 
  Play, 
  X, 
  ExternalLink,
  Crown,
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { plans } from '../utils/plans';

interface SubscriptionManagementProps {
  onClose?: () => void;
}

export function SubscriptionManagement({ onClose }: SubscriptionManagementProps) {
  const { user, cancelSubscription } = useStore();
  const { 
    subscription, 
    subscriptionStatus, 
    recentTransactions,
    isLoading, 
    refreshSubscriptionStatus,
    syncWithPayPal 
  } = useSubscriptionStatus();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'plan' | 'history'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!subscription) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <div className="text-center py-8">
          <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Subscription</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You're currently on the free plan. Upgrade to unlock premium features.
          </p>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await cancelSubscription();
      setMessage({ type: 'success', text: 'Subscription cancelled. You will have access until the end of your current billing period.' });
      await refreshSubscriptionStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to cancel subscription' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription.paypal_subscription_id) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: {
          subscription_id: subscription.paypal_subscription_id,
          user_id: user?.id
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Subscription reactivated successfully!' });
      await refreshSubscriptionStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reactivate subscription' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    const updateUrl = 'https://www.paypal.com/myaccount/autopay/';
    window.open(updateUrl, '_blank', 'noopener,noreferrer');
    setMessage({ type: 'success', text: 'PayPal opened in a new tab. After updating your payment method, return here and click "Sync Status".' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: CheckCircle },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'plan', label: 'Plan & Features', icon: Crown },
    { id: 'history', label: 'History', icon: Calendar }
  ];

  const currentPlan = plans.find(p => p.id === subscription.plan_type);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription Management
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Status Banner */}
        {subscriptionStatus && (
          <div className={`mt-3 px-3 py-2 rounded-lg flex items-center space-x-2 ${
            subscriptionStatus.isActive && !subscriptionStatus.hasFailedPayments
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : subscriptionStatus.hasFailedPayments
              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
              : subscriptionStatus.isCancelled
              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}>
            {subscriptionStatus.isActive && !subscriptionStatus.hasFailedPayments && <CheckCircle className="h-4 w-4" />}
            {subscriptionStatus.hasFailedPayments && <AlertCircle className="h-4 w-4" />}
            {subscriptionStatus.isCancelled && <Pause className="h-4 w-4" />}
            
            <span className="text-sm font-medium">
              {subscriptionStatus.isActive && !subscriptionStatus.hasFailedPayments && 'Active Subscription'}
              {subscriptionStatus.hasFailedPayments && 'Payment Issues'}
              {subscriptionStatus.isCancelled && 'Cancelled - Active Until Period End'}
              {subscriptionStatus.isExpired && 'Subscription Expired'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-6 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {currentPlan?.name || 'Unknown'} Plan
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${subscription.last_payment_amount || currentPlan?.price || 0}/month
                </p>
              </div>

              {/* Next Billing */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Next Billing</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {subscription.next_billing_time ? 
                    new Date(subscription.next_billing_time).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subscriptionStatus?.daysUntilRenewal 
                    ? `${subscriptionStatus.daysUntilRenewal} days away`
                    : subscription.cancel_at_period_end 
                    ? 'Subscription will end'
                    : 'Auto-renewal enabled'
                  }
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={handleUpdatePaymentMethod}
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Update Payment</span>
                  <ExternalLink className="h-3 w-3" />
                </button>

                <button
                  onClick={() => syncWithPayPal()}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Sync Status</span>
                </button>

                <button
                  onClick={() => window.location.href = '/upgrade'}
                  className="flex items-center space-x-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Change Plan</span>
                </button>
              </div>
            </div>

            {/* Subscription Actions */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Subscription Control</h3>
              
              {subscription.cancel_at_period_end ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Reactivate Subscription</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  <span>Cancel Subscription</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Payment Method</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PP</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Subscription ID: {subscription.paypal_subscription_id?.slice(-8)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpdatePaymentMethod}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Update payment method →
                </button>
              </div>

              {/* Billing Summary */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Billing Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentPlan?.name} Plan
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Cost:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${subscription.last_payment_amount || currentPlan?.price || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Billing:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subscription.next_billing_time ? 
                        new Date(subscription.next_billing_time).toLocaleDateString() : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`font-medium ${
                      subscription.status === 'ACTIVE' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Current Plan Features</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentPlan?.name} Plan
                  </h4>
                </div>
                
                <ul className="space-y-2">
                  {currentPlan?.id === 'starter' && (
                    <>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Unlimited products & sales</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Advanced dashboard</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Basic reports & analytics</span>
                      </li>
                    </>
                  )}
                  {currentPlan?.id === 'pro' && (
                    <>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Everything in Starter</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">PDF invoice generation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Advanced reports & goal tracking</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Cash flow analysis</span>
                      </li>
                    </>
                  )}
                </ul>

                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Upgrade or change plan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
              
              {recentTransactions.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {transaction.transaction_type.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${transaction.amount}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No transaction history available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}