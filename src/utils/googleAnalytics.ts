// Google Analytics event tracking utility

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Track a custom event in Google Analytics
export const trackGAEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    console.log(`[GA] Event tracked: ${eventName}`, params);
  } else {
    console.warn('[GA] gtag not available');
  }
};

// Track a signup attempt (form submit)
export const trackSignupAttempt = (method: string = 'email') => {
  trackGAEvent('signup_attempt', {
    method,
    category: 'Signup',
    label: 'Signup Attempt',
  });
};

// Track a successful signup
export const trackSignupSuccess = (method: string = 'email') => {
  trackGAEvent('signup_success', {
    method,
    category: 'Signup',
    label: 'Signup Success',
  });
}; 