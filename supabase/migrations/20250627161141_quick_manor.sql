/*
  # Fix User Authentication and OAuth Integration

  1. Changes
    - Fix the initialize_user_data function to properly handle OAuth sign-ups
    - Ensure user_id column exists in all tables
    - Update RLS policies to properly isolate user data
    - Add missing foreign key constraints

  2. Security
    - Ensure proper data isolation between users
    - Fix RLS policies for authenticated users
*/

-- Create or replace the initialize_user_data function to properly handle OAuth
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user settings record with all default values
  INSERT INTO user_settings (
    user_id, 
    monthly_goal, 
    currency, 
    plan, 
    payment_status,
    business_name,
    business_email
  )
  VALUES (
    NEW.id, 
    50000, 
    'PHP', 
    'free', 
    'active',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists for user initialization
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_data();

-- Ensure user_id columns exist in all tables
DO $$
BEGIN
  -- Add user_id to products if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
  END IF;

  -- Add user_id to customers if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
  END IF;

  -- Add user_id to sales if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
  END IF;

  -- Add user_id to expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
  END IF;
END $$;

-- Update RLS policies to properly isolate user data
DO $$
BEGIN
  -- Products policies
  DROP POLICY IF EXISTS "Users can view own products" ON products;
  DROP POLICY IF EXISTS "Users can insert own products" ON products;
  DROP POLICY IF EXISTS "Users can update own products" ON products;
  DROP POLICY IF EXISTS "Users can delete own products" ON products;
  
  CREATE POLICY "Users can view own products" ON products
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own products" ON products
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own products" ON products
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own products" ON products
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

  -- Customers policies
  DROP POLICY IF EXISTS "Users can view own customers" ON customers;
  DROP POLICY IF EXISTS "Users can insert own customers" ON customers;
  DROP POLICY IF EXISTS "Users can update own customers" ON customers;
  DROP POLICY IF EXISTS "Users can delete own customers" ON customers;
  
  CREATE POLICY "Users can view own customers" ON customers
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own customers" ON customers
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own customers" ON customers
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own customers" ON customers
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

  -- Sales policies
  DROP POLICY IF EXISTS "Users can view own sales" ON sales;
  DROP POLICY IF EXISTS "Users can insert own sales" ON sales;
  DROP POLICY IF EXISTS "Users can update own sales" ON sales;
  DROP POLICY IF EXISTS "Users can delete own sales" ON sales;
  
  CREATE POLICY "Users can view own sales" ON sales
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own sales" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own sales" ON sales
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own sales" ON sales
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

  -- Expenses policies
  DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
  
  CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
END $$;