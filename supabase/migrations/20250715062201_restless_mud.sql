/*
  # Fix installment plans and customers relationship

  1. Database Changes
    - Add foreign key constraint between installment_plans and customers tables
    - Ensure proper indexing for performance
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'installment_plans_customer_id_fkey'
    AND table_name = 'installment_plans'
  ) THEN
    ALTER TABLE public.installment_plans
    ADD CONSTRAINT installment_plans_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES public.customers(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_installment_plans_customer_id 
ON public.installment_plans(customer_id);