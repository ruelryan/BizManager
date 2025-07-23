import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log('=== SYNC PAYPAL SUBSCRIPTION REQUEST ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Get environment variables
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api.paypal.com';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:');
    console.log('- PAYPAL_CLIENT_ID:', PAYPAL_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('- PAYPAL_CLIENT_SECRET:', PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('- PAYPAL_BASE_URL:', PAYPAL_BASE_URL);

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get request body
    const { subscription_id, user_id } = await req.json();
    
    if (!subscription_id || !user_id) {
      throw new Error('Missing subscription_id or user_id');
    }

    console.log('Syncing subscription:', subscription_id);
    console.log('User ID:', user_id);

    // Get PayPal access token
    console.log('Getting PayPal access token...');
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Failed to get PayPal access token:', authResponse.status, errorText);
      throw new Error(`PayPal authentication failed: ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('✅ PayPal access token obtained');

    // Get subscription details from PayPal
    console.log('Getting subscription details from PayPal...');
    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscription_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error('Failed to get subscription details:', subscriptionResponse.status, errorText);
      throw new Error(`Failed to get subscription details: ${errorText}`);
    }

    const paypalSubscription = await subscriptionResponse.json();
    console.log('PayPal subscription status:', paypalSubscription.status);
    console.log('Billing info:', JSON.stringify(paypalSubscription.billing_info, null, 2));

    // Determine plan type from PayPal plan ID
    let planType = 'starter';
    if (paypalSubscription.plan_id && paypalSubscription.plan_id.includes('PRO')) {
      planType = 'pro';
    }

    // Calculate current period dates
    let currentPeriodStart = paypalSubscription.start_time;
    let currentPeriodEnd = paypalSubscription.billing_info?.next_billing_time;
    
    // If next billing time is available, calculate current period end
    if (currentPeriodEnd) {
      const nextBilling = new Date(currentPeriodEnd);
      const periodEnd = new Date(nextBilling);
      // Subtract 1 day to get period end
      periodEnd.setDate(periodEnd.getDate() - 1);
      periodEnd.setHours(23, 59, 59, 999);
      currentPeriodEnd = periodEnd.toISOString();
      
      // Calculate period start (1 month before end)
      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setDate(periodStart.getDate() + 1);
      periodStart.setHours(0, 0, 0, 0);
      currentPeriodStart = periodStart.toISOString();
    }

    // Update local subscription record
    const subscriptionUpdate = {
      status: paypalSubscription.status,
      plan_type: planType,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      next_billing_time: paypalSubscription.billing_info?.next_billing_time,
      failed_payment_count: paypalSubscription.billing_info?.failed_payments_count || 0,
      last_payment_amount: paypalSubscription.billing_info?.last_payment?.amount?.value ? 
        parseFloat(paypalSubscription.billing_info.last_payment.amount.value) : null,
      last_payment_date: paypalSubscription.billing_info?.last_payment?.time || null,
      billing_cycles: paypalSubscription.billing_info?.cycle_executions || null,
      cycle_count: paypalSubscription.billing_info?.cycle_executions?.length || null,
      cancel_at_period_end: paypalSubscription.status === 'CANCELLED',
      cancelled_at: paypalSubscription.status === 'CANCELLED' ? new Date().toISOString() : null,
      synced_at: new Date().toISOString()
    };

    console.log('Updating local subscription with:', JSON.stringify(subscriptionUpdate, null, 2));

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update(subscriptionUpdate)
      .eq('paypal_subscription_id', subscription_id);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('✅ Subscription record updated successfully');

    // Update user settings as well
    const userSettingsUpdate = {
      plan: planType,
      subscription_expiry: currentPeriodEnd,
      payment_status: paypalSubscription.status === 'ACTIVE' ? 'active' : 
                     paypalSubscription.status === 'SUSPENDED' ? 'failed' : 'cancelled',
      subscription_status: paypalSubscription.status.toLowerCase(),
      auto_renew: paypalSubscription.status === 'ACTIVE' && !paypalSubscription.cancel_at_period_end,
      last_payment_date: paypalSubscription.billing_info?.last_payment?.time || null,
      synced_at: new Date().toISOString()
    };

    const { error: settingsError } = await supabase
      .from('user_settings')
      .update(userSettingsUpdate)
      .eq('user_id', user_id);

    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
    } else {
      console.log('✅ User settings updated successfully');
    }

    // Log the sync operation
    const { error: logError } = await supabase.from('sync_operations').insert({
      user_id: user_id,
      operation_type: 'paypal_subscription_sync',
      paypal_subscription_id: subscription_id,
      sync_result: 'success',
      paypal_data: paypalSubscription,
      local_updates: {
        subscription: subscriptionUpdate,
        user_settings: userSettingsUpdate
      }
    });

    if (logError) {
      console.error('Error logging sync operation:', logError);
    }

    console.log('=== SUBSCRIPTION SYNC COMPLETE ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription synced successfully',
      subscription: paypalSubscription,
      local_updates: subscriptionUpdate,
      sync_timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('=== SUBSCRIPTION SYNC ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});