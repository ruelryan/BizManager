import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useStore } from '../store/useStore';
import { plans } from '../utils/plans';
import { useTheme } from '../contexts/ThemeContext';
import { fetchExchangeRates, currencies } from '../utils/currency';

interface PayPalOneTimeButtonProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: any) => void;
}

export function PayPalOneTimeButton({ planId, onSuccess, onError }: PayPalOneTimeButtonProps) {
  const { user } = useStore();
  const { theme } = useTheme();
  const plan = plans.find(p => p.id === planId);
  const [usdPrice, setUsdPrice] = React.useState<string>('');

  React.useEffect(() => {
    async function updateRate() {
      await fetchExchangeRates();
      const rate = currencies['USD'].rate;
      setUsdPrice(((plan?.price || 0) * rate).toFixed(2));
    }
    updateRate();
  }, [plan]);

  if (!plan || plan.price === 0) {
    return null;
  }

  // PayPal configuration for one-time payments with dark mode support
  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture" as const,
    // Add data attributes for better dark mode support
    'data-sdk-integration-source': 'button-factory',
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: usdPrice,
          },
          description: `${plan.name} Plan - BizManager Subscription`,
          custom_id: user?.id, // This is crucial for webhook processing
        },
      ],
      application_context: {
        brand_name: "BizManager",
        locale: "en-US",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      console.log('PayPal payment completed:', details);
      
      // The webhook will handle the actual subscription update
      // We just need to notify the UI of success
      onSuccess();
    } catch (error) {
      console.error('PayPal payment error:', error);
      onError(error);
    }
  };

  const onErrorHandler = (error: any) => {
    console.error('PayPal error:', error);
    onError(error);
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="paypal-button-container">
        {/* Add custom CSS for dark mode compatibility */}
        <style>{`
          .paypal-button-container {
            /* Ensure PayPal buttons work well in dark mode */
            background: transparent;
          }
          
          /* Override PayPal's default styles for dark mode */
          .paypal-button-container iframe {
            border-radius: 8px;
          }
          
          /* Dark mode specific overrides */
          ${theme === 'dark' ? `
            .paypal-button-container .paypal-button {
              background: #1f2937 !important;
              border: 1px solid #374151 !important;
            }
            
            .paypal-button-container .paypal-button-text {
              color: #f3f4f6 !important;
            }
            
            /* Override PayPal's modal and popup styles for dark mode */
            .paypal-checkout-sandbox,
            .paypal-checkout-production {
              background: #1f2937 !important;
              color: #f3f4f6 !important;
            }
            
            /* Style PayPal's payment form in dark mode */
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
            label: "pay",
            tagline: false,
            height: 45,
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={() => {
            console.log('PayPal payment cancelled');
          }}
          // Add custom styling for dark mode
          forceReRender={[theme]}
        />
        
        {/* Additional dark mode notice */}
        {theme === 'dark' && (
          <div className="mt-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-300 text-center">
              💡 If the PayPal payment window appears too dark, you can switch to light mode temporarily for better visibility.
            </p>
          </div>
        )}

        {/* Webhook Processing Notice */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            🔄 Your subscription will be activated automatically after payment confirmation via our secure webhook system.
          </p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}