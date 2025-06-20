/*
  # Add customer_email column to sales table

  1. Changes
    - Add `customer_email` column to `sales` table
    - Column is nullable to maintain compatibility with existing records
    - No RLS changes needed as existing policies cover all operations

  2. Notes
    - This resolves the schema cache error where the application expects a customer_email column
    - Existing sales records will have NULL for customer_email initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE sales ADD COLUMN customer_email text;
  END IF;
END $$;