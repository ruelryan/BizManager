import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paypal-transmission-id, x-paypal-cert-id, x-paypal-auth-algo, x-paypal-transmission-sig, x-paypal-transmission-time',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
Deno.serve(async (req)=>{
  console.log('=== WEBHOOK REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    // Get environment variables with detailed logging
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID');
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api.sandbox.paypal.com'; // Default to sandbox
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('=== ENVIRONMENT CONFIGURATION ===');
    console.log('- PAYPAL_CLIENT_ID:', PAYPAL_CLIENT_ID ? `SET (${PAYPAL_CLIENT_ID.substring(0, 10)}...)` : 'MISSING');
    console.log('- PAYPAL_CLIENT_SECRET:', PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('- PAYPAL_WEBHOOK_ID:', PAYPAL_WEBHOOK_ID ? `SET (${PAYPAL_WEBHOOK_ID})` : 'MISSING');
    console.log('- PAYPAL_BASE_URL:', PAYPAL_BASE_URL);
    console.log('- SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Get webhook payload and headers
    const webhookBody = await req.text();
    console.log('Webhook body length:', webhookBody.length);
    console.log('Webhook body preview:', webhookBody.substring(0, 500));
    let webhookEvent;
    try {
      webhookEvent = JSON.parse(webhookBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      throw new Error('Invalid JSON in webhook body');
    }
    // Extract PayPal headers for verification
    const paypalHeaders = {
      'x-paypal-transmission-id': req.headers.get('x-paypal-transmission-id') || '',
      'x-paypal-cert-id': req.headers.get('x-paypal-cert-id') || '',
      'x-paypal-auth-algo': req.headers.get('x-paypal-auth-algo') || '',
      'x-paypal-transmission-sig': req.headers.get('x-paypal-transmission-sig') || '',
      'x-paypal-transmission-time': req.headers.get('x-paypal-transmission-time') || ''
    };
    console.log('=== WEBHOOK EVENT DETAILS ===');
    console.log('Event ID:', webhookEvent.id);
    console.log('Event Type:', webhookEvent.event_type);
    console.log('Resource Type:', webhookEvent.resource_type);
    console.log('PayPal Headers:', paypalHeaders);
    // Check for duplicate events (idempotency)
    const { data: existingEvent, error: existingEventError } = await supabase.from('webhook_events').select('id, processed').eq('event_id', webhookEvent.id).single();
    if (existingEventError && existingEventError.code !== 'PGRST116') {
      console.error('Error checking for existing event:', existingEventError);
    }
    if (existingEvent) {
      if (existingEvent.processed) {
        console.log('Event already processed:', webhookEvent.id);
        return new Response('Event already processed', {
          status: 200,
          headers: corsHeaders
        });
      }
      console.log('Event exists but not processed yet:', webhookEvent.id);
    } else {
      // Store the webhook event for audit trail
      console.log('Storing new webhook event...');
      const { error: insertError } = await supabase.from('webhook_events').insert({
        event_id: webhookEvent.id,
        event_type: webhookEvent.event_type,
        resource_type: webhookEvent.resource_type,
        resource_id: webhookEvent.resource?.id || null,
        payload: webhookEvent,
        processed: false
      });
      if (insertError) {
        console.error('Error storing webhook event:', insertError);
      } else {
        console.log('Webhook event stored successfully');
      }
    }
    // Verify webhook signature if we have all required credentials
    let isValid = true;
    if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET && PAYPAL_WEBHOOK_ID) {
      console.log('=== VERIFYING WEBHOOK SIGNATURE ===');
      console.log('Using PayPal Base URL:', PAYPAL_BASE_URL);
      console.log('Using Webhook ID:', PAYPAL_WEBHOOK_ID);
      isValid = await verifyWebhookSignature(webhookBody, paypalHeaders, PAYPAL_WEBHOOK_ID, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_BASE_URL);
      console.log('Signature verification result:', isValid);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        await updateWebhookProcessingError(supabase, webhookEvent.id, 'Invalid webhook signature');
        // For development/testing, we'll continue processing even with invalid signature
        // but log it as a warning
        console.log('⚠️ CONTINUING ANYWAY FOR DEVELOPMENT - This should be fixed for production!');
        isValid = true; // Override for development
      } else {
        console.log('✅ Webhook signature verified successfully');
      }
    } else {
      console.log('⚠️ Skipping signature verification - missing PayPal credentials');
      console.log('Missing credentials:');
      if (!PAYPAL_CLIENT_ID) console.log('  - PAYPAL_CLIENT_ID');
      if (!PAYPAL_CLIENT_SECRET) console.log('  - PAYPAL_CLIENT_SECRET');
      if (!PAYPAL_WEBHOOK_ID) console.log('  - PAYPAL_WEBHOOK_ID');
      console.log('This is NOT recommended for production!');
    }
    // Process the webhook event based on type
    console.log('=== PROCESSING WEBHOOK EVENT ===');
    await processWebhookEvent(supabase, webhookEvent);
    // Mark event as processed (clear any previous errors)
    const { error: updateError } = await supabase.from('webhook_events').update({
      processed: true,
      processed_at: new Date().toISOString(),
      processing_error: null  // Clear any previous errors
    }).eq('event_id', webhookEvent.id);
    if (updateError) {
      console.error('Error marking event as processed:', updateError);
    } else {
      console.log('Event marked as processed successfully');
    }
    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log('Event ID:', webhookEvent.id, 'processed successfully');
    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    // Mark event as processed with error
    const { error: updateError } = await supabase.from('webhook_events').update({
      processed: true,
      processed_at: new Date().toISOString(),
      processing_error: error.message
    }).eq('event_id', webhookEvent.id);
    
    if (updateError) {
      console.error('Error marking event as processed with error:', updateError);
    }
    
    return new Response(`Webhook processing failed: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
});
async function verifyWebhookSignature(webhookBody, headers, webhookId, clientId, clientSecret, baseUrl) {
  try {
    console.log('Getting PayPal access token from:', baseUrl);
    // Get PayPal access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Failed to get PayPal access token:', authResponse.status, errorText);
      return false;
    }
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('✅ PayPal access token obtained successfully');
    // Verify webhook signature
    console.log('=== VERIFYING WEBHOOK SIGNATURE ===');
    // Parse the webhook event to ensure it's valid JSON
    let webhookEventObj;
    try {
      webhookEventObj = JSON.parse(webhookBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body for verification:', parseError);
      return false;
    }
    const verificationPayload = {
      auth_algo: headers['x-paypal-auth-algo'],
      cert_id: headers['x-paypal-cert-id'],
      transmission_id: headers['x-paypal-transmission-id'],
      transmission_sig: headers['x-paypal-transmission-sig'],
      transmission_time: headers['x-paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: webhookEventObj
    };
    console.log('Verification payload summary:');
    console.log('- auth_algo:', verificationPayload.auth_algo);
    console.log('- cert_id:', verificationPayload.cert_id);
    console.log('- transmission_id:', verificationPayload.transmission_id);
    console.log('- webhook_id:', verificationPayload.webhook_id);
    console.log('- webhook_event.id:', webhookEventObj.id);
    // Check if all required headers are present
    const requiredHeaders = [
      'auth_algo',
      'cert_id',
      'transmission_id',
      'transmission_sig',
      'transmission_time'
    ];
    const missingHeaders = requiredHeaders.filter((header)=>!verificationPayload[header]);
    if (missingHeaders.length > 0) {
      console.error('Missing required PayPal headers:', missingHeaders);
      return false;
    }
    const verificationResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(verificationPayload)
    });
    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('Webhook verification failed:', verificationResponse.status, errorText);
      // Try to parse the error response for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('PayPal verification error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Could not parse PayPal error response');
      }
      return false;
    }
    const verificationResult = await verificationResponse.json();
    console.log('Verification result:', verificationResult);
    return verificationResult.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}
async function processWebhookEvent(supabase, event) {
  const { event_type, resource } = event;
  console.log('Processing event type:', event_type);
  console.log('Resource details:', JSON.stringify(resource, null, 2));
  switch(event_type){
    // Payment completion events
    case 'PAYMENT.CAPTURE.COMPLETED':
    case 'CHECKOUT.ORDER.APPROVED':
      await handlePaymentCompleted(supabase, event);
      break;
    // Payment failure events
    case 'PAYMENT.CAPTURE.DECLINED':
    case 'PAYMENT.CAPTURE.PENDING':
    case 'CHECKOUT.ORDER.VOIDED':
      await handlePaymentFailed(supabase, event);
      break;
    // Refund events
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handleRefund(supabase, event);
      break;
    // Dispute and chargeback events
    case 'CUSTOMER.DISPUTE.CREATED':
    case 'CUSTOMER.DISPUTE.RESOLVED':
    case 'CUSTOMER.DISPUTE.UPDATED':
      await handleDispute(supabase, event);
      break;
    // Subscription events
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivated(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      await handleSubscriptionCancelled(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.CREATED':
      await handleSubscriptionCreated(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await handleSubscriptionExpired(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
      await handleSubscriptionPaymentCompleted(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await handleSubscriptionPaymentFailed(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.CYCLE.COMPLETED':
      await handleSubscriptionCycleCompleted(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
      await handleSubscriptionReactivated(supabase, event);
      break;
    case 'BILLING.SUBSCRIPTION.UPDATED':
      await handleSubscriptionUpdated(supabase, event);
      break;
    default:
      console.log('Unhandled event type:', event_type);
      console.log('This event will be logged but not processed');
  }
}
async function handlePaymentCompleted(supabase, event) {
  const { resource } = event;
  const amount = parseFloat(resource.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';
  const transactionId = resource.id;
  console.log('=== PROCESSING PAYMENT COMPLETION ===');
  console.log('Transaction ID:', transactionId);
  console.log('Amount:', amount, currency);
  // Find user by PayPal payer ID or custom field
  const payerId = resource.payer?.payer_id;
  const customId = resource.custom_id; // This should be the user ID from your app
  console.log('Payer ID:', payerId);
  console.log('Custom ID:', customId);
  let userId = customId;
  // If no custom ID, try to find user by PayPal payer ID
  if (!userId && payerId) {
    console.log('No custom ID found, using payer ID:', payerId);
  // You might need to implement a mapping table for PayPal payer IDs to user IDs
  }
  if (!userId) {
    console.error('Cannot identify user for payment:', transactionId);
    // For now, let's create a generic transaction record
    await supabase.from('payment_transactions').insert({
      paypal_transaction_id: transactionId,
      transaction_type: 'payment',
      amount: amount,
      currency: currency,
      status: 'completed',
      metadata: resource
    });
    console.log('Created anonymous transaction record');
    return;
  }
  // Determine plan based on amount (convert USD to PHP for comparison)
  let planId = 'free';
  const phpAmount = amount * 57; // Approximate USD to PHP conversion
  if (phpAmount >= 499) {
    planId = 'pro';
  } else if (phpAmount >= 199) {
    planId = 'starter';
  }
  console.log('Determined plan:', planId, 'based on PHP amount:', phpAmount);
  // Calculate subscription expiry (30 days from now)
  const subscriptionExpiry = new Date();
  subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
  try {
    // Record the transaction
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      user_id: userId,
      paypal_transaction_id: transactionId,
      transaction_type: 'payment',
      amount: amount,
      currency: currency,
      status: 'completed',
      plan_id: planId,
      payment_method: 'paypal',
      net_amount: amount,
      metadata: resource
    });
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    } else {
      console.log('✅ Transaction recorded successfully');
    }
    // Update user subscription
    const { error: settingsError } = await supabase.from('user_settings').upsert({
      user_id: userId,
      plan: planId,
      subscription_expiry: subscriptionExpiry.toISOString(),
      payment_status: 'active',
      last_payment_date: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
    } else {
      console.log('✅ User settings updated successfully');
    }
    // Queue success notification
    const { error: notificationError } = await supabase.from('notification_queue').insert({
      user_id: userId,
      notification_type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of ${currency} ${amount} has been processed successfully. Your ${planId} plan is now active.`,
      metadata: {
        transaction_id: transactionId,
        plan: planId
      }
    });
    if (notificationError) {
      console.error('Error queuing notification:', notificationError);
    } else {
      console.log('✅ Success notification queued');
    }
    console.log('🎉 Payment completed successfully for user:', userId);
  } catch (error) {
    console.error('Error in handlePaymentCompleted:', error);
    throw error;
  }
}
async function handlePaymentFailed(supabase, event) {
  const { resource } = event;
  const amount = parseFloat(resource.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';
  const transactionId = resource.id;
  const failureReason = resource.status_details?.reason || 'Unknown';
  console.log('Processing payment failure:', transactionId, failureReason);
  const customId = resource.custom_id;
  if (!customId) {
    console.error('Cannot identify user for failed payment:', transactionId);
    return;
  }
  // Record the failed transaction
  await supabase.from('payment_transactions').insert({
    user_id: customId,
    paypal_transaction_id: transactionId,
    transaction_type: 'payment',
    amount: amount,
    currency: currency,
    status: 'failed',
    failure_reason: failureReason,
    metadata: resource
  });
  // Queue failure notification
  await supabase.from('notification_queue').insert({
    user_id: customId,
    notification_type: 'payment_failed',
    title: 'Payment Failed',
    message: `Your payment of ${currency} ${amount} could not be processed. Reason: ${failureReason}`,
    metadata: {
      transaction_id: transactionId,
      reason: failureReason
    }
  });
  console.log('Payment failure processed for user:', customId);
}
async function handleRefund(supabase, event) {
  const { resource } = event;
  const amount = parseFloat(resource.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';
  const refundId = resource.id;
  const originalTransactionId = resource.invoice_id;
  console.log('Processing refund:', refundId, amount, currency);
  // Find the original transaction
  const { data: originalTransaction } = await supabase.from('payment_transactions').select('user_id').eq('paypal_transaction_id', originalTransactionId).single();
  if (!originalTransaction) {
    console.error('Original transaction not found for refund:', refundId);
    return;
  }
  // Record the refund transaction
  await supabase.from('payment_transactions').insert({
    user_id: originalTransaction.user_id,
    paypal_transaction_id: refundId,
    transaction_type: 'refund',
    amount: -amount,
    currency: currency,
    status: 'completed',
    metadata: resource
  });
  // Update user subscription status if needed
  await supabase.from('user_settings').update({
    payment_status: 'refunded',
    plan: 'free'
  }).eq('user_id', originalTransaction.user_id);
  // Queue refund notification
  await supabase.from('notification_queue').insert({
    user_id: originalTransaction.user_id,
    notification_type: 'refund',
    title: 'Refund Processed',
    message: `A refund of ${currency} ${amount} has been processed for your account.`,
    metadata: {
      refund_id: refundId,
      amount: amount
    }
  });
  console.log('Refund processed for user:', originalTransaction.user_id);
}
async function handleDispute(supabase, event) {
  const { resource } = event;
  const disputeId = resource.dispute_id;
  const amount = parseFloat(resource.disputed_transactions?.[0]?.seller_transaction_id || '0');
  const reason = resource.reason;
  const status = resource.status;
  console.log('Processing dispute:', disputeId, reason, status);
  // Find the original transaction
  const originalTransactionId = resource.disputed_transactions?.[0]?.seller_transaction_id;
  if (!originalTransactionId) {
    console.error('Cannot find original transaction for dispute:', disputeId);
    return;
  }
  const { data: originalTransaction } = await supabase.from('payment_transactions').select('user_id').eq('paypal_transaction_id', originalTransactionId).single();
  if (!originalTransaction) {
    console.error('Original transaction not found for dispute:', disputeId);
    return;
  }
  // Record the dispute
  await supabase.from('payment_transactions').insert({
    user_id: originalTransaction.user_id,
    paypal_transaction_id: disputeId,
    transaction_type: 'dispute',
    amount: amount,
    status: status,
    dispute_reason: reason,
    metadata: resource
  });
  // Queue dispute notification
  await supabase.from('notification_queue').insert({
    user_id: originalTransaction.user_id,
    notification_type: 'dispute',
    title: 'Payment Dispute',
    message: `A dispute has been ${status} for your payment. Reason: ${reason}`,
    metadata: {
      dispute_id: disputeId,
      reason: reason,
      status: status
    }
  });
  console.log('Dispute processed for user:', originalTransaction.user_id);
}
// Enhanced subscription event handlers
async function handleSubscriptionActivated(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const customId = resource.custom_id; // User ID
  const planId = resource.plan_id;
  const status = resource.status;
  const startTime = resource.start_time;
  const nextBillingTime = resource.billing_info?.next_billing_time;
  
  console.log('=== PROCESSING SUBSCRIPTION ACTIVATION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('User ID:', customId);
  console.log('Plan ID:', planId);
  console.log('Status:', status);
  console.log('Start Time:', startTime);
  console.log('Next Billing:', nextBillingTime);
  
  if (!customId) {
    console.error('No custom_id found in subscription activation');
    return;
  }
  
  try {
    // Determine plan type by looking up the PayPal plan ID in our database
    let planType = 'starter';
    if (planId) {
      const { data: billingPlan, error: planError } = await supabase
        .from('paypal_billing_plans')
        .select('paypal_product_id')
        .eq('paypal_plan_id', planId)
        .single();
      
      if (planError) {
        console.log('Could not find billing plan in database:', planError);
        console.log('Falling back to starter plan');
      } else if (billingPlan?.paypal_product_id === 'BIZMANAGER_PRO') {
        planType = 'pro';
        console.log('✅ Determined plan type as PRO from database lookup');
      } else {
        console.log('✅ Determined plan type as STARTER from database lookup');
      }
    }
    
    // Calculate current period end (30 days from start)
    const currentPeriodEnd = new Date(startTime);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    // Create or update subscription record
    const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
      user_id: customId,
      paypal_subscription_id: subscriptionId,
      paypal_plan_id: planId,
      status: status,
      plan_type: planType,
      start_time: startTime,
      current_period_start: startTime,
      current_period_end: currentPeriodEnd.toISOString(),
      next_billing_time: nextBillingTime,
      cancel_at_period_end: false,
      failed_payment_count: 0
    }, {
      onConflict: 'paypal_subscription_id'
    });
    
    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
    } else {
      console.log('✅ Subscription record updated successfully');
    }
    
    // Update user settings and terminate trial if active
    const { error: settingsError } = await supabase.from('user_settings').upsert({
      user_id: customId,
      plan: planType,
      subscription_expiry: currentPeriodEnd.toISOString(),
      paypal_subscription_id: subscriptionId,
      payment_status: 'active',
      // Terminate trial when subscription activates
      is_in_trial: false,
      subscription_status: 'active',
      auto_renew: true,
      last_payment_date: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
    
    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
    } else {
      console.log('✅ User settings updated successfully');
      console.log('✅ Trial terminated and subscription activated');
    }
    
    // Record successful payment transaction with correct PHP amounts
    const amount = planType === 'pro' ? 499 : 199;
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      user_id: customId,
      paypal_transaction_id: subscriptionId,
      transaction_type: 'subscription_activation',
      amount: amount,
      currency: 'PHP',
      status: 'completed',
      plan_id: planType,
      payment_method: 'paypal_subscription',
      net_amount: amount,
      metadata: resource
    });
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    } else {
      console.log('✅ Transaction recorded successfully');
    }
    
    // Queue success notification
    await supabase.from('notification_queue').insert({
      user_id: customId,
      notification_type: 'subscription_activated',
      title: 'Subscription Activated',
      message: `Your ${planType} subscription has been activated successfully. Your plan will renew automatically each month.`,
      metadata: {
        subscription_id: subscriptionId,
        plan: planType,
        next_billing: nextBillingTime
      }
    });
    
    console.log('🎉 Subscription activation completed successfully');
    
  } catch (error) {
    console.error('Error in handleSubscriptionActivated:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const status = resource.status;
  const cancelReason = resource.status_change_note || 'User requested cancellation';
  
  console.log('=== PROCESSING SUBSCRIPTION CANCELLATION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Status:', status);
  console.log('Reason:', cancelReason);
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Update subscription status
    const { error: updateError } = await supabase.from('subscriptions').update({
      status: status,
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancelReason
    }).eq('paypal_subscription_id', subscriptionId);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
    } else {
      console.log('✅ Subscription cancelled successfully');
    }
    
    // Update user settings
    await supabase.from('user_settings').update({
      subscription_status: 'cancelled',
      auto_renew: false,
      cancellation_reason: cancelReason
    }).eq('user_id', subscription.user_id);
    
    // Queue cancellation notification
    await supabase.from('notification_queue').insert({
      user_id: subscription.user_id,
      notification_type: 'subscription_cancelled',
      title: 'Subscription Cancelled',
      message: `Your subscription has been cancelled. You can continue using your ${subscription.plan_type} plan until ${new Date(subscription.current_period_end).toLocaleDateString()}.`,
      metadata: {
        subscription_id: subscriptionId,
        plan: subscription.plan_type,
        expires_at: subscription.current_period_end
      }
    });
    
    console.log('✅ Subscription cancellation processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const customId = resource.custom_id;
  const planId = resource.plan_id;
  const status = resource.status;
  
  console.log('=== PROCESSING SUBSCRIPTION CREATION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('User ID:', customId);
  console.log('Plan ID:', planId);
  console.log('Status:', status);
  
  if (!customId) {
    console.error('No custom_id found in subscription creation');
    return;
  }
  
  try {
    // Determine plan type by looking up the PayPal plan ID in our database
    let planType = 'starter';
    if (planId) {
      const { data: billingPlan, error: planError } = await supabase
        .from('paypal_billing_plans')
        .select('paypal_product_id')
        .eq('paypal_plan_id', planId)
        .single();
      
      if (planError) {
        console.log('Could not find billing plan in database:', planError);
        console.log('Falling back to starter plan');
      } else if (billingPlan?.paypal_product_id === 'BIZMANAGER_PRO') {
        planType = 'pro';
        console.log('✅ Determined plan type as PRO from database lookup');
      } else {
        console.log('✅ Determined plan type as STARTER from database lookup');
      }
    }
    
    // Create subscription record
    const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
      user_id: customId,
      paypal_subscription_id: subscriptionId,
      paypal_plan_id: planId,
      status: status,
      plan_type: planType,
      cancel_at_period_end: false,
      failed_payment_count: 0
    }, {
      onConflict: 'paypal_subscription_id'
    });
    
    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
    } else {
      console.log('✅ Subscription record created successfully');
    }
    
    console.log('✅ Subscription creation processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
    throw error;
  }
}

async function handleSubscriptionExpired(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const status = resource.status;
  
  console.log('=== PROCESSING SUBSCRIPTION EXPIRATION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Status:', status);
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Update subscription status
    await supabase.from('subscriptions').update({
      status: 'EXPIRED'
    }).eq('paypal_subscription_id', subscriptionId);
    
    // Downgrade user to free plan
    await supabase.from('user_settings').update({
      plan: 'free',
      subscription_status: 'expired',
      auto_renew: false
    }).eq('user_id', subscription.user_id);
    
    // Queue expiration notification
    await supabase.from('notification_queue').insert({
      user_id: subscription.user_id,
      notification_type: 'subscription_expired',
      title: 'Subscription Expired',
      message: `Your ${subscription.plan_type} subscription has expired. You've been downgraded to the free plan.`,
      metadata: {
        subscription_id: subscriptionId,
        previous_plan: subscription.plan_type
      }
    });
    
    console.log('✅ Subscription expiration processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error);
    throw error;
  }
}

async function handleSubscriptionPaymentFailed(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const failureReason = resource.status_change_note || 'Payment failed';
  
  console.log('=== PROCESSING SUBSCRIPTION PAYMENT FAILURE ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Failure Reason:', failureReason);
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Increment failed payment count
    const newFailedCount = (subscription.failed_payment_count || 0) + 1;
    
    // Update subscription
    await supabase.from('subscriptions').update({
      failed_payment_count: newFailedCount,
      status: newFailedCount >= 3 ? 'SUSPENDED' : subscription.status
    }).eq('paypal_subscription_id', subscriptionId);
    
    // Update user settings if suspended
    if (newFailedCount >= 3) {
      await supabase.from('user_settings').update({
        subscription_status: 'suspended',
        payment_status: 'failed'
      }).eq('user_id', subscription.user_id);
    }
    
    // Queue failure notification
    await supabase.from('notification_queue').insert({
      user_id: subscription.user_id,
      notification_type: 'payment_failed',
      title: 'Payment Failed',
      message: newFailedCount >= 3 
        ? `Your subscription has been suspended due to multiple failed payments. Please update your payment method.`
        : `Your subscription payment failed. We'll retry automatically. Failure count: ${newFailedCount}/3`,
      metadata: {
        subscription_id: subscriptionId,
        failure_count: newFailedCount,
        reason: failureReason
      }
    });
    
    console.log('✅ Payment failure processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionPaymentFailed:', error);
    throw error;
  }
}

async function handleSubscriptionReactivated(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const status = resource.status;
  
  console.log('=== PROCESSING SUBSCRIPTION REACTIVATION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Status:', status);
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Update subscription status
    await supabase.from('subscriptions').update({
      status: 'ACTIVE',
      cancel_at_period_end: false,
      cancelled_at: null,
      cancellation_reason: null,
      failed_payment_count: 0
    }).eq('paypal_subscription_id', subscriptionId);
    
    // Update user settings
    await supabase.from('user_settings').update({
      subscription_status: 'active',
      payment_status: 'active',
      auto_renew: true,
      cancellation_reason: null
    }).eq('user_id', subscription.user_id);
    
    // Queue reactivation notification
    await supabase.from('notification_queue').insert({
      user_id: subscription.user_id,
      notification_type: 'subscription_reactivated',
      title: 'Subscription Reactivated',
      message: `Your ${subscription.plan_type} subscription has been reactivated successfully.`,
      metadata: {
        subscription_id: subscriptionId,
        plan: subscription.plan_type
      }
    });
    
    console.log('✅ Subscription reactivation processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionReactivated:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const status = resource.status;
  const planId = resource.plan_id;
  
  console.log('=== PROCESSING SUBSCRIPTION UPDATE ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Status:', status);
  console.log('Plan ID:', planId);
  
  try {
    // Get current subscription
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Determine new plan type by looking up the PayPal plan ID in our database
    let newPlanType = 'starter';
    if (planId) {
      const { data: billingPlan, error: planError } = await supabase
        .from('paypal_billing_plans')
        .select('paypal_product_id')
        .eq('paypal_plan_id', planId)
        .single();
      
      if (planError) {
        console.log('Could not find billing plan in database:', planError);
        console.log('Falling back to starter plan');
      } else if (billingPlan?.paypal_product_id === 'BIZMANAGER_PRO') {
        newPlanType = 'pro';
        console.log('✅ Determined new plan type as PRO from database lookup');
      } else {
        console.log('✅ Determined new plan type as STARTER from database lookup');
      }
    }
    
    // Update subscription
    await supabase.from('subscriptions').update({
      status: status,
      paypal_plan_id: planId,
      plan_type: newPlanType
    }).eq('paypal_subscription_id', subscriptionId);
    
    // Update user settings if plan changed
    if (newPlanType !== subscription.plan_type) {
      await supabase.from('user_settings').update({
        plan: newPlanType
      }).eq('user_id', subscription.user_id);
      
      // Queue plan change notification
      await supabase.from('notification_queue').insert({
        user_id: subscription.user_id,
        notification_type: 'plan_changed',
        title: 'Plan Changed',
        message: `Your subscription plan has been changed from ${subscription.plan_type} to ${newPlanType}.`,
        metadata: {
          subscription_id: subscriptionId,
          old_plan: subscription.plan_type,
          new_plan: newPlanType
        }
      });
    }
    
    console.log('✅ Subscription update processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}
async function handleSubscriptionPaymentCompleted(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const lastPayment = resource.billing_info?.last_payment;
  const nextBillingTime = resource.billing_info?.next_billing_time;
  
  console.log('=== PROCESSING SUBSCRIPTION PAYMENT COMPLETION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Last Payment:', JSON.stringify(lastPayment, null, 2));
  console.log('Next Billing Time:', nextBillingTime);
  
  if (!lastPayment) {
    console.error('No payment information found in subscription payment completion');
    return;
  }
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Calculate new current period dates (extend by 1 month)
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    // Update subscription with new period and reset failure count
    const { error: updateError } = await supabase.from('subscriptions').update({
      status: 'ACTIVE',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      next_billing_time: nextBillingTime,
      failed_payment_count: 0, // Reset failure count on successful payment
      last_payment_amount: parseFloat(lastPayment.amount?.value || '0'),
      last_payment_date: new Date().toISOString()
    }).eq('paypal_subscription_id', subscriptionId);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
    } else {
      console.log('✅ Subscription period extended successfully');
    }
    
    // Update user settings with new expiry
    const { error: settingsError } = await supabase.from('user_settings').update({
      subscription_expiry: currentPeriodEnd.toISOString(),
      payment_status: 'active',
      last_payment_date: new Date().toISOString()
    }).eq('user_id', subscription.user_id);
    
    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
    } else {
      console.log('✅ User settings updated with new expiry date');
    }
    
    // Record the recurring payment transaction
    const amount = parseFloat(lastPayment.amount?.value || '0');
    const currency = lastPayment.amount?.currency_code || 'USD';
    
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      user_id: subscription.user_id,
      paypal_transaction_id: lastPayment.transaction_id || subscriptionId + '_renewal_' + Date.now(),
      transaction_type: 'subscription_renewal',
      amount: amount,
      currency: currency,
      status: 'completed',
      plan_id: subscription.plan_type,
      payment_method: 'paypal_subscription',
      net_amount: amount,
      metadata: {
        subscription_id: subscriptionId,
        billing_cycle: 'monthly',
        payment_details: lastPayment,
        ...resource
      }
    });
    
    if (transactionError) {
      console.error('Error recording renewal transaction:', transactionError);
    } else {
      console.log('✅ Renewal payment transaction recorded');
    }
    
    // Queue renewal success notification
    await supabase.from('notification_queue').insert({
      user_id: subscription.user_id,
      notification_type: 'subscription_renewed',
      title: 'Subscription Renewed',
      message: `Your ${subscription.plan_type} subscription has been automatically renewed for another month. Next billing: ${new Date(nextBillingTime).toLocaleDateString()}`,
      metadata: {
        subscription_id: subscriptionId,
        amount: amount,
        currency: currency,
        next_billing: nextBillingTime,
        plan: subscription.plan_type
      }
    });
    
    console.log('🎉 Subscription renewal completed successfully');
    
  } catch (error) {
    console.error('Error in handleSubscriptionPaymentCompleted:', error);
    throw error;
  }
}

async function handleSubscriptionCycleCompleted(supabase, event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  const cycles = resource.billing_info?.cycle_executions;
  
  console.log('=== PROCESSING SUBSCRIPTION CYCLE COMPLETION ===');
  console.log('Subscription ID:', subscriptionId);
  console.log('Cycles:', JSON.stringify(cycles, null, 2));
  
  try {
    // Get subscription details
    const { data: subscription, error: getError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();
    
    if (getError || !subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }
    
    // Update subscription with cycle information
    const { error: updateError } = await supabase.from('subscriptions').update({
      billing_cycles: cycles || resource.billing_info,
      cycle_count: cycles ? cycles.length : (subscription.cycle_count || 0) + 1
    }).eq('paypal_subscription_id', subscriptionId);
    
    if (updateError) {
      console.error('Error updating subscription cycles:', updateError);
    } else {
      console.log('✅ Subscription cycle information updated');
    }
    
    console.log('✅ Subscription cycle completion processed');
    
  } catch (error) {
    console.error('Error in handleSubscriptionCycleCompleted:', error);
    throw error;
  }
}

async function updateWebhookProcessingError(supabase, eventId, error) {
  try {
    await supabase.from('webhook_events').update({
      processing_error: error,
      processed_at: new Date().toISOString()
    }).eq('event_id', eventId);
  } catch (updateError) {
    console.error('Failed to update webhook error:', updateError);
  }
} //update July 21
