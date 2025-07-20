-- PayPal Webhook Debugging Script
-- Run this in your Supabase SQL editor to diagnose webhook issues

-- 1. Check if webhook events were received
SELECT 
  'webhook_events' as table_name,
  COUNT(*) as total_events,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed_events,
  COUNT(CASE WHEN processed = false THEN 1 END) as unprocessed_events,
  COUNT(CASE WHEN processing_error IS NOT NULL THEN 1 END) as failed_events
FROM webhook_events;

-- 2. Show recent webhook events (last 24 hours)
SELECT 
  event_id,
  event_type,
  resource_type,
  resource_id,
  processed,
  processing_error,
  created_at,
  processed_at,
  -- Extract custom_id (user_id) from payload if it exists
  CASE 
    WHEN payload->'resource'->>'custom_id' IS NOT NULL 
    THEN payload->'resource'->>'custom_id'
    ELSE 'No custom_id'
  END as user_id_from_payload
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check for subscription-related events specifically
SELECT 
  event_id,
  event_type,
  payload->'resource'->>'id' as subscription_id,
  payload->'resource'->>'custom_id' as user_id,
  payload->'resource'->>'status' as subscription_status,
  payload->'resource'->>'plan_id' as paypal_plan_id,
  processed,
  processing_error,
  created_at
FROM webhook_events
WHERE event_type LIKE 'BILLING.SUBSCRIPTION.%'
ORDER BY created_at DESC;

-- 4. Check current subscription table state
SELECT 
  user_id,
  paypal_subscription_id,
  status,
  plan_type,
  start_time,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  failed_payment_count,
  created_at,
  updated_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check user_settings for the affected user
SELECT 
  user_id,
  plan,
  subscription_expiry,
  paypal_subscription_id,
  payment_status,
  is_in_trial,
  subscription_status,
  auto_renew,
  last_payment_date,
  cancellation_reason
FROM user_settings
WHERE plan != 'free' OR is_in_trial = true OR paypal_subscription_id IS NOT NULL
ORDER BY updated_at DESC;

-- 6. Check payment transactions
SELECT 
  user_id,
  paypal_transaction_id,
  transaction_type,
  amount,
  currency,
  status,
  plan_id,
  payment_method,
  failure_reason,
  created_at
FROM payment_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 7. Check notification queue for any subscription-related notifications
SELECT 
  user_id,
  notification_type,
  title,
  message,
  metadata,
  sent,
  created_at
FROM notification_queue
WHERE notification_type LIKE '%subscription%' OR notification_type LIKE '%payment%'
ORDER BY created_at DESC
LIMIT 10;

-- 8. Look for orphaned webhook events (events that should have created subscriptions but didn't)
SELECT 
  we.event_id,
  we.event_type,
  we.payload->'resource'->>'id' as subscription_id,
  we.payload->'resource'->>'custom_id' as user_id,
  we.payload->'resource'->>'status' as subscription_status,
  we.processed,
  we.processing_error,
  CASE 
    WHEN s.paypal_subscription_id IS NULL THEN 'SUBSCRIPTION NOT FOUND'
    ELSE 'SUBSCRIPTION EXISTS'
  END as subscription_exists
FROM webhook_events we
LEFT JOIN subscriptions s ON s.paypal_subscription_id = we.payload->'resource'->>'id'
WHERE we.event_type IN ('BILLING.SUBSCRIPTION.CREATED', 'BILLING.SUBSCRIPTION.ACTIVATED')
ORDER BY we.created_at DESC;

-- 9. Check for duplicate events that might be causing issues
SELECT 
  event_id,
  COUNT(*) as duplicate_count,
  array_agg(DISTINCT processed) as processing_status
FROM webhook_events
GROUP BY event_id
HAVING COUNT(*) > 1;

-- 10. Show payload details for failed subscription events
SELECT 
  event_id,
  event_type,
  processing_error,
  jsonb_pretty(payload) as full_payload
FROM webhook_events
WHERE event_type LIKE 'BILLING.SUBSCRIPTION.%' 
  AND (processed = false OR processing_error IS NOT NULL)
ORDER BY created_at DESC
LIMIT 5;