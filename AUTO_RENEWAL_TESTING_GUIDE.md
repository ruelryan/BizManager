# Auto-Renewal Subscription System - Testing Guide

This guide provides comprehensive testing instructions for the auto-renewal subscription system implemented in BizManager.

## Overview

The auto-renewal system includes:
- ✅ PayPal recurring subscription integration
- ✅ Webhook handlers for all billing events
- ✅ Client-side subscription monitoring
- ✅ Payment failure handling with retry logic
- ✅ Grace period management (3 failed attempts before suspension)
- ✅ Comprehensive subscription management UI

## Prerequisites

1. **Environment Variables** must be set in Supabase:
   - `PAYPAL_CLIENT_ID` - PayPal app client ID
   - `PAYPAL_CLIENT_SECRET` - PayPal app client secret
   - `PAYPAL_BASE_URL` - PayPal API URL (`https://api.sandbox.paypal.com` for testing)
   - `PAYPAL_WEBHOOK_ID` - PayPal webhook ID for signature verification

2. **Database Tables** must exist:
   - `subscriptions` - Main subscription records
   - `paypal_billing_plans` - PayPal plan configurations
   - `payment_transactions` - Payment history
   - `webhook_events` - Webhook audit trail

3. **Supabase Edge Functions** deployed:
   - `paypal-webhook-handler` - Processes PayPal webhooks
   - `setup-paypal-products` - Creates PayPal products and plans
   - `retry-subscription-payment` - Handles payment retries
   - `sync-paypal-subscription` - Syncs subscription status

## Testing Scenarios

### 1. Initial Subscription Creation

**Test Steps:**
1. Navigate to `/upgrade` page
2. Select a plan (Starter or Pro)
3. Click "Subscribe" button
4. Complete PayPal subscription flow
5. Return to app after PayPal approval

**Expected Results:**
- User is redirected to profile with success message
- Subscription record created in database
- User plan upgraded immediately
- Free trial terminated if active
- Subscription shows as "ACTIVE" status

**UI Components to Verify:**
- ✅ Upgrade page shows correct plan pricing
- ✅ PayPal subscription button loads properly
- ✅ Auto-renewal messaging is clear
- ✅ Subscription activation notice appears

### 2. Webhook Event Processing

**Test Events to Verify:**

#### BILLING.SUBSCRIPTION.CREATED
```json
{
  "event_type": "BILLING.SUBSCRIPTION.CREATED",
  "resource": {
    "id": "I-BW452GLLEP1G",
    "plan_id": "P-5ML4271244454362WXNWU5NQ",
    "status": "APPROVAL_PENDING",
    "custom_id": "user-123"
  }
}
```
- Should create subscription record with APPROVAL_PENDING status

#### BILLING.SUBSCRIPTION.ACTIVATED
```json
{
  "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
  "resource": {
    "id": "I-BW452GLLEP1G",
    "status": "ACTIVE",
    "custom_id": "user-123",
    "start_time": "2024-01-15T10:00:00Z",
    "billing_info": {
      "next_billing_time": "2024-02-15T10:00:00Z"
    }
  }
}
```
- Should activate subscription, upgrade user plan, terminate trial
- Should set subscription_expiry to next billing date

#### BILLING.SUBSCRIPTION.PAYMENT.COMPLETED
```json
{
  "event_type": "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED",
  "resource": {
    "id": "I-BW452GLLEP1G",
    "status": "ACTIVE",
    "billing_info": {
      "last_payment": {
        "amount": {"value": "3.99", "currency_code": "USD"},
        "time": "2024-02-15T10:00:00Z",
        "transaction_id": "TXN123"
      },
      "next_billing_time": "2024-03-15T10:00:00Z"
    }
  }
}
```
- Should extend subscription period by 1 month
- Should reset failed payment count to 0
- Should create payment transaction record

### 3. Payment Failure Handling

**Test Payment Failure Events:**

#### BILLING.SUBSCRIPTION.PAYMENT.FAILED
```json
{
  "event_type": "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "resource": {
    "id": "I-BW452GLLEP1G",
    "status_change_note": "Payment declined by bank"
  }
}
```

**Testing Scenarios:**
1. **First Failure**: Should increment failure count, show grace period notice
2. **Second Failure**: Should show high-risk warning
3. **Third Failure**: Should suspend subscription, downgrade user plan

**Expected Grace Period Behavior:**
- User retains full access during grace period
- Clear messaging about retry schedule (1, 3, 5 days)
- Payment retry buttons available
- Update payment method links work

### 4. Client-Side Subscription Monitoring

**Components to Test:**

#### SubscriptionMonitor (Compact Mode)
- Shows in sidebar for real-time status
- Updates automatically every 5 minutes
- Shows appropriate status icons and messages

#### SubscriptionMonitor (Detailed Mode)
- Shows in profile page with full details
- Displays current period dates
- Shows recent transaction history
- Includes grace period notices when applicable

#### PaymentFailureHandler
- Appears when failed_payment_count > 0
- Shows appropriate urgency level (yellow/orange/red)
- Retry payment functionality works
- Update payment method links to PayPal

#### GracePeriodNotice
- Shows during grace period (1-2 failures)
- Explains what's protected during grace period
- Shows retry schedule
- Critical warning at 3+ failures

### 5. Subscription Management UI

**Features to Test:**

#### Overview Tab
- Current plan display with correct pricing
- Next billing date calculation
- Quick action buttons (Update Payment, Sync Status, Change Plan)
- Subscription control (Cancel/Reactivate)

#### Billing Tab
- Payment method display (PayPal)
- Billing summary with accurate amounts
- Subscription ID display

#### Plan Tab
- Current plan features list
- Upgrade/downgrade options

#### History Tab
- Recent transaction display
- Proper status indicators
- Correct amount formatting

### 6. End-to-End Auto-Renewal Flow

**Complete Flow Test:**
1. User subscribes to Starter plan
2. PayPal processes initial payment
3. Subscription activates (webhook processes BILLING.SUBSCRIPTION.ACTIVATED)
4. User receives access to paid features
5. 30 days later: PayPal attempts renewal charge
6. Payment succeeds (webhook processes BILLING.SUBSCRIPTION.PAYMENT.COMPLETED)
7. Subscription period extends by 1 month
8. User retains access without interruption

**Failure Scenario Test:**
1. User has active subscription
2. Payment method expires or gets declined
3. PayPal sends BILLING.SUBSCRIPTION.PAYMENT.FAILED
4. Grace period activates, user sees warning
5. PayPal retries payment after configured delay
6. After 3 failures: subscription suspends
7. User can update payment method and reactivate

### 7. Edge Cases and Error Handling

**Test Cases:**
- Invalid webhook signatures (should log and continue for development)
- Missing user_id in webhook payload
- Duplicate webhook events (idempotency)
- Webhook processing failures
- PayPal API downtime
- Network connectivity issues

## Manual Testing Checklist

### Pre-Deployment
- [ ] Environment variables set correctly
- [ ] Database tables exist with proper schema
- [ ] Supabase functions deployed and accessible
- [ ] PayPal sandbox app configured
- [ ] Webhook endpoints configured in PayPal

### Subscription Creation
- [ ] Upgrade page loads without errors
- [ ] PayPal button initializes correctly
- [ ] Subscription creation flow completes
- [ ] User redirected with success message
- [ ] Database records created properly

### Webhook Processing
- [ ] Webhook handler receives events
- [ ] Signature verification works (when configured)
- [ ] All event types process correctly
- [ ] Database updates occur as expected
- [ ] Error handling works for invalid payloads

### UI Components
- [ ] Subscription monitor shows correct status
- [ ] Payment failure handler appears when needed
- [ ] Grace period notices display properly
- [ ] Management UI shows accurate information
- [ ] All interactive elements function

### Payment Scenarios
- [ ] Successful renewals extend subscription
- [ ] Failed payments trigger grace period
- [ ] Multiple failures lead to suspension
- [ ] Retry mechanisms work correctly
- [ ] Reactivation restores service

## Production Deployment Checklist

### Security
- [ ] Webhook signature verification enabled
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] API endpoints protected

### Monitoring
- [ ] Webhook event logging active
- [ ] Payment transaction tracking
- [ ] Error reporting configured
- [ ] User notification system working

### Business Logic
- [ ] Correct pricing in all currencies
- [ ] Proper tax handling (if applicable)
- [ ] Refund processing capability
- [ ] Customer support integration

## Troubleshooting Guide

### Common Issues

#### "Subscription not found" errors
- Check custom_id in PayPal webhooks matches user_id
- Verify subscription record exists in database
- Ensure webhook processing completed successfully

#### Payment failures not showing in UI
- Check webhook events table for processing errors
- Verify subscription sync is working
- Ensure UI refresh mechanisms active

#### Auto-renewal not working
- Verify BILLING.SUBSCRIPTION.PAYMENT.COMPLETED handler
- Check PayPal plan configuration (total_cycles: 0)
- Confirm subscription status is ACTIVE

### Debugging Tools

#### Webhook Test Simulator
- Use `supabase/functions/webhook-test-simulator` to test webhook processing
- Send sample events to verify handler behavior
- Check processing logs for errors

#### Subscription Sync Function
- Use `sync-paypal-subscription` to manually sync status
- Helpful for debugging discrepancies
- Updates local records with PayPal data

## Success Criteria

The auto-renewal system is working correctly when:

1. **Subscriptions activate automatically** after PayPal approval
2. **Monthly renewals process without user intervention**
3. **Payment failures are handled gracefully** with clear user communication
4. **Grace periods protect user access** while allowing resolution
5. **UI components provide real-time status** and management capabilities
6. **Webhook events process reliably** and update local records
7. **Users can manage subscriptions** through the provided interfaces

## Performance Considerations

- Webhook processing should complete within 30 seconds
- UI updates should reflect within 5 minutes via auto-refresh
- Database queries should be optimized for subscription lookups
- PayPal API calls should include proper retry logic
- Client-side monitoring should not impact user experience

---

This testing guide ensures comprehensive coverage of the auto-renewal subscription system. Follow each section methodically to verify proper functionality before production deployment.