import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get userId from URL params or body
    const url = new URL(req.url);
    let userId = url.searchParams.get('userId');
    
    if (!userId && req.method === 'POST') {
      const body = await req.json();
      userId = body.userId;
    }
    
    // Default to the specific user if no userId provided
    if (!userId) {
      userId = 'da1ac1cf-cd62-4ceb-8d3f-7748bd310730';
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Fixing subscription state for user:', userId);

    // Terminate trial and activate subscription
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        is_in_trial: false,
        subscription_status: 'active',
        payment_status: 'active',
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (settingsError) {
      console.error('Error updating user settings:', settingsError);
      throw settingsError;
    }

    // Check if subscription record exists
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking subscription:', subError);
    }

    // Get updated user settings
    const { data: updatedSettings, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated settings:', fetchError);
      throw fetchError;
    }

    console.log('✅ Subscription state fixed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription state fixed successfully',
      userSettings: updatedSettings,
      subscription: subscription
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fix-subscription-state:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});