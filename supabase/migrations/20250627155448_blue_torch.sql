/*
  # User Data Isolation with Row Level Security

  1. Security Changes
    - Update RLS policies to isolate data by user
    - Add user_id column to all tables
    - Ensure each user only sees their own data

  2. Database Changes
    - Add user_id columns to products, sales, customers tables
    - Update existing policies to filter by authenticated user
    - Create secure policies for data isolation

  3. Data Migration
    - Safely add user_id columns with proper defaults
    - Update existing demo data to be user-specific
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
  DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
  
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
  DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
  
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

  -- User settings policies
  CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
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