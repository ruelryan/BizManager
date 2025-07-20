-- PayPal Webhook Monitoring & Health Check Script
-- This script provides comprehensive monitoring of webhook processing

-- 1. Webhook Health Dashboard
SELECT 
  'Webhook Processing Summary (Last 24 Hours)' as report_type,
  COUNT(*) as total_events,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed_count,
  COUNT(CASE WHEN processed = false THEN 1 END) as pending_count,
  COUNT(CASE WHEN processing_error IS NOT NULL THEN 1 END) as error_count,
  ROUND(
    (COUNT(CASE WHEN processed = true THEN 1 END) * 100.0 / 
     NULLIF(COUNT(*), 0)), 2
  ) as success_rate_percent
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 2. Event Type Breakdown
SELECT 
  'Event Types (Last 24 Hours)' as report_type,
  event_type,
  COUNT(*) as event_count,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed,
  COUNT(CASE WHEN processing_error IS NOT NULL THEN 1 END) as errors
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY event_count DESC;

-- 3. Failed Processing Analysis
SELECT 
  'Failed Processing Details' as report_type,
  event_id,
  event_type,
  processing_error,
  payload->'resource'->>'custom_id' as user_id,
  payload->'resource'->>'id' as resource_id,
  created_at,
  processed_at
FROM webhook_events
WHERE processing_error IS NOT NULL
   OR (processed = false AND created_at < NOW() - INTERVAL '1 hour')
ORDER BY created_at DESC;

-- 4. Subscription Event Correlation
SELECT 
  'Subscription Event Correlation' as report_type,
  payload->'resource'->>'id' as paypal_subscription_id,
  payload->'resource'->>'custom_id' as user_id,
  COUNT(*) as total_events,
  array_agg(DISTINCT event_type ORDER BY event_type) as event_types,
  array_agg(DISTINCT processed ORDER BY processed) as processing_status,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM webhook_events
WHERE event_type LIKE 'BILLING.SUBSCRIPTION.%'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY payload->'resource'->>'id', payload->'resource'->>'custom_id'
HAVING COUNT(*) > 1 -- Show subscriptions with multiple events
ORDER BY first_event DESC;

-- 5. Orphaned Subscriptions (Events without DB records)
SELECT 
  'Orphaned Subscriptions' as report_type,
  we.payload->'resource'->>'id' as paypal_subscription_id,
  we.payload->'resource'->>'custom_id' as user_id,
  we.event_type,
  we.processed,
  we.processing_error,
  we.created_at,
  CASE 
    WHEN s.paypal_subscription_id IS NOT NULL THEN 'Has subscription record'
    WHEN us.paypal_subscription_id IS NOT NULL THEN 'Has user_settings record only'
    ELSE 'No database record'
  END as db_status
FROM webhook_events we
LEFT JOIN subscriptions s ON s.paypal_subscription_id = we.payload->'resource'->>'id'
LEFT JOIN user_settings us ON us.paypal_subscription_id = we.payload->'resource'->>'id'
WHERE we.event_type IN ('BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CREATED')
  AND we.created_at >= NOW() - INTERVAL '7 days'
  AND (s.paypal_subscription_id IS NULL OR us.paypal_subscription_id IS NULL)
ORDER BY we.created_at DESC;

-- 6. User State Inconsistencies
SELECT 
  'User State Inconsistencies' as report_type,
  us.user_id,
  us.plan,
  us.subscription_status,
  us.payment_status,
  us.is_in_trial,
  us.paypal_subscription_id as us_subscription_id,
  s.paypal_subscription_id as s_subscription_id,
  s.status as subscription_status_in_subscriptions,
  s.plan_type,
  CASE 
    WHEN us.paypal_subscription_id IS NOT NULL AND s.paypal_subscription_id IS NULL 
      THEN 'Missing subscription record'
    WHEN us.plan != 'free' AND us.paypal_subscription_id IS NULL 
      THEN 'Paid plan without PayPal subscription'
    WHEN us.is_in_trial = true AND us.plan != 'free' 
      THEN 'Trial with paid plan'
    WHEN us.payment_status = 'active' AND us.subscription_status = 'inactive' 
      THEN 'Active payment but inactive subscription'
    ELSE 'Other inconsistency'
  END as issue_type
FROM user_settings us
LEFT JOIN subscriptions s ON s.paypal_subscription_id = us.paypal_subscription_id
WHERE 
  -- Find various inconsistencies
  (us.paypal_subscription_id IS NOT NULL AND s.paypal_subscription_id IS NULL) OR
  (us.plan != 'free' AND us.paypal_subscription_id IS NULL) OR
  (us.is_in_trial = true AND us.plan != 'free') OR
  (us.payment_status = 'active' AND us.subscription_status = 'inactive')
ORDER BY us.updated_at DESC;

-- 7. Recent Subscription Activity
SELECT 
  'Recent Subscription Activity' as report_type,
  us.user_id,
  us.plan,
  us.subscription_status,
  us.payment_status,
  us.is_in_trial,
  us.last_payment_date,
  s.status as sub_status,
  s.plan_type,
  s.current_period_end,
  s.failed_payment_count
FROM user_settings us
LEFT JOIN subscriptions s ON s.paypal_subscription_id = us.paypal_subscription_id
WHERE us.updated_at >= NOW() - INTERVAL '24 hours'
   OR s.updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY GREATEST(COALESCE(us.updated_at, '1970-01-01'), COALESCE(s.updated_at, '1970-01-01')) DESC;

-- 8. Payment Transaction Correlation
SELECT 
  'Payment Transaction Status' as report_type,
  pt.user_id,
  pt.transaction_type,
  pt.status,
  pt.amount,
  pt.currency,
  pt.plan_id,
  pt.created_at,
  us.plan as current_plan,
  us.payment_status as current_payment_status
FROM payment_transactions pt
JOIN user_settings us ON us.user_id = pt.user_id
WHERE pt.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY pt.created_at DESC;

-- 9. Webhook Processing Performance
SELECT 
  'Processing Performance' as report_type,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as events_received,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed,
  AVG(CASE 
    WHEN processed_at IS NOT NULL AND created_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (processed_at - created_at))
    ELSE NULL 
  END) as avg_processing_time_seconds
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 10. Create Monitoring View for Easy Access
CREATE OR REPLACE VIEW webhook_monitoring_dashboard AS
SELECT 
  'current_status' as metric_type,
  COUNT(*) as total_events_24h,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed_24h,
  COUNT(CASE WHEN processing_error IS NOT NULL THEN 1 END) as errors_24h,
  COUNT(CASE WHEN event_type LIKE 'BILLING.SUBSCRIPTION.%' THEN 1 END) as subscription_events_24h
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'recent_failures' as metric_type,
  COUNT(*) as count,
  0, 0, 0
FROM webhook_events
WHERE processing_error IS NOT NULL
  AND created_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'pending_processing' as metric_type,
  COUNT(*) as count,
  0, 0, 0
FROM webhook_events
WHERE processed = false
  AND created_at >= NOW() - INTERVAL '1 hour';

-- Usage: Query the monitoring dashboard
SELECT * FROM webhook_monitoring_dashboard;

-- 11. Automated Health Check Function
CREATE OR REPLACE FUNCTION check_webhook_health()
RETURNS TABLE (
  check_name text,
  status text,
  details text,
  recommendation text
) AS $$
BEGIN
  -- Check for recent events
  RETURN QUERY
  SELECT 
    'Recent Events'::text,
    CASE 
      WHEN COUNT(*) > 0 THEN 'HEALTHY'::text
      ELSE 'WARNING'::text
    END,
    'Events in last hour: ' || COUNT(*)::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'No events received. Check PayPal webhook configuration.'::text
      ELSE 'OK'::text
    END
  FROM webhook_events
  WHERE created_at >= NOW() - INTERVAL '1 hour';

  -- Check for processing errors
  RETURN QUERY
  SELECT 
    'Processing Errors'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'HEALTHY'::text
      WHEN COUNT(*) < 5 THEN 'WARNING'::text
      ELSE 'CRITICAL'::text
    END,
    'Errors in last hour: ' || COUNT(*)::text,
    CASE 
      WHEN COUNT(*) > 0 THEN 'Check processing_error details in webhook_events table.'::text
      ELSE 'OK'::text
    END
  FROM webhook_events
  WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND processing_error IS NOT NULL;

  -- Check for unprocessed events
  RETURN QUERY
  SELECT 
    'Unprocessed Events'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'HEALTHY'::text
      WHEN COUNT(*) < 3 THEN 'WARNING'::text
      ELSE 'CRITICAL'::text
    END,
    'Unprocessed events older than 30 minutes: ' || COUNT(*)::text,
    CASE 
      WHEN COUNT(*) > 0 THEN 'Events stuck in processing. Check edge function logs.'::text
      ELSE 'OK'::text
    END
  FROM webhook_events
  WHERE created_at <= NOW() - INTERVAL '30 minutes'
    AND processed = false;
END;
$$ LANGUAGE plpgsql;

-- Run health check
SELECT * FROM check_webhook_health();