import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationPayload {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SMTP_HOST = Deno.env.get('SMTP_HOST');
    const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587';
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get pending notifications
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select(`
        id,
        user_id,
        notification_type,
        title,
        message,
        metadata,
        auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('sent', false)
      .limit(50);

    if (error) {
      throw error;
    }

    console.log(`Processing ${notifications?.length || 0} notifications`);

    for (const notification of notifications || []) {
      try {
        // Send email notification if SMTP is configured
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
          await sendEmailNotification(notification, {
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT),
            user: SMTP_USER,
            pass: SMTP_PASS,
          });
        }

        // You can add other notification methods here (SMS, push notifications, etc.)

        // Mark notification as sent
        await supabase
          .from('notification_queue')
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        console.log(`Notification sent successfully: ${notification.id}`);

      } catch (notificationError) {
        console.error(`Failed to send notification ${notification.id}:`, notificationError);
        // Don't mark as sent so it can be retried
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Notification processing error:', error);
    
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

async function sendEmailNotification(notification: any, smtpConfig: any): Promise<void> {
  const userEmail = notification.auth?.users?.email;
  if (!userEmail) {
    throw new Error('User email not found');
  }

  // Create email content based on notification type
  const emailContent = generateEmailContent(notification);

  // Here you would implement actual email sending
  // For now, we'll just log it
  console.log('Email notification:', {
    to: userEmail,
    subject: notification.title,
    content: emailContent,
  });

  // Example using a hypothetical email service
  // You can replace this with your preferred email service (SendGrid, AWS SES, etc.)
  /*
  const emailResponse = await fetch('https://api.emailservice.com/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      to: userEmail,
      subject: notification.title,
      html: emailContent,
    }),
  });

  if (!emailResponse.ok) {
    throw new Error('Failed to send email');
  }
  */
}

function generateEmailContent(notification: any): string {
  const { notification_type, title, message, metadata } = notification;

  let emailHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BizManager</h1>
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>${message}</p>
  `;

  // Add specific content based on notification type
  switch (notification_type) {
    case 'payment_success':
      emailHtml += `
        <p><strong>Transaction Details:</strong></p>
        <ul>
          <li>Transaction ID: ${metadata?.transaction_id || 'N/A'}</li>
          <li>Plan: ${metadata?.plan || 'N/A'}</li>
        </ul>
        <a href="${Deno.env.get('APP_URL') || 'https://your-app.com'}/dashboard" class="button">View Dashboard</a>
      `;
      break;

    case 'payment_failed':
      emailHtml += `
        <p><strong>Failure Details:</strong></p>
        <ul>
          <li>Reason: ${metadata?.reason || 'Unknown'}</li>
          <li>Transaction ID: ${metadata?.transaction_id || 'N/A'}</li>
        </ul>
        <a href="${Deno.env.get('APP_URL') || 'https://your-app.com'}/upgrade" class="button">Try Again</a>
      `;
      break;

    case 'refund':
      emailHtml += `
        <p><strong>Refund Details:</strong></p>
        <ul>
          <li>Refund ID: ${metadata?.refund_id || 'N/A'}</li>
          <li>Amount: $${metadata?.amount || 'N/A'}</li>
        </ul>
      `;
      break;

    case 'dispute':
      emailHtml += `
        <p><strong>Dispute Details:</strong></p>
        <ul>
          <li>Dispute ID: ${metadata?.dispute_id || 'N/A'}</li>
          <li>Reason: ${metadata?.reason || 'N/A'}</li>
          <li>Status: ${metadata?.status || 'N/A'}</li>
        </ul>
      `;
      break;
  }

  emailHtml += `
          </div>
          <div class="footer">
            <p>This is an automated message from BizManager. Please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return emailHtml;
}