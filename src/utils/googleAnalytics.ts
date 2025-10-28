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

// ============================================
// AUTHENTICATION & USER LIFECYCLE
// ============================================

// Track a signup attempt (form submit)
export const trackSignupAttempt = (method: string = 'email') => {
  trackGAEvent('signup_attempt', {
    method,
    event_category: 'Authentication',
    event_label: 'Signup Attempt',
  });
};

// Track a successful signup
export const trackSignupSuccess = (method: string = 'email') => {
  trackGAEvent('signup_success', {
    method,
    event_category: 'Authentication',
    event_label: 'Signup Success',
  });
};

// Track login attempts
export const trackLoginAttempt = (method: string = 'email') => {
  trackGAEvent('login_attempt', {
    method,
    event_category: 'Authentication',
    event_label: 'Login Attempt',
  });
};

// Track successful login
export const trackLoginSuccess = (method: string = 'email') => {
  trackGAEvent('login', {
    method,
    event_category: 'Authentication',
    event_label: 'Login Success',
  });
};

// Track login failures
export const trackLoginError = (errorType: string) => {
  trackGAEvent('login_error', {
    error_type: errorType,
    event_category: 'Authentication',
    event_label: 'Login Error',
  });
};

// Track password reset requests
export const trackPasswordReset = (step: 'request' | 'complete') => {
  trackGAEvent('password_reset', {
    step,
    event_category: 'Authentication',
    event_label: `Password Reset - ${step}`,
  });
};

// ============================================
// FEATURE USAGE
// ============================================

// Track page views for main features
export const trackFeatureView = (featureName: string) => {
  trackGAEvent('page_view', {
    page_title: featureName,
    event_category: 'Feature Usage',
    event_label: `View ${featureName}`,
  });
};

// Track demo mode usage
export const trackDemoStart = () => {
  trackGAEvent('demo_start', {
    event_category: 'Feature Usage',
    event_label: 'Demo Mode Started',
  });
};

// ============================================
// BUSINESS ACTIONS
// ============================================

// Track product operations
export const trackProductAction = (action: 'create' | 'edit' | 'delete' | 'view') => {
  trackGAEvent('product_action', {
    action,
    event_category: 'Business Actions',
    event_label: `Product ${action}`,
  });
};

// Track sale operations
export const trackSaleAction = (action: 'create' | 'view' | 'complete', value?: number) => {
  trackGAEvent('sale_action', {
    action,
    value: value || 0,
    event_category: 'Business Actions',
    event_label: `Sale ${action}`,
  });
};

// Track customer operations
export const trackCustomerAction = (action: 'create' | 'edit' | 'delete' | 'view') => {
  trackGAEvent('customer_action', {
    action,
    event_category: 'Business Actions',
    event_label: `Customer ${action}`,
  });
};

// Track expense operations
export const trackExpenseAction = (action: 'create' | 'edit' | 'delete' | 'view') => {
  trackGAEvent('expense_action', {
    action,
    event_category: 'Business Actions',
    event_label: `Expense ${action}`,
  });
};

// Track inventory operations
export const trackInventoryAction = (action: 'adjust' | 'view' | 'export') => {
  trackGAEvent('inventory_action', {
    action,
    event_category: 'Business Actions',
    event_label: `Inventory ${action}`,
  });
};

// Track report generation
export const trackReportView = (reportType: string) => {
  trackGAEvent('report_view', {
    report_type: reportType,
    event_category: 'Business Actions',
    event_label: `Report - ${reportType}`,
  });
};

// Track invoice generation
export const trackInvoiceGeneration = (format: 'pdf' | 'print') => {
  trackGAEvent('invoice_generate', {
    format,
    event_category: 'Business Actions',
    event_label: `Invoice ${format}`,
  });
};

// ============================================
// CONVERSION & MONETIZATION
// ============================================

// Track upgrade page view
export const trackUpgradePageView = () => {
  trackGAEvent('view_item_list', {
    item_list_name: 'Subscription Plans',
    event_category: 'Monetization',
    event_label: 'View Upgrade Page',
  });
};

// Track plan selection
export const trackPlanSelect = (planName: string, price: number) => {
  trackGAEvent('select_item', {
    items: [{
      item_id: planName.toLowerCase(),
      item_name: planName,
      price: price,
    }],
    event_category: 'Monetization',
    event_label: `Select Plan - ${planName}`,
  });
};

// Track upgrade attempt (PayPal opened)
export const trackUpgradeAttempt = (planName: string, price: number) => {
  trackGAEvent('begin_checkout', {
    value: price,
    currency: 'PHP',
    items: [{
      item_id: planName.toLowerCase(),
      item_name: planName,
      price: price,
    }],
    event_category: 'Monetization',
    event_label: `Upgrade Attempt - ${planName}`,
  });
};

// Track successful subscription
export const trackSubscriptionSuccess = (planName: string, price: number, subscriptionId: string) => {
  trackGAEvent('purchase', {
    transaction_id: subscriptionId,
    value: price,
    currency: 'PHP',
    items: [{
      item_id: planName.toLowerCase(),
      item_name: planName,
      price: price,
    }],
    event_category: 'Monetization',
    event_label: `Subscription Success - ${planName}`,
  });
};

// Track subscription cancellation
export const trackSubscriptionCancel = (planName: string, reason?: string) => {
  trackGAEvent('subscription_cancel', {
    plan: planName,
    reason: reason || 'not_specified',
    event_category: 'Monetization',
    event_label: `Cancel Subscription - ${planName}`,
  });
};

// ============================================
// USER EXPERIENCE & ENGAGEMENT
// ============================================

// Track search usage
export const trackSearch = (searchTerm: string, resultCount: number) => {
  trackGAEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
    event_category: 'Engagement',
    event_label: 'Search',
  });
};

// Track export actions
export const trackExport = (dataType: string, format: string) => {
  trackGAEvent('export_data', {
    data_type: dataType,
    format,
    event_category: 'Engagement',
    event_label: `Export ${dataType}`,
  });
};

// Track print actions
export const trackPrint = (documentType: string) => {
  trackGAEvent('print', {
    document_type: documentType,
    event_category: 'Engagement',
    event_label: `Print ${documentType}`,
  });
};

// Track app errors
export const trackError = (errorType: string, errorMessage: string, page: string) => {
  trackGAEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    page,
    event_category: 'Errors',
    event_label: errorType,
  });
};

// Track feature gate interactions (when user hits plan limits)
export const trackFeatureGateHit = (feature: string, currentPlan: string) => {
  trackGAEvent('feature_gate_hit', {
    feature,
    current_plan: currentPlan,
    event_category: 'Engagement',
    event_label: `Feature Gate - ${feature}`,
  });
};

// Track settings changes
export const trackSettingsChange = (settingName: string, value: any) => {
  trackGAEvent('settings_change', {
    setting_name: settingName,
    value: String(value),
    event_category: 'Engagement',
    event_label: `Change Setting - ${settingName}`,
  });
};

// ============================================
// CONTENT & MARKETING
// ============================================

// Track blog post views
export const trackBlogView = (postTitle: string) => {
  trackGAEvent('blog_view', {
    post_title: postTitle,
    event_category: 'Content',
    event_label: `Blog - ${postTitle}`,
  });
};

// Track contact form submission
export const trackContactForm = (reason: string) => {
  trackGAEvent('contact_form', {
    reason,
    event_category: 'Content',
    event_label: 'Contact Form Submit',
  });
};

// Track CTA clicks
export const trackCTAClick = (ctaName: string, location: string) => {
  trackGAEvent('cta_click', {
    cta_name: ctaName,
    location,
    event_category: 'Marketing',
    event_label: `CTA - ${ctaName}`,
  });
}; 