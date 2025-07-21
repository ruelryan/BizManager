-- Fix existing payment transaction amounts to use PHP instead of USD
-- This migration corrects the currency conversion issues in payment history

-- Update Starter plan transactions (3.99 USD -> 199 PHP)
UPDATE payment_transactions 
SET 
  amount = 199,
  currency = 'PHP',
  net_amount = 199
WHERE 
  amount = 3.99 
  AND currency = 'USD' 
  AND (
    transaction_type = 'subscription_activation' 
    OR plan_id = 'starter'
    OR paypal_transaction_id LIKE '%starter%'
  );

-- Update Pro plan transactions (9.99 USD -> 499 PHP)  
UPDATE payment_transactions 
SET 
  amount = 499,
  currency = 'PHP',
  net_amount = 499
WHERE 
  amount = 9.99 
  AND currency = 'USD' 
  AND (
    transaction_type = 'subscription_activation' 
    OR plan_id = 'pro'
    OR paypal_transaction_id LIKE '%pro%'
  );

-- Update any other USD amounts that match common conversion patterns
-- 224.16 PHP was likely 4 USD, 498.88 PHP was likely 8.9 USD, etc.

-- Fix common conversion artifacts
UPDATE payment_transactions 
SET 
  amount = CASE 
    WHEN amount BETWEEN 224 AND 225 THEN 199  -- Likely Starter plan
    WHEN amount BETWEEN 498 AND 502 THEN 499  -- Likely Pro plan
    WHEN amount BETWEEN 560 AND 565 THEN 499  -- Another Pro plan variant
    ELSE amount
  END,
  currency = 'PHP'
WHERE 
  currency = 'USD' 
  AND (
    (amount BETWEEN 224 AND 225) OR 
    (amount BETWEEN 498 AND 502) OR 
    (amount BETWEEN 560 AND 565)
  );

-- Add comment for tracking
COMMENT ON TABLE payment_transactions IS 'Updated 2025-07-21: Fixed USD to PHP currency conversion for payment history display';