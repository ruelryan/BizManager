import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface TestWebhookPayload {
  event_type: string;
  user_id?: string;
  amount?: number;
  currency?: string;
  transaction_id?: string;
  subscription_id?: string;
  plan_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') || `${SUPABASE_URL}/functions/v1/paypal-webhook-handler`;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    if (req.method === 'GET') {
      // Return test interface
      return new Response(getTestInterface(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      const testPayload: TestWebhookPayload = await req.json();
      
      // Generate test webhook event
      const webhookEvent = generateTestWebhookEvent(testPayload);
      
      // Send to webhook handler
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add mock PayPal headers for testing
          'x-paypal-transmission-id': 'test-transmission-id',
          'x-paypal-cert-id': 'test-cert-id',
          'x-paypal-auth-algo': 'SHA256withRSA',
          'x-paypal-transmission-sig': 'test-signature',
          'x-paypal-transmission-time': new Date().toISOString(),
        },
        body: JSON.stringify(webhookEvent),
      });

      const result = await webhookResponse.text();

      return new Response(
        JSON.stringify({
          success: webhookResponse.ok,
          status: webhookResponse.status,
          response: result,
          test_event: webhookEvent,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Test simulator error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateTestWebhookEvent(payload: TestWebhookPayload): any {
  const baseEvent = {
    id: `test-event-${Date.now()}`,
    event_version: '1.0',
    create_time: new Date().toISOString(),
    resource_type: 'capture',
    event_type: payload.event_type,
    summary: `Test ${payload.event_type} event`,
  };

  switch (payload.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      return {
        ...baseEvent,
        resource: {
          id: payload.transaction_id || `test-transaction-${Date.now()}`,
          status: 'COMPLETED',
          amount: {
            value: payload.amount?.toString() || '199.00',
            currency_code: payload.currency || 'USD',
          },
          custom_id: payload.user_id || 'test-user-id',
          payer: {
            payer_id: 'test-payer-id',
            email_address: 'test@example.com',
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    case 'PAYMENT.CAPTURE.DECLINED':
      return {
        ...baseEvent,
        resource: {
          id: payload.transaction_id || `test-failed-${Date.now()}`,
          status: 'DECLINED',
          amount: {
            value: payload.amount?.toString() || '199.00',
            currency_code: payload.currency || 'USD',
          },
          custom_id: payload.user_id || 'test-user-id',
          status_details: {
            reason: 'INSUFFICIENT_FUNDS',
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    case 'PAYMENT.CAPTURE.REFUNDED':
      return {
        ...baseEvent,
        resource_type: 'refund',
        resource: {
          id: `test-refund-${Date.now()}`,
          status: 'COMPLETED',
          amount: {
            value: payload.amount?.toString() || '199.00',
            currency_code: payload.currency || 'USD',
          },
          invoice_id: payload.transaction_id || 'test-original-transaction',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    case 'CUSTOMER.DISPUTE.CREATED':
      return {
        ...baseEvent,
        resource_type: 'dispute',
        resource: {
          dispute_id: `test-dispute-${Date.now()}`,
          status: 'OPEN',
          reason: 'UNAUTHORIZED',
          disputed_transactions: [
            {
              seller_transaction_id: payload.transaction_id || 'test-transaction',
            },
          ],
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      return {
        ...baseEvent,
        resource_type: 'subscription',
        resource: {
          id: payload.subscription_id || `test-subscription-${Date.now()}`,
          status: 'ACTIVE',
          plan_id: payload.plan_id || 'test-plan-id',
          subscriber: {
            payer_id: 'test-payer-id',
            email_address: 'test@example.com',
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    case 'BILLING.SUBSCRIPTION.CANCELLED':
      return {
        ...baseEvent,
        resource_type: 'subscription',
        resource: {
          id: payload.subscription_id || `test-subscription-${Date.now()}`,
          status: 'CANCELLED',
          plan_id: payload.plan_id || 'test-plan-id',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      };

    default:
      return {
        ...baseEvent,
        resource: {
          id: `test-resource-${Date.now()}`,
          status: 'COMPLETED',
        },
      };
  }
}

function getTestInterface(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PayPal Webhook Test Simulator</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #f9fafb;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #1f2937;
                margin-bottom: 20px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #374151;
            }
            select, input {
                width: 100%;
                padding: 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }
            button {
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
            }
            button:hover {
                background: #2563eb;
            }
            .result {
                margin-top: 20px;
                padding: 15px;
                border-radius: 6px;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 12px;
            }
            .success {
                background: #ecfdf5;
                border: 1px solid #10b981;
                color: #065f46;
            }
            .error {
                background: #fef2f2;
                border: 1px solid #ef4444;
                color: #7f1d1d;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>PayPal Webhook Test Simulator</h1>
            <p>Use this tool to test your PayPal webhook handlers with simulated events.</p>
            
            <form id="testForm">
                <div class="form-group">
                    <label for="eventType">Event Type:</label>
                    <select id="eventType" required>
                        <option value="PAYMENT.CAPTURE.COMPLETED">Payment Completed</option>
                        <option value="PAYMENT.CAPTURE.DECLINED">Payment Failed</option>
                        <option value="PAYMENT.CAPTURE.REFUNDED">Payment Refunded</option>
                        <option value="CUSTOMER.DISPUTE.CREATED">Dispute Created</option>
                        <option value="BILLING.SUBSCRIPTION.ACTIVATED">Subscription Activated</option>
                        <option value="BILLING.SUBSCRIPTION.CANCELLED">Subscription Cancelled</option>
                        <option value="BILLING.SUBSCRIPTION.PAYMENT.FAILED">Subscription Payment Failed</option>
                        <option value="BILLING.SUBSCRIPTION.EXPIRED">Subscription Expired</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="userId">User ID (optional):</label>
                    <input type="text" id="userId" placeholder="test-user-id">
                </div>
                
                <div class="form-group">
                    <label for="amount">Amount:</label>
                    <input type="number" id="amount" step="0.01" value="199.00">
                </div>
                
                <div class="form-group">
                    <label for="currency">Currency:</label>
                    <select id="currency">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="transactionId">Transaction ID (optional):</label>
                    <input type="text" id="transactionId" placeholder="Auto-generated if empty">
                </div>
                
                <button type="submit">Send Test Webhook</button>
            </form>
            
            <div id="result"></div>
        </div>

        <script>
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const payload = {
                    event_type: document.getElementById('eventType').value,
                    user_id: document.getElementById('userId').value || undefined,
                    amount: parseFloat(document.getElementById('amount').value),
                    currency: document.getElementById('currency').value,
                    transaction_id: document.getElementById('transactionId').value || undefined,
                };
                
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = 'Sending test webhook...';
                resultDiv.className = 'result';
                
                try {
                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });
                    
                    const result = await response.json();
                    
                    resultDiv.innerHTML = JSON.stringify(result, null, 2);
                    resultDiv.className = 'result ' + (result.success ? 'success' : 'error');
                    
                } catch (error) {
                    resultDiv.innerHTML = 'Error: ' + error.message;
                    resultDiv.className = 'result error';
                }
            });
        </script>
    </body>
    </html>
  `;
}