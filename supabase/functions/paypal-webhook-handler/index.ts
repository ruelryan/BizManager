import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paypal-transmission-id, x-paypal-cert-id, x-paypal-auth-algo, x-paypal-transmission-sig, x-paypal-transmission-time',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: any;
  summary: string;
  create_time: string;
  event_version: string;
}

interface PayPalHeaders {
  'x-paypal-transmission-id': string;
  'x-paypal-cert-id': string;
  'x-paypal-auth-algo': string;
  'x-paypal-transmission-sig': string;
  'x-paypal-transmission-time': string;
}

Deno.serve(async (req) => {
  console.log('=== WEBHOOK REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
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

    let webhookEvent: WebhookEvent;
    try {
      webhookEvent = JSON.parse(webhookBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      throw new Error('Invalid JSON in webhook body');
    }

    // Extract PayPal headers for verification
    const paypalHeaders: PayPalHeaders = {
      'x-paypal-transmission-id': req.headers.get('x-paypal-transmission-id') || '',
      'x-paypal-cert-id': req.headers.get('x-paypal-cert-id') || '',
      'x-paypal-auth-algo': req.headers.get('x-paypal-auth-algo') || '',
      'x-paypal-transmission-sig': req.headers.get('x-paypal-transmission-sig') || '',
      'x-paypal-transmission-time': req.headers.get('x-paypal-transmission-time') || '',
    };

    console.log('=== WEBHOOK EVENT DETAILS ===');
    console.log('Event ID:', webhookEvent.id);
    console.log('Event Type:', webhookEvent.event_type);
    console.log('Resource Type:', webhookEvent.resource_type);
    console.log('PayPal Headers:', paypalHeaders);

    // Check for duplicate events (idempotency)
    const { data: existingEvent, error: existingEventError } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', webhookEvent.id)
      .single();

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
      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({
          event_id: webhookEvent.id,
          event_type: webhookEvent.event_type,
          resource_type: webhookEvent.resource_type,
          resource_id: webhookEvent.resource?.id || null,
          payload: webhookEvent,
          processed: false,
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
      
      isValid = await verifyWebhookSignature(
        webhookBody,
        paypalHeaders,
        PAYPAL_WEBHOOK_ID,
        PAYPAL_CLIENT_ID,
        PAYPAL_CLIENT_SECRET,
        PAYPAL_BASE_URL
      );

      console.log('Signature verification result:', isValid);

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        await updateWebhookProcessingError(supabase, webhookEvent.id, 'Invalid webhook signature');
        return new Response('Invalid signature', { 
          status: 401, 
          headers: corsHeaders 
        });
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

    // Mark event as processed
    const { error: updateError } = await supabase
      .from('webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('event_id', webhookEvent.id);

    if (updateError) {
      console.error('Error marking event as processed:', updateError);
    } else {
      console.log('Event marked as processed successfully');
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    console.log('Event ID:', webhookEvent.id, 'processed successfully');

    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(`Webhook processing failed: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function verifyWebhookSignature(
  webhookBody: string,
  headers: PayPalHeaders,
  webhookId: string,
  clientId: string,
  clientSecret: string,
  baseUrl: string
): Promise<boolean> {
  try {
    console.log('Getting PayPal access token from:', baseUrl);
    
    // Get PayPal access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
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
    console.log('Verifying webhook signature...');
    const verificationPayload = {
      auth_algo: headers['x-paypal-auth-algo'],
      cert_id: headers['x-paypal-cert-id'],
      transmission_id: headers['x-paypal-transmission-id'],
      transmission_sig: headers['x-paypal-transmission-sig'],
      transmission_time: headers['x-paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(webhookBody),
    };

    console.log('Verification payload summary:');
    console.log('- auth_algo:', verificationPayload.auth_algo);
    console.log('- cert_id:', verificationPayload.cert_id);
    console.log('- transmission_id:', verificationPayload.transmission_id);
    console.log('- webhook_id:', verificationPayload.webhook_id);

    const verificationResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationPayload),
    });

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('Webhook verification failed:', verificationResponse.status, errorText);
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

async function processWebhookEvent(supabase: any, event: WebhookEvent): Promise<void> {
  const { event_type, resource } = event;

  console.log('Processing event type:', event_type);
  console.log('Resource details:', JSON.stringify(resource, null, 2));

  switch (event_type) {
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

    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await handleSubscriptionPaymentFailed(supabase, event);
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

async function handlePaymentCompleted(supabase: any, event: WebhookEvent): Promise<void> {
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
    await supabase
      .from('payment_transactions')
      .insert({
        paypal_transaction_id: transactionId,
        transaction_type: 'payment',
        amount: amount,
        currency: currency,
        status: 'completed',
        metadata: resource,
      });
    console.log('Created anonymous transaction record');
    return;
  }

  // Determine plan based on amount (convert USD to PHP for comparison)
  let planId = 'free';
  const phpAmount = amount * 56; // Approximate USD to PHP conversion
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
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        paypal_transaction_id: transactionId,
        transaction_type: 'payment',
        amount: amount,
        currency: currency,
        status: 'completed',
        plan_id: planId,
        payment_method: 'paypal',
        net_amount: amount, // You might want to calculate fees
        metadata: resource,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    } else {
      console.log('✅ Transaction recorded successfully');
    }

    // Update user subscription
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        plan: planId,
        subscription_expiry: subscriptionExpiry.toISOString(),
        payment_status: 'active',
        last_payment_date: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
    } else {
      console.log('✅ User settings updated successfully');
    }

    // Queue success notification
    const { error: notificationError } = await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        notification_type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of ${currency} ${amount} has been processed successfully. Your ${planId} plan is now active.`,
        metadata: { transaction_id: transactionId, plan: planId },
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

async function handlePaymentFailed(supabase: any, event: WebhookEvent): Promise<void> {
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
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: customId,
      paypal_transaction_id: transactionId,
      transaction_type: 'payment',
      amount: amount,
      currency: currency,
      status: 'failed',
      failure_reason: failureReason,
      metadata: resource,
    });

  // Queue failure notification
  await supabase
    .from('notification_queue')
    .insert({
      user_id: customId,
      notification_type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of ${currency} ${amount} could not be processed. Reason: ${failureReason}`,
      metadata: { transaction_id: transactionId, reason: failureReason },
    });

  console.log('Payment failure processed for user:', customId);
}

async function handleRefund(supabase: any, event: WebhookEvent): Promise<void> {
  const { resource } = event;
  const amount = parseFloat(resource.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';
  const refundId = resource.id;
  const originalTransactionId = resource.invoice_id;

  console.log('Processing refund:', refundId, amount, currency);

  // Find the original transaction
  const { data: originalTransaction } = await supabase
    .from('payment_transactions')
    .select('user_id')
    .eq('paypal_transaction_id', originalTransactionId)
    .single();

  if (!originalTransaction) {
    console.error('Original transaction not found for refund:', refundId);
    return;
  }

  // Record the refund transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: originalTransaction.user_id,
      paypal_transaction_id: refundId,
      transaction_type: 'refund',
      amount: -amount, // Negative amount for refund
      currency: currency,
      status: 'completed',
      metadata: resource,
    });

  // Update user subscription status if needed
  await supabase
    .from('user_settings')
    .update({
      payment_status: 'refunded',
      plan: 'free', // Downgrade to free plan
    })
    .eq('user_id', originalTransaction.user_id);

  // Queue refund notification
  await supabase
    .from('notification_queue')
    .insert({
      user_id: originalTransaction.user_id,
      notification_type: 'refund',
      title: 'Refund Processed',
      message: `A refund of ${currency} ${amount} has been processed for your account.`,
      metadata: { refund_id: refundId, amount: amount },
    });

  console.log('Refund processed for user:', originalTransaction.user_id);
}

async function handleDispute(supabase: any, event: WebhookEvent): Promise<void> {
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

  const { data: originalTransaction } = await supabase
    .from('payment_transactions')
    .select('user_id')
    .eq('paypal_transaction_id', originalTransactionId)
    .single();

  if (!originalTransaction) {
    console.error('Original transaction not found for dispute:', disputeId);
    return;
  }

  // Record the dispute
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: originalTransaction.user_id,
      paypal_transaction_id: disputeId,
      transaction_type: 'dispute',
      amount: amount,
      status: status,
      dispute_reason: reason,
      metadata: resource,
    });

  // Queue dispute notification
  await supabase
    .from('notification_queue')
    .insert({
      user_id: originalTransaction.user_id,
      notification_type: 'dispute',
      title: 'Payment Dispute',
      message: `A dispute has been ${status} for your payment. Reason: ${reason}`,
      metadata: { dispute_id: disputeId, reason: reason, status: status },
    });

  console.log('Dispute processed for user:', originalTransaction.user_id);
}

// Subscription event handlers (simplified for now)
async function handleSubscriptionActivated(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription activated:', event.resource?.id);
}

async function handleSubscriptionCancelled(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription cancelled:', event.resource?.id);
}

async function handleSubscriptionCreated(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription created:', event.resource?.id);
}

async function handleSubscriptionExpired(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription expired:', event.resource?.id);
}

async function handleSubscriptionPaymentFailed(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription payment failed:', event.resource?.id);
}

async function handleSubscriptionReactivated(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription reactivated:', event.resource?.id);
}

async function handleSubscriptionUpdated(supabase: any, event: WebhookEvent): Promise<void> {
  console.log('Subscription updated:', event.resource?.id);
}

async function updateWebhookProcessingError(supabase: any, eventId: string, error: string): Promise<void> {
  try {
    await supabase
      .from('webhook_events')
      .update({
        processing_error: error,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);
  } catch (updateError) {
    console.error('Failed to update webhook error:', updateError);
  }
} //gibag-o