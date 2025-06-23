import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useStore } from '../store/useStore';
import { plans } from '../utils/plans';

interface PayPalOneTimeButtonProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: any) => void;
}

export function PayPalOneTimeButton({ planId, onSuccess, onError }: PayPalOneTimeButtonProps) {
  const { user } = useStore();
  const plan = plans.find(p => p.id === planId);

  if (!plan || plan.price === 0) {
    return null;
  }

  // Convert PHP to USD (approximate rate - you should use a real exchange rate API)
  const usdPrice = (plan.price / 56).toFixed(2); // Approximate PHP to USD conversion

  // PayPal configuration for one-time payments
  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture" as const,
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
          custom_id: user?.id,
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
      
      // Here you would typically verify the payment with your backend
      // and update the user's subscription status
      
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
        <PayPalButtons
          style={{
            shape: "rect",
            color: "blue",
            layout: "vertical",
            label: "pay",
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={() => {
            console.log('PayPal payment cancelled');
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}