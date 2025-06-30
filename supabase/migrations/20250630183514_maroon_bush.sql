/*
  # User Data Isolation and Settings

  1. New Tables
    - `user_settings` - Stores user-specific settings and business information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `monthly_goal` (numeric)
      - `business_name` (text)
      - `business_address` (text)
      - `business_phone` (text)
      - `business_email` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes
    - Add `user_id` column to products, customers, and sales tables if not exists
    - Create user-specific RLS policies for data isolation
    - Add indexes for better performance
  
  3. Security
    - Enable RLS on user_settings table
    - Create policies for user data access
    - Create trigger to initialize user data on signup
*/

-- Add user_id column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to customers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create user_settings table for user-specific settings
CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_goal numeric(10,2) DEFAULT 50000,
    business_name text,
    business_address text,
    business_phone text,
    business_email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new user-specific policies
DO $$
BEGIN
  -- Products policies
  DROP POLICY IF EXISTS "Allow all operations on products" ON products;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can view own products'
  ) THEN
    CREATE POLICY "Users can view own products" ON products
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can insert own products'
  ) THEN
    CREATE POLICY "Users can insert own products" ON products
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can update own products'
  ) THEN
    CREATE POLICY "Users can update own products" ON products
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can delete own products'
  ) THEN
    CREATE POLICY "Users can delete own products" ON products
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Customers policies
  DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view own customers'
  ) THEN
    CREATE POLICY "Users can view own customers" ON customers
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert own customers'
  ) THEN
    CREATE POLICY "Users can insert own customers" ON customers
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update own customers'
  ) THEN
    CREATE POLICY "Users can update own customers" ON customers
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can delete own customers'
  ) THEN
    CREATE POLICY "Users can delete own customers" ON customers
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Sales policies
  DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can view own sales'
  ) THEN
    CREATE POLICY "Users can view own sales" ON sales
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can insert own sales'
  ) THEN
    CREATE POLICY "Users can insert own sales" ON sales
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can update own sales'
  ) THEN
    CREATE POLICY "Users can update own sales" ON sales
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can delete own sales'
  ) THEN
    CREATE POLICY "Users can delete own sales" ON sales
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- User settings policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings'
  ) THEN
    CREATE POLICY "Users can view own settings" ON user_settings
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings" ON user_settings
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings" ON user_settings
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for user_id columns for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create trigger for updating timestamps on user_settings
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
  CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Function to initialize user data when a new user signs up (FIXED VERSION)
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user settings record, or do nothing if it already exists
  -- This prevents duplicate key errors during OAuth flows
  INSERT INTO user_settings (user_id, monthly_goal, currency, plan, payment_status)
  VALUES (NEW.id, 50000, 'PHP', 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize user data on signup (recreate to ensure it uses the fixed function)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_data();
END $$;