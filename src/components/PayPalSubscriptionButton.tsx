import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useStore } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { trackUpgradeAttempt } from '../utils/googleAnalytics';

interface PayPalSubscriptionButtonProps {
  planId: string;
  planName: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: any) => void;
}

export function PayPalSubscriptionButton({ 
  planId, 
  planName, 
  onSuccess, 
  onError 
}: PayPalSubscriptionButtonProps) {
  const { user } = useStore();
  const { theme } = useTheme();

  if (!user) {
    return null;
  }

  // PayPal configuration for subscriptions
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  if (!paypalClientId || paypalClientId === "test") {
    console.error('PayPal client ID is not configured properly. Please set VITE_PAYPAL_CLIENT_ID environment variable.');
  }

  const initialOptions = {
    clientId: paypalClientId || "test",
    currency: "USD",
    intent: "subscription" as const,
    vault: true, // Required for subscriptions
    'data-sdk-integration-source': 'button-factory',
    'disable-funding': 'paylater,venmo,card', // Simplify payment options to reduce errors
    'enable-funding': 'paypal',
  };

  const createSubscription = (data: any, actions: any) => {
    // Track upgrade attempt when PayPal checkout begins
    const price = planName === 'Starter' ? 199 : 499;
    trackUpgradeAttempt(planName, price);

    return actions.subscription.create({
      plan_id: planId,
      custom_id: user.id, // User ID for webhook processing
      application_context: {
        brand_name: "BizManager",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${window.location.origin}/profile?subscription=success`,
        cancel_url: `${window.location.origin}/upgrade?subscription=cancelled`,
      },
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const subscriptionId = data.subscriptionID;
      console.log('PayPal subscription created:', subscriptionId);
      
      // The webhook will handle the actual subscription activation
      // We just need to notify the UI of success
      onSuccess(subscriptionId);
    } catch (error) {
      console.error('PayPal subscription approval error:', error);
      onError(error);
    }
  };

  const onErrorHandler = (error: any) => {
    console.error('PayPal subscription error:', error);
    onError(error);
  };

  const onCancel = (data: any) => {
    console.log('PayPal subscription cancelled:', data);
    // Handle cancellation if needed
  };

  return (
    <PayPalScriptProvider 
      options={initialOptions}
      deferLoading={false}
    >
      <div className="paypal-subscription-container">
        {/* Add custom CSS for dark mode compatibility */}
        <style>{`
          .paypal-subscription-container {
            background: transparent;
          }
          
          .paypal-subscription-container iframe {
            border-radius: 8px;
          }
          
          /* Dark mode specific overrides */
          ${theme === 'dark' ? `
            .paypal-subscription-container .paypal-button {
              background: #1f2937 !important;
              border: 1px solid #374151 !important;
            }
            
            .paypal-subscription-container .paypal-button-text {
              color: #f3f4f6 !important;
            }
            
            .paypal-checkout-sandbox,
            .paypal-checkout-production {
              background: #1f2937 !important;
              color: #f3f4f6 !important;
            }
            
            .paypal-payment-form {
              background: #1f2937 !important;
              color: #f3f4f6 !important;
            }
            
            .paypal-payment-form input {
              background: #374151 !important;
              color: #f3f4f6 !important;
              border: 1px solid #4b5563 !important;
            }
            
            .paypal-payment-form label {
              color: #d1d5db !important;
            }
          ` : ''}
        `}</style>
        
        <PayPalButtons
          style={{
            shape: "rect",
            color: theme === 'dark' ? "white" : "blue",
            layout: "vertical",
            label: "subscribe",
            tagline: false,
            height: 45,
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancel}
          // Force re-render when theme changes
          forceReRender={[theme]}
        />
        
        {/* Dark mode notice */}
        {theme === 'dark' && (
          <div className="mt-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-300 text-center">
              💡 If the PayPal payment window appears too dark, you can switch to light mode temporarily for better visibility.
            </p>
          </div>
        )}

        {/* Subscription information */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            🔄 Your {planName} subscription will activate immediately and auto-renew monthly. Cancel anytime with no fees.
          </p>
        </div>

        {/* Billing information */}
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            💳 Auto-renewing monthly billing. Manage your subscription from your profile settings.
          </p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}