import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log('=== RETRY SUBSCRIPTION PAYMENT REQUEST ===');
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
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api.sandbox.paypal.com';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:');
    console.log('- PAYPAL_CLIENT_ID:', PAYPAL_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('- PAYPAL_CLIENT_SECRET:', PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('- PAYPAL_BASE_URL:', PAYPAL_BASE_URL);
    console.log('- SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');

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

    console.log('Retry payment for subscription:', subscription_id);
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

    const subscriptionData = await subscriptionResponse.json();
    console.log('Subscription status:', subscriptionData.status);

    // Check if subscription allows retries
    if (subscriptionData.status === 'CANCELLED' || subscriptionData.status === 'EXPIRED') {
      throw new Error('Cannot retry payments for cancelled or expired subscriptions');
    }

    // Attempt to reactivate if suspended
    if (subscriptionData.status === 'SUSPENDED') {
      console.log('Attempting to reactivate suspended subscription...');
      
      const reactivateResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscription_id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'User requested payment retry after updating payment method'
        })
      });

      if (!reactivateResponse.ok) {
        const errorText = await reactivateResponse.text();
        console.error('Failed to reactivate subscription:', reactivateResponse.status, errorText);
        throw new Error(`Failed to reactivate subscription: ${errorText}`);
      }

      console.log('✅ Subscription reactivation requested');
    }

    // Log the retry attempt in our database
    const { error: logError } = await supabase.from('payment_retry_attempts').insert({
      user_id: user_id,
      paypal_subscription_id: subscription_id,
      retry_reason: 'user_initiated',
      retry_method: 'reactivation',
      paypal_response: subscriptionData
    });

    if (logError) {
      console.error('Error logging retry attempt:', logError);
    }

    // Update local subscription status
    const { error: updateError } = await supabase.from('subscriptions').update({
      retry_attempted_at: new Date().toISOString(),
      status: subscriptionData.status === 'SUSPENDED' ? 'ACTIVE' : subscriptionData.status
    }).eq('paypal_subscription_id', subscription_id);

    if (updateError) {
      console.error('Error updating local subscription:', updateError);
    }

    console.log('=== PAYMENT RETRY COMPLETE ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment retry initiated successfully',
      subscription_status: subscriptionData.status,
      retry_attempted: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('=== RETRY PAYMENT ERROR ===');
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