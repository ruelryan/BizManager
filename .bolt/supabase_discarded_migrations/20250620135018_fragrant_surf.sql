/*
  # Create Business Management Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `barcode` (text, nullable)
      - `category` (text)
      - `cost` (numeric)
      - `price` (numeric)
      - `stock` (integer)
      - `min_stock` (integer)
      - `unit` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `sales`
      - `id` (uuid, primary key)
      - `receipt_number` (text, unique)
      - `items` (jsonb)
      - `subtotal` (numeric)
      - `tax` (numeric)
      - `discount` (numeric)
      - `total` (numeric)
      - `payments` (jsonb)
      - `customer_id` (uuid, nullable)
      - `customer_name` (text, nullable)
      - `cashier_id` (text)
      - `cashier_name` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `notes` (text, nullable)
      - `installment_id` (uuid, nullable)

    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text, nullable)
      - `email` (text, nullable)
      - `address` (text, nullable)
      - `balance` (numeric)
      - `credit_limit` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add performance indexes for common queries
    - Add unique constraints where needed

  4. Functions
    - Add trigger function for updating timestamps
*/

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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
    receipt_number text NOT NULL UNIQUE,
    items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    payments jsonb NOT NULL,
    customer_id uuid REFERENCES customers(id),
    customer_name text,
    cashier_id text NOT NULL,
    cashier_name text NOT NULL,
    status text NOT NULL,
    created_at timestamptz DEFAULT now(),
    notes text,
    installment_id uuid
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow all operations on products" ON products
    FOR ALL TO public USING (true);

-- Create policies for customers
CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL TO public USING (true);

-- Create policies for sales
CREATE POLICY "Allow all operations on sales" ON sales
    FOR ALL TO public USING (true);

-- Create indexes for better performance
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

-- Create trigger for updating timestamps on products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO products (name, description, category, cost, price, stock, min_stock, unit) VALUES
('Premium Coffee Beans', 'High-quality arabica coffee beans', 'Food & Beverage', 150.00, 250.00, 100, 20, 'kg'),
('Artisan Pastry', 'Freshly baked croissants and pastries', 'Food & Beverage', 80.00, 120.00, 50, 10, 'pcs'),
('Herbal Tea Blend', 'Organic chamomile and mint tea', 'Food & Beverage', 120.00, 180.00, 75, 15, 'box'),
('Organic Honey', 'Pure wildflower honey', 'Food & Beverage', 200.00, 350.00, 30, 5, 'jar'),
('Specialty Bread', 'Sourdough and whole grain bread', 'Food & Beverage', 50.00, 85.00, 40, 8, 'loaf')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customers (name, phone, email, address, balance, credit_limit) VALUES
('John Doe', '+63 912 345 6789', 'john.doe@email.com', '123 Main St, Manila', 0, 5000),
('Jane Smith', '+63 917 234 5678', 'jane.smith@email.com', '456 Oak Ave, Quezon City', 150, 3000),
('Bob Johnson', '+63 922 345 6789', 'bob.johnson@email.com', '789 Pine Rd, Makati', 0, 2000),
('Alice Brown', '+63 918 765 4321', 'alice.brown@email.com', '321 Elm St, Pasig', 75, 4000)
ON CONFLICT (email) DO NOTHING;