# PayPal Webhook Debugging Guide

## Issue Analysis

Based on your description, the PayPal subscription webhook events (`BILLING.SUBSCRIPTION.CREATED` and `BILLING.SUBSCRIPTION.ACTIVATED`) are not properly updating the database, resulting in:

- Empty `paypal_subscription_id` in user_settings
- `payment_status: inactive`
- `is_in_trial: TRUE` (should be FALSE after activation)
- `subscription_status: inactive`
- Empty subscriptions table

## Debugging Steps

### Step 1: Check Webhook Event Reception
Run the SQL debugging script to see if events were received:

```sql
-- Run debug-webhook.sql in Supabase SQL Editor
-- This will show if PayPal events were received and processed
```

**Expected Results:**
- Events should appear in `webhook_events` table
- Look for `BILLING.SUBSCRIPTION.CREATED` and `BILLING.SUBSCRIPTION.ACTIVATED` events
- Check `processed` status and `processing_error` fields

### Step 2: Verify Webhook Configuration

#### 2.1 PayPal Developer Dashboard
1. Go to PayPal Developer Console
2. Navigate to your app → Webhooks
3. Verify webhook URL points to: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/paypal-webhook-handler`
4. Ensure these events are enabled:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

#### 2.2 Supabase Environment Variables
Check these environment variables in Supabase Dashboard → Settings → Edge Functions:
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_BASE_URL=https://api.sandbox.paypal.com (for sandbox)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Test Webhook Endpoint
1. Update `test-webhook-endpoint.js` with your webhook URL
2. Replace `test-user-id-123` with an actual user ID from your database
3. Run the test script to simulate webhook events

### Step 4: Check Supabase Logs
1. Go to Supabase Dashboard → Logs → Edge Functions
2. Look for webhook handler logs around the time of subscription creation
3. Check for any error messages or failed processing

### Step 5: Common Issues & Solutions

#### Issue 1: Webhook Events Not Received
**Symptoms:** Empty `webhook_events` table
**Solutions:**
- Verify PayPal webhook URL configuration
- Check if webhook endpoint is publicly accessible
- Ensure Supabase Edge Function is deployed

#### Issue 2: Signature Verification Fails
**Symptoms:** Events received but marked with signature error
**Solutions:**
- Verify `PAYPAL_WEBHOOK_ID` matches PayPal dashboard
- Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Note: The webhook handler continues processing even with signature failures (for development)

#### Issue 3: Custom ID Not Passed
**Symptoms:** Events processed but no user found
**Solutions:**
- Ensure frontend passes user ID as `custom_id` when creating PayPal subscription
- Check PayPal subscription creation code includes custom_id parameter

#### Issue 4: Database Permission Issues
**Symptoms:** Processing fails with database errors
**Solutions:**
- Verify RLS policies allow service role access
- Check if all required tables exist
- Ensure foreign key relationships are correct

### Step 6: Manual Testing Procedure

1. **Create a test subscription:**
   ```javascript
   // In your frontend PayPal integration
   createSubscription: function(data, actions) {
     return actions.subscription.create({
       'plan_id': 'P-BIZMANAGER_STARTER',
       'custom_id': 'actual-user-id-here', // Critical: Include user ID
       'application_context': {
         'brand_name': 'BizManager',
         'user_action': 'SUBSCRIBE_NOW'
       }
     });
   }
   ```

2. **Monitor webhook events:**
   - Check Supabase logs immediately after subscription creation
   - Run debugging SQL queries to verify event processing

3. **Verify database updates:**
   - Check `webhook_events` table for received events
   - Verify `subscriptions` table has new subscription
   - Confirm `user_settings` is updated with subscription details

### Step 7: Error Scenarios Analysis

Based on the webhook handler code, here are potential failure points:

#### Missing custom_id
```typescript
// Line 553 in webhook handler
if (!customId) {
  console.error('No custom_id found in subscription activation');
  return; // Processing stops here
}
```

#### Database constraint violations
- Foreign key issues with user_id
- Invalid plan_type values
- Missing required fields

#### Network/timeout issues
- PayPal signature verification timeout
- Database connection issues
- Supabase service role permissions

## Quick Diagnostic Commands

### 1. Check for recent webhook events:
```sql
SELECT event_type, processed, processing_error, created_at 
FROM webhook_events 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 2. Check subscription status:
```sql
SELECT us.user_id, us.plan, us.subscription_status, us.paypal_subscription_id, 
       s.status as sub_status, s.plan_type
FROM user_settings us
LEFT JOIN subscriptions s ON s.paypal_subscription_id = us.paypal_subscription_id
WHERE us.plan != 'free' OR us.is_in_trial = true;
```

### 3. Test webhook endpoint health:
```bash
curl -X OPTIONS https://YOUR_PROJECT_ID.supabase.co/functions/v1/paypal-webhook-handler
```

## Resolution Steps

1. **Run diagnostic SQL** to identify what's missing
2. **Check PayPal webhook configuration** and ensure events are being sent
3. **Verify environment variables** in Supabase
4. **Test endpoint manually** using the provided script
5. **Check logs** for specific error messages
6. **Fix identified issues** (missing custom_id, wrong webhook URL, etc.)
7. **Re-test subscription flow** end-to-end

## Expected Working Flow

1. User creates PayPal subscription → `BILLING.SUBSCRIPTION.CREATED` event
2. User approves subscription → `BILLING.SUBSCRIPTION.ACTIVATED` event
3. Webhook handler receives events and:
   - Creates record in `webhook_events` table
   - Creates/updates record in `subscriptions` table
   - Updates `user_settings` with:
     - `paypal_subscription_id`
     - `plan: 'starter'` or `'pro'`
     - `payment_status: 'active'`
     - `subscription_status: 'active'`
     - `is_in_trial: false`
   - Creates payment transaction record
   - Queues success notification

If any step fails, the webhook handler logs detailed error information that can be found in Supabase Edge Functions logs.