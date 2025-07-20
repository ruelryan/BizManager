/**
 * End-to-End Subscription Flow Test
 * This script simulates the complete subscription flow from creation to activation
 */

// Configuration - Update these values
const CONFIG = {
  WEBHOOK_URL: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/paypal-webhook-handler',
  TEST_USER_ID: 'test-user-id-123',
  TEST_SUBSCRIPTION_ID: 'I-test-subscription-123',
  PLAN_ID: 'P-BIZMANAGER_STARTER',
  PLAN_TYPE: 'starter',
  AMOUNT: '3.99'
};

// Test event payloads
const createTestEvents = (config) => {
  const baseTime = new Date();
  const nextBillingTime = new Date(baseTime.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return {
    subscriptionCreated: {
      id: `WH-CREATED-${Date.now()}`,
      event_version: "1.0",
      create_time: baseTime.toISOString(),
      resource_type: "subscription",
      event_type: "BILLING.SUBSCRIPTION.CREATED",
      summary: "Subscription created",
      resource: {
        id: config.TEST_SUBSCRIPTION_ID,
        plan_id: config.PLAN_ID,
        custom_id: config.TEST_USER_ID,
        status: "APPROVAL_PENDING",
        create_time: baseTime.toISOString(),
        billing_info: {
          outstanding_balance: {
            currency_code: "USD",
            value: "0.00"
          },
          next_billing_time: nextBillingTime.toISOString()
        }
      }
    },
    
    subscriptionActivated: {
      id: `WH-ACTIVATED-${Date.now()}`,
      event_version: "1.0",
      create_time: new Date(baseTime.getTime() + 5000).toISOString(),
      resource_type: "subscription",
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      summary: "Subscription activated",
      resource: {
        id: config.TEST_SUBSCRIPTION_ID,
        plan_id: config.PLAN_ID,
        custom_id: config.TEST_USER_ID,
        status: "ACTIVE",
        start_time: baseTime.toISOString(),
        billing_info: {
          outstanding_balance: {
            currency_code: "USD",
            value: "0.00"
          },
          next_billing_time: nextBillingTime.toISOString(),
          last_payment: {
            amount: {
              currency_code: "USD",
              value: config.AMOUNT
            },
            time: baseTime.toISOString(),
            transaction_id: `TXN-${Date.now()}`
          }
        }
      }
    }
  };
};

// Mock PayPal headers
const createMockHeaders = () => ({
  'Content-Type': 'application/json',
  'x-paypal-transmission-id': `TRANS-${Date.now()}`,
  'x-paypal-cert-id': `CERT-${Date.now()}`,
  'x-paypal-auth-algo': 'SHA256withRSA',
  'x-paypal-transmission-sig': `SIG-${Date.now()}`,
  'x-paypal-transmission-time': new Date().toISOString()
});

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logSection = (title) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(50)}`);
};

const logStep = (step, message) => {
  console.log(`\n${step}. ${message}`);
  console.log('-'.repeat(30));
};

// Test execution functions
async function sendWebhookEvent(eventType, payload, headers) {
  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: responseText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testWebhookEndpoint() {
  logSection('WEBHOOK ENDPOINT CONNECTIVITY TEST');
  
  try {
    // Test CORS preflight
    const corsResponse = await fetch(CONFIG.WEBHOOK_URL, { method: 'OPTIONS' });
    console.log(`CORS Preflight: ${corsResponse.status} ${corsResponse.statusText}`);
    
    // Test basic connectivity
    const pingResponse = await fetch(CONFIG.WEBHOOK_URL, { method: 'GET' });
    console.log(`Basic Connectivity: ${pingResponse.status} ${pingResponse.statusText}`);
    
    return corsResponse.ok || pingResponse.status === 405; // 405 is expected for GET
  } catch (error) {
    console.error(`❌ Endpoint not accessible: ${error.message}`);
    return false;
  }
}

async function runSubscriptionFlowTest() {
  logSection('END-TO-END SUBSCRIPTION FLOW TEST');
  
  // Validate configuration
  if (CONFIG.WEBHOOK_URL.includes('YOUR_PROJECT_ID')) {
    console.error('❌ Please update CONFIG.WEBHOOK_URL with your actual Supabase project URL');
    return false;
  }
  
  const testEvents = createTestEvents(CONFIG);
  const mockHeaders = createMockHeaders();
  
  // Step 1: Test endpoint connectivity
  logStep('1', 'Testing webhook endpoint connectivity');
  const endpointAccessible = await testWebhookEndpoint();
  if (!endpointAccessible) {
    console.error('❌ Cannot proceed - webhook endpoint not accessible');
    return false;
  }
  console.log('✅ Webhook endpoint is accessible');
  
  // Step 2: Send subscription creation event
  logStep('2', 'Sending BILLING.SUBSCRIPTION.CREATED event');
  const createdResult = await sendWebhookEvent(
    'BILLING.SUBSCRIPTION.CREATED',
    testEvents.subscriptionCreated,
    mockHeaders
  );
  
  console.log(`Status: ${createdResult.status}`);
  console.log(`Response: ${createdResult.body}`);
  
  if (!createdResult.success) {
    console.error(`❌ Subscription creation event failed: ${createdResult.error || createdResult.body}`);
    return false;
  }
  console.log('✅ Subscription creation event processed');
  
  // Step 3: Wait a moment before sending activation
  logStep('3', 'Waiting 3 seconds before sending activation event');
  await sleep(3000);
  
  // Step 4: Send subscription activation event
  logStep('4', 'Sending BILLING.SUBSCRIPTION.ACTIVATED event');
  const activatedResult = await sendWebhookEvent(
    'BILLING.SUBSCRIPTION.ACTIVATED',
    testEvents.subscriptionActivated,
    mockHeaders
  );
  
  console.log(`Status: ${activatedResult.status}`);
  console.log(`Response: ${activatedResult.body}`);
  
  if (!activatedResult.success) {
    console.error(`❌ Subscription activation event failed: ${activatedResult.error || activatedResult.body}`);
    return false;
  }
  console.log('✅ Subscription activation event processed');
  
  // Step 5: Verification instructions
  logStep('5', 'Verification Instructions');
  console.log('Now check your Supabase database for the following:');
  console.log('');
  console.log('1. webhook_events table should have 2 new entries:');
  console.log('   - BILLING.SUBSCRIPTION.CREATED (processed = true)');
  console.log('   - BILLING.SUBSCRIPTION.ACTIVATED (processed = true)');
  console.log('');
  console.log('2. subscriptions table should have 1 new entry:');
  console.log(`   - paypal_subscription_id = "${CONFIG.TEST_SUBSCRIPTION_ID}"`);
  console.log(`   - user_id = "${CONFIG.TEST_USER_ID}"`);
  console.log(`   - status = "ACTIVE"`);
  console.log(`   - plan_type = "${CONFIG.PLAN_TYPE}"`);
  console.log('');
  console.log('3. user_settings table should be updated (if user exists):');
  console.log(`   - paypal_subscription_id = "${CONFIG.TEST_SUBSCRIPTION_ID}"`);
  console.log(`   - plan = "${CONFIG.PLAN_TYPE}"`);
  console.log('   - payment_status = "active"');
  console.log('   - subscription_status = "active"');
  console.log('   - is_in_trial = false');
  console.log('');
  console.log('4. payment_transactions table should have 1 new entry:');
  console.log('   - transaction_type = "subscription_activation"');
  console.log(`   - amount = ${CONFIG.AMOUNT}`);
  console.log('   - status = "completed"');
  
  return true;
}

// Database verification queries
function generateVerificationQueries() {
  return `
-- Run these queries in Supabase SQL Editor to verify the test results

-- 1. Check webhook events
SELECT 'webhook_events' as table_name, event_id, event_type, processed, processing_error, created_at
FROM webhook_events 
WHERE payload->'resource'->>'id' = '${CONFIG.TEST_SUBSCRIPTION_ID}'
ORDER BY created_at DESC;

-- 2. Check subscription record
SELECT 'subscriptions' as table_name, user_id, paypal_subscription_id, status, plan_type, created_at
FROM subscriptions 
WHERE paypal_subscription_id = '${CONFIG.TEST_SUBSCRIPTION_ID}';

-- 3. Check user settings (if user exists)
SELECT 'user_settings' as table_name, user_id, plan, payment_status, subscription_status, is_in_trial, paypal_subscription_id
FROM user_settings 
WHERE user_id = '${CONFIG.TEST_USER_ID}' OR paypal_subscription_id = '${CONFIG.TEST_SUBSCRIPTION_ID}';

-- 4. Check payment transactions
SELECT 'payment_transactions' as table_name, user_id, transaction_type, amount, status, created_at
FROM payment_transactions 
WHERE paypal_transaction_id = '${CONFIG.TEST_SUBSCRIPTION_ID}' 
   OR user_id = '${CONFIG.TEST_USER_ID}'
ORDER BY created_at DESC;

-- 5. Check notifications
SELECT 'notification_queue' as table_name, user_id, notification_type, title, created_at
FROM notification_queue 
WHERE user_id = '${CONFIG.TEST_USER_ID}'
ORDER BY created_at DESC;
  `;
}

// Main execution
async function main() {
  logSection('PAYPAL WEBHOOK DEBUGGING - END-TO-END TEST');
  console.log('Test Configuration:');
  console.log(`Webhook URL: ${CONFIG.WEBHOOK_URL}`);
  console.log(`Test User ID: ${CONFIG.TEST_USER_ID}`);
  console.log(`Test Subscription ID: ${CONFIG.TEST_SUBSCRIPTION_ID}`);
  console.log(`Plan: ${CONFIG.PLAN_TYPE} (${CONFIG.AMOUNT} USD)`);
  
  const success = await runSubscriptionFlowTest();
  
  if (success) {
    logSection('TEST COMPLETED SUCCESSFULLY');
    console.log('✅ Both webhook events were sent successfully');
    console.log('✅ Check your database using the verification queries below');
    console.log('✅ Check Supabase Edge Functions logs for detailed processing information');
  } else {
    logSection('TEST FAILED');
    console.log('❌ One or more webhook events failed to process');
    console.log('❌ Check Supabase Edge Functions logs for error details');
    console.log('❌ Verify webhook URL and configuration');
  }
  
  logSection('DATABASE VERIFICATION QUERIES');
  console.log(generateVerificationQueries());
}

// Instructions for running the test
if (require.main === module) {
  console.log('INSTRUCTIONS:');
  console.log('1. Update CONFIG object with your actual values');
  console.log('2. Ensure you have a test user in your database OR create one first');
  console.log('3. Run: node end-to-end-subscription-test.js');
  console.log('4. Check the results using the provided SQL queries');
  console.log('5. Clean up test data if needed');
  console.log('');
  console.log('Starting test in 3 seconds...');
  
  setTimeout(() => {
    main().catch(console.error);
  }, 3000);
}

module.exports = { runSubscriptionFlowTest, generateVerificationQueries };