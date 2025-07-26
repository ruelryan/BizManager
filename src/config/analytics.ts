// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Facebook Pixel ID - Your actual Pixel ID
  FACEBOOK_PIXEL_ID: '668795419656785',
  
  // Google Analytics ID
  GOOGLE_ANALYTICS_ID: 'G-Q4HGSF4YEY',
  
  // Environment
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // Enable/disable tracking
  ENABLE_TRACKING: process.env.NODE_ENV === 'production',
} as const;

// Helper function to check if tracking should be enabled
export const shouldTrack = () => {
  return ANALYTICS_CONFIG.ENABLE_TRACKING && typeof window !== 'undefined';
};

// Helper function to get Facebook Pixel ID
export const getFacebookPixelId = () => {
  return ANALYTICS_CONFIG.FACEBOOK_PIXEL_ID;
}; 