export interface SubscriptionData {
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
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id: string;
  paypal_transaction_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string;
  payment_method: string;
  created_at: string;
  metadata?: any;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  hasFailedPayments: boolean;
  daysUntilRenewal: number;
  daysUntilExpiry: number;
  shouldShowRenewalNotice: boolean;
  shouldShowCancellationNotice: boolean;
  shouldShowExpiredNotice: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: {
    id: string;
    status?: string;
    custom_id?: string;
    plan_id?: string;
    billing_info?: {
      next_billing_time?: string;
      last_payment?: {
        amount?: {
          value?: string;
          currency_code?: string;
        };
        time?: string;
        transaction_id?: string;
      };
      failed_payments_count?: number;
      cycle_executions?: any[];
    };
    start_time?: string;
    cancel_at_period_end?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PayPalCreateOrderData {
  orderID?: string;
  subscriptionID?: string;
  [key: string]: any;
}

export interface PayPalActions {
  order?: {
    create: (data: any) => Promise<string>;
    capture: () => Promise<any>;
  };
  subscription?: {
    create: (data: any) => Promise<string>;
  };
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}