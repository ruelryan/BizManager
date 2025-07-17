-- Fix user subscription state after webhook failures
-- This will manually terminate trial and activate subscription

-- Update user settings to terminate trial and activate subscription
UPDATE user_settings 
SET 
  is_in_trial = false,
  subscription_status = 'active',
  payment_status = 'active',
  last_payment_date = NOW(),
  updated_at = NOW()
WHERE user_id = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';

-- Check if subscription record exists
SELECT * FROM subscriptions WHERE user_id = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';

-- Check current user settings
SELECT * FROM user_settings WHERE user_id = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';

-- Check recent webhook events
SELECT * FROM webhook_events WHERE created_at >= '2025-07-17 14:00:00' ORDER BY created_at DESC LIMIT 10;