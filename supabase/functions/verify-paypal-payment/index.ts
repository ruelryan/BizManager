import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { paymentId, payerId, planId } = await req.json()

    // PayPal API configuration
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api.paypal.com' // Use sandbox for testing

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured')
    }

    // Get PayPal access token
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Verify the payment with PayPal
    const paymentResponse = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payment/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const paymentData = await paymentResponse.json()

    // Check if payment is completed
    if (paymentData.state === 'approved') {
      // Payment is valid, update user subscription in your database
      // You would typically update the user's plan in Supabase here
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified successfully',
          paymentData: {
            id: paymentData.id,
            state: paymentData.state,
            amount: paymentData.transactions[0].amount,
            planId: planId
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment not approved',
          state: paymentData.state
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

  } catch (error) {
    console.error('PayPal verification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Payment verification failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})