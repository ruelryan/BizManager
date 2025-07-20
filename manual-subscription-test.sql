-- Manual Subscription Testing & Recovery Script
-- This script helps manually trigger subscription processing or recover from failed webhook processing

-- First, let's check the current state for a specific user
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID having issues

-- 1. Check current user state
SELECT 
  'Current user_settings state' as info,
  user_id,
  plan,
  subscription_expiry,
  paypal_subscription_id,
  payment_status,
  is_in_trial,
  subscription_status,
  auto_renew,
  last_payment_date
FROM user_settings 
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 2. Check if there are any subscription records
SELECT 
  'Current subscription state' as info,
  user_id,
  paypal_subscription_id,
  status,
  plan_type,
  start_time,
  current_period_end,
  failed_payment_count
FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 3. Check recent webhook events for this user
SELECT 
  'Webhook events for user' as info,
  event_id,
  event_type,
  payload->'resource'->>'custom_id' as user_id_from_event,
  payload->'resource'->>'id' as subscription_id,
  payload->'resource'->>'status' as subscription_status,
  processed,
  processing_error,
  created_at
FROM webhook_events
WHERE payload->'resource'->>'custom_id' = 'YOUR_USER_ID_HERE'
   OR payload->'resource'->>'id' IN (
     SELECT paypal_subscription_id FROM user_settings WHERE user_id = 'YOUR_USER_ID_HERE'
   )
ORDER BY created_at DESC;

-- 4. Manual Recovery Option 1: If you have the PayPal subscription ID
-- Replace 'I-PAYPAL-SUBSCRIPTION-ID' with the actual PayPal subscription ID

-- First, create the subscription record if it doesn't exist
INSERT INTO subscriptions (
  user_id,
  paypal_subscription_id,
  paypal_plan_id,
  status,
  plan_type,
  start_time,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  failed_payment_count
) VALUES (
  'YOUR_USER_ID_HERE',
  'I-PAYPAL-SUBSCRIPTION-ID', -- Replace with actual PayPal subscription ID
  'P-BIZMANAGER_STARTER', -- Or P-BIZMANAGER_PRO for pro plan
  'ACTIVE',
  'starter', -- Or 'pro' for pro plan
  NOW(),
  NOW(),
  NOW() + INTERVAL '1 month',
  false,
  0
) ON CONFLICT (paypal_subscription_id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_type = EXCLUDED.plan_type,
  updated_at = NOW();

-- Then update user settings
UPDATE user_settings SET
  plan = 'starter', -- Or 'pro' for pro plan
  subscription_expiry = NOW() + INTERVAL '1 month',
  paypal_subscription_id = 'I-PAYPAL-SUBSCRIPTION-ID', -- Replace with actual PayPal subscription ID
  payment_status = 'active',
  is_in_trial = false,
  subscription_status = 'active',
  auto_renew = true,
  last_payment_date = NOW(),
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 5. Manual Recovery Option 2: If you need to terminate trial and activate subscription
-- Use this if you just want to fix the trial status without PayPal subscription ID

UPDATE user_settings SET
  is_in_trial = false,
  plan = 'starter', -- Or whatever plan was purchased
  payment_status = 'active',
  subscription_status = 'active',
  last_payment_date = NOW(),
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 6. Create a payment transaction record for the manual activation
INSERT INTO payment_transactions (
  user_id,
  paypal_transaction_id,
  transaction_type,
  amount,
  currency,
  status,
  plan_id,
  payment_method,
  net_amount,
  metadata
) VALUES (
  'YOUR_USER_ID_HERE',
  'MANUAL_FIX_' || extract(epoch from now()), -- Generate unique transaction ID
  'subscription_activation',
  3.99, -- Or 9.99 for pro plan
  'USD',
  'completed',
  'starter', -- Or 'pro' for pro plan
  'paypal_subscription',
  3.99, -- Or 9.99 for pro plan
  jsonb_build_object(
    'manual_recovery', true,
    'recovery_date', now(),
    'note', 'Manual recovery due to webhook processing failure'
  )
);

-- 7. Verification queries - Run these after manual recovery
SELECT 
  'After recovery - user_settings' as info,
  user_id,
  plan,
  subscription_expiry,
  paypal_subscription_id,
  payment_status,
  is_in_trial,
  subscription_status,
  auto_renew
FROM user_settings 
WHERE user_id = 'YOUR_USER_ID_HERE';

SELECT 
  'After recovery - subscriptions' as info,
  user_id,
  paypal_subscription_id,
  status,
  plan_type,
  start_time,
  current_period_end
FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID_HERE';

SELECT 
  'After recovery - recent transactions' as info,
  user_id,
  transaction_type,
  amount,
  status,
  plan_id,
  created_at
FROM payment_transactions 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check for webhook events that might be stuck processing
SELECT 
  'Stuck webhook events' as info,
  event_id,
  event_type,
  processed,
  processing_error,
  created_at,
  payload->'resource'->>'id' as subscription_id
FROM webhook_events
WHERE processed = false 
   OR processing_error IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 9. Mark stuck webhook events as processed (if needed)
-- Uncomment and run only if you have events stuck in processing
/*
UPDATE webhook_events 
SET processed = true, 
    processed_at = NOW(),
    processing_error = 'Manually resolved'
WHERE event_id IN (
  -- Add specific event IDs that are stuck
  'WH-EVENT-ID-1',
  'WH-EVENT-ID-2'
);
*/

-- Instructions:
-- 1. Replace 'YOUR_USER_ID_HERE' with the actual user UUID
-- 2. Replace 'I-PAYPAL-SUBSCRIPTION-ID' with actual PayPal subscription ID (if known)
-- 3. Adjust plan type ('starter' vs 'pro') and amounts (3.99 vs 9.99) as needed
-- 4. Run queries step by step to diagnose and fix the issue
-- 5. Verify the fix using the verification queries at the end