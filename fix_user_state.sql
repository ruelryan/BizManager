-- Fix user subscription state after webhook processing
UPDATE user_settings 
SET 
  is_in_trial = false,
  subscription_status = 'active',
  payment_status = 'active',
  last_payment_date = '2025-07-17 15:01:53Z',
  updated_at = NOW()
WHERE user_id = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';

-- Check the result
SELECT 
  user_id,
  plan,
  is_in_trial,
  subscription_status,
  payment_status,
  trial_start_date,
  trial_end_date,
  trial_used,
  last_payment_date
FROM user_settings 
WHERE user_id = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';