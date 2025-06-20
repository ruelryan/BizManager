/*
  # Add customer_email column to sales table

  1. Changes
    - Add customer_email column to sales table to support storing customer email addresses
    - Column is nullable to maintain compatibility with existing records

  2. Security
    - No changes to existing RLS policies
*/

-- Add customer_email column to sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE sales ADD COLUMN customer_email text;
  END IF;
END $$;