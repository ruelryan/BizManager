/*
  # Business Management Schema Setup

  1. New Tables
    - `products` - Product catalog with pricing, stock, and categories
    - `customers` - Customer database with contact information and balances
    - `sales` - Sales transactions with items and payment details

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (temporary for development)

  3. Performance
    - Add indexes for frequently queried columns
    - Add triggers for automatic timestamp updates

  4. Sample Data
    - Insert demo products and customers for testing
*/

-- Create trigger function for updating timestamps if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    barcode text,
    category text NOT NULL,
    cost numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    unit text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    email text,
    address text,
    balance numeric(10,2) DEFAULT 0,
    credit_limit numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number text NOT NULL,
    items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    payments jsonb NOT NULL,
    customer_id uuid,
    customer_name text,
    cashier_id text NOT NULL,
    cashier_name text NOT NULL,
    status text NOT NULL,
    created_at timestamptz DEFAULT now(),
    notes text,
    installment_id uuid
);

-- Add unique constraint for receipt_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_receipt_number_key'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_receipt_number_key UNIQUE (receipt_number);
  END IF;
END $$;

-- Add foreign key constraint for customer_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_fkey'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop and recreate products policies
  DROP POLICY IF EXISTS "Allow all operations on products" ON products;
  CREATE POLICY "Allow all operations on products" ON products
    FOR ALL TO public USING (true);

  -- Drop and recreate customers policies
  DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
  CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL TO public USING (true);

  -- Drop and recreate sales policies
  DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
  CREATE POLICY "Allow all operations on sales" ON sales
    FOR ALL TO public USING (true);
END $$;

-- Create indexes for better performance (with IF NOT EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock, min_stock) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(balance) WHERE balance > 0;

CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Create trigger for updating timestamps on products (drop if exists first)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_products_updated_at ON products;
  CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Insert sample data only if tables are empty
DO $$
BEGIN
  -- Insert sample products if none exist
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (name, description, category, cost, price, stock, min_stock, unit) VALUES
    ('Premium Coffee Beans', 'High-quality arabica coffee beans', 'Food & Beverage', 150.00, 250.00, 100, 20, 'kg'),
    ('Artisan Pastry', 'Freshly baked croissants and pastries', 'Food & Beverage', 80.00, 120.00, 50, 10, 'pcs'),
    ('Herbal Tea Blend', 'Organic chamomile and mint tea', 'Food & Beverage', 120.00, 180.00, 75, 15, 'box'),
    ('Organic Honey', 'Pure wildflower honey', 'Food & Beverage', 200.00, 350.00, 30, 5, 'jar'),
    ('Specialty Bread', 'Sourdough and whole grain bread', 'Food & Beverage', 50.00, 85.00, 40, 8, 'loaf');
  END IF;

  -- Insert sample customers if none exist
  IF NOT EXISTS (SELECT 1 FROM customers LIMIT 1) THEN
    INSERT INTO customers (name, phone, email, address, balance, credit_limit) VALUES
    ('John Doe', '+63 912 345 6789', 'john.doe@email.com', '123 Main St, Manila', 0, 5000),
    ('Jane Smith', '+63 917 234 5678', 'jane.smith@email.com', '456 Oak Ave, Quezon City', 150, 3000),
    ('Bob Johnson', '+63 922 345 6789', 'bob.johnson@email.com', '789 Pine Rd, Makati', 0, 2000),
    ('Alice Brown', '+63 918 765 4321', 'alice.brown@email.com', '321 Elm St, Pasig', 75, 4000);
  END IF;
END $$;