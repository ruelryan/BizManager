import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useStore } from '../store/useStore';
import { plans } from '../utils/plans';

interface PayPalButtonProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: any) => void;
}

export function PayPalButton({ planId, onSuccess, onError }: PayPalButtonProps) {
  const { user } = useStore();
  const plan = plans.find(p => p.id === planId);

  if (!plan || plan.price === 0) {
    return null;
  }

  // PayPal configuration
  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test", // You'll need to set this in your .env file
    currency: "USD", // PayPal typically uses USD for international transactions
    intent: "subscription" as const,
    vault: true,
  };

  const createSubscription = (data: any, actions: any) => {
    return actions.subscription.create({
      plan_id: import.meta.env.VITE_PAYPAL_PLAN_ID || "test", // You'll need to create subscription plans in PayPal
      custom_id: user?.id,
      application_context: {
        brand_name: "BizManager",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${window.location.origin}/upgrade?success=true`,
        cancel_url: `${window.location.origin}/upgrade?cancelled=true`,
      },
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      // Here you would typically verify the subscription with your backend
      console.log('PayPal subscription approved:', data);
      
      // For now, we'll simulate a successful subscription
      onSuccess();
    } catch (error) {
      console.error('PayPal subscription error:', error);
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
            label: "subscribe",
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={() => {
            console.log('PayPal subscription cancelled');
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}