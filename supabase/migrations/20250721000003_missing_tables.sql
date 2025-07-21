-- Migration: Add missing tables referenced in the application
-- Created: 2025-07-21
-- Purpose: Fix 404 errors by adding missing tables (profiles, installment_plans, etc.)

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INSTALLMENT PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  number_of_installments INTEGER NOT NULL,
  installment_amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
  interest_rate DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for installment_plans
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their installment plans" ON installment_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to installment plans" ON installment_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INSTALLMENT PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  installment_plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE NOT NULL,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for installment_payments
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their installment payments" ON installment_payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to installment payments" ON installment_payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- PAYMENT REMINDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  installment_payment_id UUID REFERENCES installment_payments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'call', 'notification')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for payment_reminders
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their payment reminders" ON payment_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to payment reminders" ON payment_reminders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INVENTORY TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_id UUID, -- Can reference sales, purchases, etc.
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for inventory_transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their inventory transactions" ON inventory_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to inventory transactions" ON inventory_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- RETURNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_method TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for returns
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their returns" ON returns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to returns" ON returns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- RETURN ITEMS TABLE (for detailed return items)
-- =============================================
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'damaged', 'defective'))
);

-- RLS for return_items
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage return items through returns" ON return_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM returns 
      WHERE returns.id = return_items.return_id 
      AND returns.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to return items" ON return_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

-- Installment plans indexes
CREATE INDEX IF NOT EXISTS installment_plans_user_id_idx ON installment_plans(user_id);
CREATE INDEX IF NOT EXISTS installment_plans_customer_id_idx ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS installment_plans_status_idx ON installment_plans(status);

-- Installment payments indexes
CREATE INDEX IF NOT EXISTS installment_payments_user_id_idx ON installment_payments(user_id);
CREATE INDEX IF NOT EXISTS installment_payments_plan_id_idx ON installment_payments(installment_plan_id);
CREATE INDEX IF NOT EXISTS installment_payments_due_date_idx ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS installment_payments_status_idx ON installment_payments(status);

-- Payment reminders indexes
CREATE INDEX IF NOT EXISTS payment_reminders_user_id_idx ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS payment_reminders_reminder_date_idx ON payment_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS payment_reminders_status_idx ON payment_reminders(status);

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS inventory_transactions_user_id_idx ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_product_id_idx ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_created_at_idx ON inventory_transactions(created_at);

-- Returns indexes
CREATE INDEX IF NOT EXISTS returns_user_id_idx ON returns(user_id);
CREATE INDEX IF NOT EXISTS returns_customer_id_idx ON returns(customer_id);
CREATE INDEX IF NOT EXISTS returns_return_date_idx ON returns(return_date);
CREATE INDEX IF NOT EXISTS returns_status_idx ON returns(status);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update_updated_at trigger to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_plans_updated_at BEFORE UPDATE ON installment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON installment_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles with additional information beyond auth.users';
COMMENT ON TABLE installment_plans IS 'Customer installment payment plans for products';
COMMENT ON TABLE installment_payments IS 'Individual installment payments within a plan';
COMMENT ON TABLE payment_reminders IS 'Automated reminders for upcoming payments';
COMMENT ON TABLE inventory_transactions IS 'Detailed inventory movement tracking';
COMMENT ON TABLE returns IS 'Product return requests and processing';
COMMENT ON TABLE return_items IS 'Individual items being returned in a return request';