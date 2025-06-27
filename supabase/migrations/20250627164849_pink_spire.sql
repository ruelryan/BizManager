/*
  # Add Customer Features

  1. New Columns
    - `barcode` column to products table for barcode scanning
    - `special_pricing` column to customers table for customer-specific pricing
    - `returns` table for tracking returns and refunds

  2. Security
    - Update RLS policies to include new tables
*/

-- Add barcode column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode text;
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
  END IF;
END $$;

-- Add special_pricing column to customers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'special_pricing'
  ) THEN
    ALTER TABLE customers ADD COLUMN special_pricing jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create returns table if it doesn't exist
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_sale_id uuid REFERENCES sales(id),
  date timestamptz DEFAULT now(),
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  refund_method text NOT NULL,
  status text NOT NULL,
  reason text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on returns table
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for returns table
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own returns" ON returns;
  DROP POLICY IF EXISTS "Users can insert own returns" ON returns;
  DROP POLICY IF EXISTS "Users can update own returns" ON returns;
  DROP POLICY IF EXISTS "Users can delete own returns" ON returns;
  
  -- Create new policies
  CREATE POLICY "Users can view own returns" ON returns
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own returns" ON returns
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own returns" ON returns
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own returns" ON returns
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create indexes for returns table
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_original_sale_id ON returns(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(date);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);