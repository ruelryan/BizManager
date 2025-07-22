-- Fix sales status constraint to include refunded and partially_refunded statuses
-- This resolves the constraint violation error when processing returns

-- Drop existing constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- Add new constraint with additional refund statuses
ALTER TABLE sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled', 'refunded', 'partially_refunded'));