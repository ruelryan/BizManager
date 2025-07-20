import React, { useState } from 'react';
import { AlertTriangle, CreditCard, RefreshCw, ExternalLink, Clock, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

interface PaymentFailureHandlerProps {
  subscription: any;
  failureCount: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function PaymentFailureHandler({ 
  subscription, 
  failureCount, 
  onClose, 
  onSuccess 
}: PaymentFailureHandlerProps) {
  const { user } = useStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getRiskLevel = () => {
    if (failureCount >= 3) return 'critical';
    if (failureCount >= 2) return 'high';
    return 'medium';
  };

  const getRiskMessage = () => {
    if (failureCount >= 3) {
      return 'Your subscription has been suspended due to multiple payment failures. Please update your payment method to reactivate.';
    }
    if (failureCount >= 2) {
      return 'We\'ve attempted to charge your payment method multiple times. Please update your payment method to avoid subscription suspension.';
    }
    return 'Your last payment failed. We\'ll automatically retry, but you can also update your payment method now.';
  };

  const getNextRetryInfo = () => {
    const baseRetryDelay = [1, 3, 5]; // Days
    if (failureCount <= baseRetryDelay.length) {
      const nextRetryDays = baseRetryDelay[failureCount - 1];
      return `Next automatic retry in ${nextRetryDays} day${nextRetryDays !== 1 ? 's' : ''}`;
    }
    return 'No more automatic retries scheduled';
  };

  const handleRetryPayment = async () => {
    if (!subscription?.paypal_subscription_id || !user) return;

    setIsRetrying(true);
    setError(null);

    try {
      // Call Supabase edge function to trigger PayPal retry
      const { data, error } = await supabase.functions.invoke('retry-subscription-payment', {
        body: {
          subscription_id: subscription.paypal_subscription_id,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      setSuccess('Payment retry initiated successfully. You\'ll receive an email if the payment succeeds.');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Error retrying payment:', err);
      setError(err.message || 'Failed to retry payment. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!subscription?.paypal_subscription_id) return;

    setIsUpdatingPayment(true);
    setError(null);

    try {
      // Generate PayPal update payment URL
      const updateUrl = `https://www.paypal.com/myaccount/autopay/`;
      
      // Open PayPal in new window/tab
      window.open(updateUrl, '_blank', 'noopener,noreferrer');
      
      setSuccess('PayPal opened in a new tab. After updating your payment method there, return here and click "Refresh Status".');
      
    } catch (err: any) {
      console.error('Error opening PayPal:', err);
      setError('Failed to open PayPal. Please visit paypal.com to update your payment method.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!subscription?.paypal_subscription_id || !user) return;

    try {
      // Call subscription sync function
      const { data, error } = await supabase.functions.invoke('sync-paypal-subscription', {
        body: {
          subscription_id: subscription.paypal_subscription_id,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      setSuccess('Subscription status refreshed successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Error refreshing status:', err);
      setError(err.message || 'Failed to refresh status. Please try again.');
    }
  };

  const riskLevel = getRiskLevel();

  return (
    <div className={`rounded-lg border-2 p-6 ${
      riskLevel === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
      riskLevel === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
      'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className={`h-6 w-6 ${
            riskLevel === 'critical' ? 'text-red-600' :
            riskLevel === 'high' ? 'text-orange-600' :
            'text-yellow-600'
          }`} />
          <div>
            <h3 className={`font-semibold ${
              riskLevel === 'critical' ? 'text-red-900 dark:text-red-200' :
              riskLevel === 'high' ? 'text-orange-900 dark:text-orange-200' :
              'text-yellow-900 dark:text-yellow-200'
            }`}>
              Payment Failed ({failureCount} attempt{failureCount !== 1 ? 's' : ''})
            </h3>
            <p className={`text-sm ${
              riskLevel === 'critical' ? 'text-red-700 dark:text-red-300' :
              riskLevel === 'high' ? 'text-orange-700 dark:text-orange-300' :
              'text-yellow-700 dark:text-yellow-300'
            }`}>
              {getRiskMessage()}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Retry Information */}
      {failureCount < 3 && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {getNextRetryInfo()}
            </span>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleUpdatePaymentMethod}
            disabled={isUpdatingPayment}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              riskLevel === 'critical' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Update Payment Method</span>
            <ExternalLink className="h-3 w-3" />
          </button>

          {failureCount < 3 && (
            <button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Retry Payment Now</span>
            </button>
          )}
        </div>

        <button
          onClick={handleRefreshStatus}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Subscription Status</span>
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Need help?</strong> Contact support if you continue experiencing payment issues. 
          Your subscription will remain active during the grace period while we resolve any payment problems.
        </p>
      </div>
    </div>
  );
}