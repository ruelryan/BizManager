/*
  # Payment System and Subscription Management

  1. New Tables
    - `webhook_events` - Stores webhook events for audit and idempotency
    - `payment_transactions` - Records all payment-related transactions
    - `notification_queue` - Manages user notifications for payment events

  2. Changes
    - Added subscription-related columns to `user_settings` table
    - Updated `initialize_user_data` function to include new defaults

  3. Security
    - Enabled RLS on all new tables
    - Added appropriate policies for service role and authenticated users
*/

-- Add new columns to user_settings table
ALTER TABLE IF EXISTS user_settings 
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expiry timestamptz,
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'webhook_events' AND policyname = 'Service role can manage webhook events'
  ) THEN
    CREATE POLICY "Service role can manage webhook events"
      ON webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for payment_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_transactions' AND policyname = 'Users can view own payment transactions'
  ) THEN
    CREATE POLICY "Users can view own payment transactions"
      ON payment_transactions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_transactions' AND policyname = 'Service role can manage payment transactions'
  ) THEN
    CREATE POLICY "Service role can manage payment transactions"
      ON payment_transactions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for notification_queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_queue' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON notification_queue
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_queue' AND policyname = 'Service role can manage notifications'
  ) THEN
    CREATE POLICY "Service role can manage notifications"
      ON notification_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_payment_transactions_updated_at'
  ) THEN
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
  END IF;
END $$;