# Facebook Pixel Setup Guide for BizManager

This guide will help you set up Facebook Pixel tracking for successful signups and conversions on your BizManager application.

## Prerequisites

1. A Facebook Business Manager account
2. A Facebook Ad account
3. Access to your website's HTML head section

## Step 1: Create a Facebook Pixel

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to **Events Manager** → **Data Sources** → **Pixels**
3. Click **Create a Pixel**
4. Name your pixel (e.g., "BizManager Website Pixel")
5. Enter your website URL: `https://bizmanagerph.com`
6. Click **Create**

## Step 2: Get Your Pixel ID

1. After creating the pixel, you'll see a Pixel ID (e.g., `123456789012345`)
2. Copy this ID - you'll need it for the next steps

## Step 3: Update Your Configuration

### Update the HTML file:

Replace `YOUR_PIXEL_ID_HERE` in `index.html` with your actual Pixel ID:

```html
fbq('init', '123456789012345'); // Replace with your actual Pixel ID
```

And in the noscript tag:

```html
src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"
```

### Update the config file:

Replace `YOUR_PIXEL_ID_HERE` in `src/config/analytics.ts`:

```typescript
FACEBOOK_PIXEL_ID: '123456789012345',
```

## Step 4: Test Your Pixel

1. Install the [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedmjlckhdkbplnflng) Chrome extension
2. Visit your website
3. Open the Pixel Helper to verify the pixel is firing correctly

## Step 5: Set Up Conversion Tracking

The application is already configured to track these events:

### 1. CompleteRegistration (Signup)

- **When**: User successfully creates an account
- **Data tracked**: Signup method, plan type, trial status
- **Location**: `src/store/useStore.ts` in the `signUp` function

### 2. StartTrial (Trial Start)

- **When**: User starts their 14-day free trial
- **Data tracked**: Plan type, trial duration
- **Location**: `src/store/useStore.ts` in the `startFreeTrial` function

### 3. Subscribe (Subscription Conversion)

- **When**: User converts from trial to paid subscription
- **Data tracked**: Plan type, subscription value, currency
- **Location**: `src/store/useStore.ts` in the `terminateTrialOnSubscription` function

## Step 6: Create Custom Audiences

### 1. Signup Audience

1. Go to **Audiences** in Facebook Business Manager
2. Click **Create Audience** → **Custom Audience**
3. Select **Website**
4. Choose **People who visited specific web pages**
5. Add event: `CompleteRegistration`
6. Name: "BizManager Signups"

### 2. Trial Start Audience

1. Create another custom audience
2. Choose event: `StartTrial`
3. Name: "BizManager Trial Starts"

### 3. Subscription Conversions

1. Create another custom audience
2. Choose event: `Subscribe`
3. Name: "BizManager Subscribers"

## Step 7: Set Up Conversion Optimization

### 1. Create Conversion Campaigns

1. Go to **Ads Manager**
2. Create a new campaign
3. Choose **Conversions** as the objective
4. Select your pixel
5. Choose the conversion event (e.g., `Subscribe`)

### 2. Set Up Lookalike Audiences

1. Based on your "BizManager Subscribers" audience
2. Create a 1% lookalike audience
3. Use this for prospecting campaigns

## Step 8: Advanced Tracking (Optional)

### Track Additional Events

You can add more tracking by importing and using the utility functions:

```typescript
import { trackCustomEvent, trackLead } from "../utils/facebookPixel";

// Track a custom event
trackCustomEvent("FeatureUsed", {
  feature_name: "inventory_management",
  user_plan: "pro",
});

// Track lead generation
trackLead("landing_page");
```

### Available Tracking Functions

- `trackSignup(method, plan)` - Track user registration
- `trackTrialStart(plan)` - Track trial initiation
- `trackSubscription(plan, value)` - Track subscription conversion
- `trackPageView(pageName)` - Track page views
- `trackCustomEvent(eventName, parameters)` - Track custom events
- `trackLead(source)` - Track lead generation

## Step 9: Monitor and Optimize

### 1. Check Pixel Performance

- Go to **Events Manager** → **Overview**
- Monitor event counts and conversion rates
- Check for any pixel errors

### 2. Analyze Conversion Funnel

- Signup → Trial Start → Subscription
- Identify drop-off points
- Optimize based on data

### 3. A/B Test Landing Pages

- Use Facebook's split testing feature
- Test different signup flows
- Optimize for conversion rate

## Troubleshooting

### Common Issues

1. **Pixel not firing**: Check if the pixel ID is correct
2. **Events not showing**: Ensure the pixel is properly installed
3. **Conversion tracking issues**: Verify event names match Facebook's standard events

### Debug Mode

Enable debug mode in the Facebook Pixel Helper to see detailed event information.

## Best Practices

1. **Test thoroughly** before going live
2. **Respect user privacy** and comply with GDPR/CCPA
3. **Monitor performance** regularly
4. **Optimize based on data** from your campaigns
5. **Use standard events** when possible for better optimization

## Support

If you encounter issues:

1. Check the [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel/)
2. Use the Facebook Pixel Helper for debugging
3. Contact Facebook Business Support

---

**Note**: Make sure to replace `YOUR_PIXEL_ID_HERE` with your actual Facebook Pixel ID in both the HTML file and the configuration file before deploying to production.
