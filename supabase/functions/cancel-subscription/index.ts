import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log('=== CANCEL SUBSCRIPTION REQUEST ===');
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

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get request body
    const { subscriptionId, reason } = await req.json();
    
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'Subscription ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log('Cancelling subscription:', subscriptionId);
    console.log('Reason:', reason);

    // Get PayPal access token
    console.log('=== GETTING PAYPAL ACCESS TOKEN ===');
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

    // Cancel the subscription with PayPal
    console.log('=== CANCELLING PAYPAL SUBSCRIPTION ===');
    const cancelResponse = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reason: reason || 'User requested cancellation'
        })
      }
    );

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error('Failed to cancel PayPal subscription:', cancelResponse.status, errorText);
      
      // Try to parse the error response for more details
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.message || errorJson.error_description || errorText;
      } catch (e) {
        // Keep original error text if parsing fails
      }
      
      throw new Error(`PayPal cancellation failed: ${errorDetails}`);
    }

    console.log('✅ PayPal subscription cancelled successfully');

    // Update subscription status in database
    console.log('=== UPDATING DATABASE ===');
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'User requested cancellation'
      })
      .eq('paypal_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Database updated successfully');

    // Get subscription details for user settings update
    const { data: subscriptionData, error: getError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type, current_period_end')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (getError) {
      console.error('Error fetching subscription details:', getError);
    } else {
      // Update user settings
      await supabase
        .from('user_settings')
        .update({
          subscription_status: 'cancelled',
          auto_renew: false,
          cancellation_reason: reason || 'User requested cancellation'
        })
        .eq('user_id', subscriptionData.user_id);

      console.log('✅ User settings updated successfully');

      // Queue cancellation notification
      await supabase
        .from('notification_queue')
        .insert({
          user_id: subscriptionData.user_id,
          notification_type: 'subscription_cancelled',
          title: 'Subscription Cancelled',
          message: `Your subscription has been cancelled. You can continue using your ${subscriptionData.plan_type} plan until ${subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end).toLocaleDateString() : 'the end of your current period'}.`,
          metadata: {
            subscription_id: subscriptionId,
            plan: subscriptionData.plan_type,
            expires_at: subscriptionData.current_period_end,
            reason: reason
          }
        });

      console.log('✅ Notification queued successfully');
    }

    console.log('=== SUBSCRIPTION CANCELLATION COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription_id: subscriptionId,
      cancelled_at: new Date().toISOString(),
      reason: reason || 'User requested cancellation'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('=== SUBSCRIPTION CANCELLATION ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});