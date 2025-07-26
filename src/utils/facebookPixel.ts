// Facebook Pixel tracking utility
declare global {
  interface Window {
    fbq: any;
  }
}

// Initialize Facebook Pixel
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
};

// Track signup event
export const trackSignup = (method: string = 'email', plan: string = 'free') => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'User Signup',
        content_category: 'Signup',
        value: 0,
        currency: 'PHP',
        custom_data: {
          signup_method: method,
          plan_type: plan,
          trial_started: true
        }
      });
      console.log('✅ Facebook Pixel: CompleteRegistration tracked successfully');
    } catch (error) {
      console.error('❌ Facebook Pixel: Failed to track CompleteRegistration:', error);
    }
  } else {
    console.warn('⚠️ Facebook Pixel: fbq not available');
  }
};

// Track trial start
export const trackTrialStart = (plan: string = 'free') => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'StartTrial', {
      content_name: 'Free Trial Started',
      content_category: 'Trial',
      value: 0,
      currency: 'PHP',
      custom_data: {
        plan_type: plan,
        trial_duration_days: 14
      }
    });
  }
};

// Track subscription conversion
export const trackSubscription = (plan: string, value: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Subscribe', {
      content_name: 'Subscription Started',
      content_category: 'Subscription',
      value: value,
      currency: 'PHP',
      custom_data: {
        plan_type: plan,
        subscription_type: 'recurring'
      }
    });
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView', {
      page_name: pageName
    });
  }
};

// Track custom events
export const trackCustomEvent = (eventName: string, parameters: any = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, parameters);
      console.log(`✅ Facebook Pixel: ${eventName} tracked successfully`);
    } catch (error) {
      console.error(`❌ Facebook Pixel: Failed to track ${eventName}:`, error);
    }
  } else {
    console.warn('⚠️ Facebook Pixel: fbq not available');
  }
};

// Track Facebook Click ID (fbclid) for attribution
export const trackFacebookClickId = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    
    if (fbclid && window.fbq) {
      try {
        // Store fbclid for attribution
        window.fbq('track', 'CustomEvent', {
          event_name: 'FacebookClickReceived',
          fbclid: fbclid,
          landing_page: window.location.pathname
        });
        console.log('✅ Facebook Click ID tracked:', fbclid);
        
        // Store in localStorage for later attribution
        localStorage.setItem('fbclid', fbclid);
        localStorage.setItem('fbclid_timestamp', Date.now().toString());
      } catch (error) {
        console.error('❌ Failed to track Facebook Click ID:', error);
      }
    }
  }
};

// Get stored Facebook Click ID for attribution
export const getStoredFacebookClickId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fbclid');
  }
  return null;
};

// Track lead generation
export const trackLead = (source: string = 'website') => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'Lead', {
        content_name: 'Lead Generated',
        content_category: 'Lead',
        value: 0,
        currency: 'PHP',
        custom_data: {
          lead_source: source
        }
      });
      console.log('✅ Facebook Pixel: Lead tracked successfully');
    } catch (error) {
      console.error('❌ Facebook Pixel: Failed to track Lead:', error);
    }
  } else {
    console.warn('⚠️ Facebook Pixel: fbq not available');
  }
};

// Track email confirmation sent
export const trackEmailConfirmationSent = (_email: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'CustomEvent', {
        event_name: 'EmailConfirmationSent',
        content_name: 'Email Confirmation Sent',
        content_category: 'Signup',
        value: 0,
        currency: 'PHP',
        custom_data: {
          email_provided: true,
          signup_step: 'email_confirmation_sent'
        }
      });
      console.log('✅ Facebook Pixel: EmailConfirmationSent tracked successfully');
    } catch (error) {
      console.error('❌ Facebook Pixel: Failed to track EmailConfirmationSent:', error);
    }
  } else {
    console.warn('⚠️ Facebook Pixel: fbq not available');
  }
};

// Track email confirmation completed
export const trackEmailConfirmationCompleted = (_email: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'CustomEvent', {
        event_name: 'EmailConfirmationCompleted',
        content_name: 'Email Confirmation Completed',
        content_category: 'Signup',
        value: 0,
        currency: 'PHP',
        custom_data: {
          email_confirmed: true,
          signup_step: 'email_confirmation_completed'
        }
      });
      console.log('✅ Facebook Pixel: EmailConfirmationCompleted tracked successfully');
    } catch (error) {
      console.error('❌ Facebook Pixel: Failed to track EmailConfirmationCompleted:', error);
    }
  } else {
    console.warn('⚠️ Facebook Pixel: fbq not available');
  }
}; 