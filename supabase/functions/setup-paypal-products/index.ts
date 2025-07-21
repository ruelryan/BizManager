import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  image_url?: string;
  home_url?: string;
}

interface PayPalBillingPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
  billing_cycles: any[];
  payment_preferences: any;
  taxes: any;
}

Deno.serve(async (req) => {
  console.log('=== PAYPAL PRODUCTS SETUP REQUEST ===');
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

    // Create or update PayPal products
    console.log('=== CREATING PAYPAL PRODUCTS ===');
    const products = [
      {
        id: 'BIZMANAGER_STARTER',
        name: 'BizManager Starter Plan',
        description: 'Unlimited products & basic reports for growing businesses',
        type: 'SERVICE',
        category: 'SOFTWARE',
        image_url: 'https://your-domain.com/starter-plan.png',
        home_url: 'https://your-domain.com'
      },
      {
        id: 'BIZMANAGER_PRO',
        name: 'BizManager Pro Plan',
        description: 'All features including PDF invoices & advanced analytics',
        type: 'SERVICE',
        category: 'SOFTWARE',
        image_url: 'https://your-domain.com/pro-plan.png',
        home_url: 'https://your-domain.com'
      }
    ];

    const createdProducts: PayPalProduct[] = [];

    for (const productData of products) {
      console.log(`Creating product: ${productData.name}`);
      
      const productResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(productData)
      });

      if (productResponse.ok) {
        const product = await productResponse.json();
        createdProducts.push(product);
        console.log(`✅ Product created: ${product.id}`);
        
        // Store in database
        const { data: productInsertData, error: productInsertError } = await supabase.from('paypal_products').upsert({
          paypal_product_id: product.id,
          name: product.name,
          description: product.description,
          category: product.category
        });
        
        if (productInsertError) {
          console.error('❌ Database insert error for product:', productInsertError);
          throw new Error(`Failed to store product in database: ${productInsertError.message}`);
        } else {
          console.log('✅ Product stored in database:', productInsertData);
        }
      } else {
        const errorText = await productResponse.text();
        console.error(`Failed to create product ${productData.id}:`, errorText);
        
        // Try to get existing product
        const getProductResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products/${productData.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (getProductResponse.ok) {
          const existingProduct = await getProductResponse.json();
          createdProducts.push(existingProduct);
          console.log(`✅ Using existing product: ${existingProduct.id}`);
        } else {
          console.error(`Failed to get existing product ${productData.id}`);
        }
      }
    }

    // Create billing plans
    console.log('=== CREATING BILLING PLANS ===');
    const billingPlans = [
      {
        product_id: 'BIZMANAGER_STARTER',
        name: 'BizManager Starter Monthly',
        description: 'Monthly billing for BizManager Starter Plan',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // 0 means infinite
            pricing_scheme: {
              fixed_price: {
                value: '3.99', // $3.99 USD (₱199 PHP converted)
                currency_code: 'USD'
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: 'USD'
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: '0',
          inclusive: false
        }
      },
      {
        product_id: 'BIZMANAGER_PRO',
        name: 'BizManager Pro Monthly',
        description: 'Monthly billing for BizManager Pro Plan',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // 0 means infinite
            pricing_scheme: {
              fixed_price: {
                value: '9.99', // $9.99 USD (₱499 PHP converted)
                currency_code: 'USD'
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: 'USD'
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: '0',
          inclusive: false
        }
      }
    ];

    const createdPlans: PayPalBillingPlan[] = [];

    for (const planData of billingPlans) {
      console.log(`Creating billing plan: ${planData.name}`);
      
      const planResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(planData)
      });

      if (planResponse.ok) {
        const plan = await planResponse.json();
        createdPlans.push(plan);
        console.log(`✅ Billing plan created: ${plan.id}`);
        
        // Store in database
        const { data: insertData, error: insertError } = await supabase.from('paypal_billing_plans').upsert({
          paypal_plan_id: plan.id,
          paypal_product_id: planData.product_id,
          name: plan.name,
          description: plan.description,
          status: plan.status,
          billing_cycles: plan.billing_cycles || planData.billing_cycles, // Use the billing_cycles from our request data
          payment_preferences: plan.payment_preferences || planData.payment_preferences
        });
        
        if (insertError) {
          console.error('❌ Database insert error for billing plan:', insertError);
          throw new Error(`Failed to store billing plan in database: ${insertError.message}`);
        } else {
          console.log('✅ Billing plan stored in database:', insertData);
        }
      } else {
        const errorText = await planResponse.text();
        console.error(`Failed to create billing plan ${planData.name}:`, errorText);
      }
    }

    console.log('=== SETUP COMPLETE ===');
    console.log(`Created ${createdProducts.length} products and ${createdPlans.length} billing plans`);

    return new Response(JSON.stringify({
      success: true,
      products: createdProducts,
      plans: createdPlans,
      message: `Successfully set up ${createdProducts.length} products and ${createdPlans.length} billing plans`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('=== SETUP ERROR ===');
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