/*
  # Installment Payments Schema

  1. New Tables
    - `installment_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `customer_id` (uuid, foreign key to customers)
      - `total_amount` (numeric)
      - `down_payment` (numeric)
      - `remaining_balance` (numeric)
      - `term_months` (integer)
      - `interest_rate` (numeric)
      - `status` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `notes` (text)
      - `sale_id` (uuid, foreign key to sales)
    
    - `installment_payments`
      - `id` (uuid, primary key)
      - `installment_plan_id` (uuid, foreign key to installment_plans)
      - `amount` (numeric)
      - `due_date` (date)
      - `payment_date` (timestamptz)
      - `status` (text)
      - `payment_method` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to users)
    
    - `payment_reminders`
      - `id` (uuid, primary key)
      - `installment_payment_id` (uuid, foreign key to installment_payments)
      - `reminder_date` (timestamptz)
      - `sent` (boolean)
      - `reminder_type` (text)
      - `message` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Triggers
    - Add trigger to update customer balance when installment plan is created
    - Add trigger to update installment plan remaining balance when payment is made
    - Add trigger to update updated_at column on record changes
*/

-- Create installment_plans table
CREATE TABLE IF NOT EXISTS installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  down_payment numeric(10,2) DEFAULT 0,
  remaining_balance numeric(10,2) NOT NULL,
  term_months integer NOT NULL,
  interest_rate numeric(5,2) DEFAULT 0,
  status text NOT NULL CHECK (status IN ('active', 'completed', 'cancelled', 'defaulted')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL
);

-- Create installment_payments table
CREATE TABLE IF NOT EXISTS installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_plan_id uuid REFERENCES installment_plans(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  payment_date timestamptz,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_payment_id uuid REFERENCES installment_payments(id) ON DELETE CASCADE NOT NULL,
  reminder_date timestamptz NOT NULL,
  sent boolean DEFAULT false,
  reminder_type text NOT NULL CHECK (reminder_type IN ('upcoming', 'due', 'overdue')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installment_plans_user_id ON installment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_customer_id ON installment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_start_date ON installment_plans(start_date);

CREATE INDEX IF NOT EXISTS idx_installment_payments_plan_id ON installment_payments(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_status ON installment_payments(status);
CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_installment_payments_user_id ON installment_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_payment_id ON payment_reminders(installment_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent ON payment_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_date ON payment_reminders(reminder_date);

-- Add triggers for updated_at columns
CREATE TRIGGER update_installment_plans_updated_at
BEFORE UPDATE ON installment_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for installment_plans
CREATE POLICY "Users can view own installment plans"
  ON installment_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment plans"
  ON installment_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment plans"
  ON installment_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment plans"
  ON installment_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for installment_payments
CREATE POLICY "Users can view own installment payments"
  ON installment_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment payments"
  ON installment_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment payments"
  ON installment_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment payments"
  ON installment_payments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for payment_reminders
CREATE POLICY "Users can view own payment reminders"
  ON payment_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment reminders"
  ON payment_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment reminders"
  ON payment_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment reminders"
  ON payment_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update customer balance when installment plan is created
CREATE OR REPLACE FUNCTION update_customer_balance_on_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer balance by adding the remaining balance of the installment plan
  UPDATE customers
  SET balance = balance + NEW.remaining_balance
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer balance
CREATE TRIGGER update_customer_balance_on_installment_insert
AFTER INSERT ON installment_plans
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance_on_installment();

-- Create function to update installment plan remaining balance when payment is made
CREATE OR REPLACE FUNCTION update_installment_plan_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if payment status is 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Update installment plan remaining balance
    UPDATE installment_plans
    SET 
      remaining_balance = remaining_balance - NEW.amount,
      status = CASE 
                WHEN (remaining_balance - NEW.amount) <= 0 THEN 'completed'
                ELSE status
              END,
      updated_at = now()
    WHERE id = NEW.installment_plan_id;
    
    -- Update customer balance
    UPDATE customers c
    SET balance = balance - NEW.amount
    FROM installment_plans ip
    WHERE ip.id = NEW.installment_plan_id AND c.id = ip.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update installment plan balance
CREATE TRIGGER update_installment_plan_balance_on_payment
AFTER INSERT OR UPDATE ON installment_payments
FOR EACH ROW
EXECUTE FUNCTION update_installment_plan_balance();

-- Create function to automatically mark payments as overdue
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status to 'overdue' for payments that are past due date and still 'pending'
  UPDATE installment_payments
  SET status = 'overdue'
  WHERE status = 'pending' AND due_date < CURRENT_DATE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run daily to check for overdue payments
CREATE TRIGGER check_overdue_payments
AFTER INSERT OR UPDATE ON installment_payments
FOR EACH STATEMENT
EXECUTE FUNCTION update_overdue_payments();

-- Add sale_id column to sales table for installment tracking if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'installment_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN installment_id uuid REFERENCES installment_plans(id) ON DELETE SET NULL;
  END IF;
END $$;