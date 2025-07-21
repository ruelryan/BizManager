import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log('=== MANUAL SUBSCRIPTION FIX REQUEST ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { user_id, plan_type, paypal_subscription_id } = await req.json();
    
    if (!user_id || !plan_type || !paypal_subscription_id) {
      throw new Error('Missing required fields: user_id, plan_type, paypal_subscription_id');
    }

    // Get the correct PayPal plan ID based on plan type
    const paypalProductId = plan_type === 'starter' ? 'BIZMANAGER_STARTER' : 'BIZMANAGER_PRO';
    
    const { data: planData, error: planError } = await supabase
      .from('paypal_billing_plans')
      .select('paypal_plan_id')
      .eq('paypal_product_id', paypalProductId)
      .eq('status', 'ACTIVE')
      .single();

    if (planError || !planData) {
      throw new Error(`Could not find PayPal plan for ${plan_type}`);
    }

    // Create subscription with current date as period start
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscriptionData = {
      user_id,
      paypal_subscription_id,
      paypal_plan_id: planData.paypal_plan_id,
      status: 'ACTIVE',
      plan_type,
      start_time: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      next_billing_time: nextMonth.toISOString(),
      cancel_at_period_end: false,
      failed_payment_count: 0
    };

    // Try to update existing subscription first, otherwise insert
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', paypal_subscription_id)
      .single();

    let newSubscription;
    let insertError;

    if (existingSubscription) {
      console.log('Updating existing subscription:', existingSubscription.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_type,
          paypal_plan_id: planData.paypal_plan_id,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          next_billing_time: nextMonth.toISOString(),
          status: 'ACTIVE'
        })
        .eq('paypal_subscription_id', paypal_subscription_id)
        .select()
        .single();
      
      newSubscription = data;
      insertError = error;
    } else {
      console.log('Creating new subscription');
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      newSubscription = data;
      insertError = error;
    }

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to create subscription: ${insertError.message}`);
    }

    // Also update user settings to reflect the new plan
    await supabase
      .from('user_settings')
      .upsert({
        user_id,
        subscription_plan: plan_type,
        subscription_status: 'active',
        updated_at: now.toISOString()
      });

    console.log('✅ Subscription created successfully:', newSubscription);

    return new Response(JSON.stringify({
      success: true,
      subscription: newSubscription,
      message: `Successfully created ${plan_type} subscription`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Manual subscription fix error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});