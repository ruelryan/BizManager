/*
  # Update user_settings table for PayPal webhook handling

  1. Schema Updates
    - Add `plan` column to track subscription plan
    - Add `subscription_expiry` column to track when subscription expires
    - Add `paypal_subscription_id` column to link PayPal subscriptions
    - Add `payment_status` column to track payment status
    - Add `last_payment_date` column to track last successful payment

  2. Create webhook_events table
    - Store all incoming webhook events for audit trail
    - Prevent duplicate processing with idempotency
    - Track processing status and errors

  3. Create payment_transactions table
    - Track all payment transactions
    - Store PayPal transaction details
    - Handle refunds and disputes
*/

-- Add new columns to user_settings table
DO $$
BEGIN
  -- Add plan column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'plan'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN plan text DEFAULT 'free';
  END IF;

  -- Add subscription_expiry column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'subscription_expiry'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN subscription_expiry timestamptz;
  END IF;

  -- Add paypal_subscription_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'paypal_subscription_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN paypal_subscription_id text;
  END IF;

  -- Add payment_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN payment_status text DEFAULT 'active';
  END IF;

  -- Add last_payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_payment_date timestamptz;
  END IF;
END $$;

-- Create webhook_events table for audit trail and idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  resource_type text,
  resource_id text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_transaction_id text UNIQUE NOT NULL,
  paypal_subscription_id text,
  transaction_type text NOT NULL, -- 'payment', 'refund', 'dispute', 'chargeback'
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text NOT NULL, -- 'completed', 'pending', 'failed', 'refunded', 'disputed'
  plan_id text,
  payment_method text,
  paypal_fee numeric(10,2),
  net_amount numeric(10,2),
  failure_reason text,
  dispute_reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_queue table for user notifications
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'payment_success', 'payment_failed', 'refund', 'dispute'
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable RLS on new tables
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_events (admin access only)
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for payment_transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment transactions"
  ON payment_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for notification_queue
CREATE POLICY "Users can view own notifications"
  ON notification_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications"
  ON notification_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paypal_id ON payment_transactions(paypal_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent);

-- Update the initialize_user_data function to include all new columns with proper defaults
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user settings record with all default values, or do nothing if it already exists
  -- This prevents duplicate key errors during OAuth flows and ensures all columns have proper defaults
  INSERT INTO user_settings (
    user_id, 
    monthly_goal, 
    currency, 
    plan, 
    payment_status
  )
  VALUES (
    NEW.id, 
    50000, 
    'PHP', 
    'free', 
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for payment_transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();