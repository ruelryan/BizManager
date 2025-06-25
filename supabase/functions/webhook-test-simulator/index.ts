import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// CSP headers to allow inline scripts and styles for the test interface
const cspHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
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
    return new Response(null, { headers: { ...corsHeaders, ...cspHeaders } });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') || `${SUPABASE_URL}/functions/v1/paypal-webhook-handler`;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    if (req.method === 'GET') {
      // Return test interface with proper CSP headers
      return new Response(getTestInterface(), {
        headers: { 
          ...corsHeaders,
          ...cspHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
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
          headers: { ...corsHeaders, ...cspHeaders, 'Content-Type': 'application/json; charset=utf-8' },
          status: 200,
        }
      );
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, ...cspHeaders },
    });

  } catch (error) {
    console.error('Test simulator error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, ...cspHeaders, 'Content-Type': 'application/json; charset=utf-8' },
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
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 16px;
            }
            
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                background: #10b981;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .content {
                padding: 30px;
            }
            
            .info-box {
                background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
                border: 1px solid #3b82f6;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .info-box::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            }
            
            .info-box h3 {
                color: #1e40af;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .webhook-url {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                background: rgba(59, 130, 246, 0.1);
                padding: 8px 12px;
                border-radius: 6px;
                word-break: break-all;
                font-size: 13px;
                border: 1px solid rgba(59, 130, 246, 0.2);
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
            }
            
            label {
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
                font-size: 14px;
            }
            
            select, input {
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s ease;
                background: white;
            }
            
            select:focus, input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            select:hover, input:hover {
                border-color: #d1d5db;
            }
            
            button {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 14px 28px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.2s ease;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                width: 100%;
                margin-top: 10px;
            }
            
            button:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            button:active {
                transform: translateY(0);
            }
            
            button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .result {
                margin-top: 30px;
                padding: 20px;
                border-radius: 12px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                line-height: 1.5;
                max-height: 500px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-word;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .result.success {
                background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
                border-color: #10b981;
                color: #065f46;
            }
            
            .result.error {
                background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
                border-color: #ef4444;
                color: #7f1d1d;
            }
            
            .result.loading {
                background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
                border-color: #f59e0b;
                color: #92400e;
            }
            
            .result:empty {
                display: none;
            }
            
            .event-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
            }
            
            .event-option {
                padding: 8px 12px;
                background: #f9fafb;
                border-radius: 6px;
                font-size: 13px;
                border: 1px solid #e5e7eb;
            }
            
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .hidden {
                display: none;
            }
            
            @media (max-width: 768px) {
                .container {
                    margin: 10px;
                    border-radius: 12px;
                }
                
                .header, .content {
                    padding: 20px;
                }
                
                .form-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><span class="status-indicator"></span>PayPal Webhook Test Simulator</h1>
                <p>Test your PayPal webhook integration with simulated events</p>
            </div>
            
            <div class="content">
                <div class="info-box">
                    <h3>🔧 Test Environment Active</h3>
                    <p>This tool simulates PayPal webhook events to test your payment processing system.</p>
                    <br>
                    <strong>Webhook URL:</strong><br>
                    <div class="webhook-url">${Deno.env.get('SUPABASE_URL')}/functions/v1/paypal-webhook-handler</div>
                </div>
                
                <form id="testForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="eventType">Event Type:</label>
                            <select id="eventType" required>
                                <option value="PAYMENT.CAPTURE.COMPLETED">✅ Payment Completed</option>
                                <option value="PAYMENT.CAPTURE.DECLINED">❌ Payment Failed</option>
                                <option value="PAYMENT.CAPTURE.REFUNDED">💰 Payment Refunded</option>
                                <option value="CUSTOMER.DISPUTE.CREATED">⚠️ Dispute Created</option>
                                <option value="BILLING.SUBSCRIPTION.ACTIVATED">🔄 Subscription Activated</option>
                                <option value="BILLING.SUBSCRIPTION.CANCELLED">🚫 Subscription Cancelled</option>
                                <option value="BILLING.SUBSCRIPTION.PAYMENT.FAILED">💳 Subscription Payment Failed</option>
                                <option value="BILLING.SUBSCRIPTION.EXPIRED">⏰ Subscription Expired</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="userId">User ID (optional):</label>
                            <input type="text" id="userId" placeholder="test-user-id or leave empty">
                        </div>
                        
                        <div class="form-group">
                            <label for="amount">Amount:</label>
                            <input type="number" id="amount" step="0.01" value="199.00" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="currency">Currency:</label>
                            <select id="currency">
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transactionId">Transaction ID (optional):</label>
                            <input type="text" id="transactionId" placeholder="Auto-generated if empty">
                        </div>
                    </div>
                    
                    <button type="submit" id="submitBtn">
                        <span id="buttonText">🚀 Send Test Webhook</span>
                        <span id="loadingSpinner" class="loading-spinner hidden"></span>
                    </button>
                </form>
                
                <div id="result" class="result"></div>
            </div>
        </div>

        <script>
            document.getElementById('testForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const buttonText = document.getElementById('buttonText');
                const loadingSpinner = document.getElementById('loadingSpinner');
                const resultDiv = document.getElementById('result');
                
                // Show loading state
                submitBtn.disabled = true;
                buttonText.textContent = '⏳ Sending...';
                loadingSpinner.classList.remove('hidden');
                
                const payload = {
                    event_type: document.getElementById('eventType').value,
                    user_id: document.getElementById('userId').value || undefined,
                    amount: parseFloat(document.getElementById('amount').value),
                    currency: document.getElementById('currency').value,
                    transaction_id: document.getElementById('transactionId').value || undefined,
                };
                
                resultDiv.innerHTML = '⏳ Sending test webhook event...\\n\\nPayload:\\n' + JSON.stringify(payload, null, 2);
                resultDiv.className = 'result loading';
                resultDiv.style.display = 'block';
                
                try {
                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });
                    
                    const result = await response.json();
                    
                    let displayResult = '📊 Test Results:\\n\\n';
                    displayResult += 'Status: ' + (result.success ? '✅ SUCCESS' : '❌ FAILED') + '\\n';
                    displayResult += 'HTTP Status: ' + result.status + '\\n\\n';
                    displayResult += '📤 Sent Event:\\n' + JSON.stringify(result.test_event, null, 2) + '\\n\\n';
                    displayResult += '📥 Webhook Response:\\n' + result.response + '\\n\\n';
                    displayResult += '🔍 Full Result:\\n' + JSON.stringify(result, null, 2);
                    
                    resultDiv.innerHTML = displayResult;
                    resultDiv.className = 'result ' + (result.success ? 'success' : 'error');
                    
                } catch (error) {
                    resultDiv.innerHTML = '❌ Network Error:\\n\\n' + error.message + '\\n\\nPlease check your connection and try again.';
                    resultDiv.className = 'result error';
                } finally {
                    // Reset button state
                    submitBtn.disabled = false;
                    buttonText.textContent = '🚀 Send Test Webhook';
                    loadingSpinner.classList.add('hidden');
                }
            });
            
            // Auto-focus on first input
            document.getElementById('eventType').focus();
            
            // Add some visual feedback for form interactions
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    this.style.transform = 'scale(1.02)';
                });
                
                input.addEventListener('blur', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        </script>
    </body>
    </html>
  `;
}