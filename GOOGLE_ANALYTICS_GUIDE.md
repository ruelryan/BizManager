# Google Analytics Metrics Guide for BizManager

This guide explains all the metrics being tracked in your Business Manager application and how to view them in Google Analytics.

## Table of Contents
1. [Quick Access](#quick-access)
2. [Metrics Categories](#metrics-categories)
3. [How to View Each Metric](#how-to-view-each-metric)
4. [Creating Custom Reports](#creating-custom-reports)
5. [Setting Up Conversion Goals](#setting-up-conversion-goals)
6. [Recommended Dashboards](#recommended-dashboards)

---

## Quick Access

**Your GA Property ID:** `G-Q4HGSF4YEY`

**Access Your Dashboard:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your BizManager property
3. Navigate to Reports → Engagement → Events

---

## Metrics Categories

### 1. Authentication & User Lifecycle
Track user signups, logins, and account management

**Events:**
- `signup_attempt` - When user submits signup form
- `signup_success` - When signup is completed
- `login_attempt` - When user tries to log in
- `login` - Successful login
- `login_error` - Failed login attempt
- `password_reset` - Password reset (request/complete)

### 2. Feature Usage
Monitor which features users are engaging with

**Events:**
- `page_view` - Page visits with feature names
- `demo_start` - When user starts demo mode

### 3. Business Actions
Track core business operations

**Events:**
- `product_action` - Product create/edit/delete/view
- `sale_action` - Sale operations (includes sale value)
- `customer_action` - Customer management
- `expense_action` - Expense tracking
- `inventory_action` - Inventory adjustments
- `report_view` - Report generation
- `invoice_generate` - Invoice PDF/print

### 4. Conversion & Monetization
Track subscription funnel and revenue

**Events:**
- `view_item_list` - View upgrade page
- `select_item` - Plan selection
- `begin_checkout` - Upgrade attempt (PayPal opened)
- `purchase` - Successful subscription (with revenue)
- `subscription_cancel` - Subscription cancellation

### 5. User Experience & Engagement
Monitor user interactions and issues

**Events:**
- `search` - Search usage
- `export_data` - Data exports
- `print` - Print actions
- `exception` - App errors
- `feature_gate_hit` - When users hit plan limits
- `settings_change` - Settings modifications

### 6. Content & Marketing
Track content engagement and conversions

**Events:**
- `blog_view` - Blog post views
- `contact_form` - Contact submissions
- `cta_click` - Call-to-action clicks

---

## How to View Each Metric

### Viewing All Events

1. Log into [Google Analytics](https://analytics.google.com/)
2. Select your property (BizManager)
3. Navigate: **Reports** → **Engagement** → **Events**
4. You'll see all events with count and user data

### Viewing Specific Event Details

1. In the Events report, click on any event name
2. See detailed breakdown including:
   - Total event count
   - Users who triggered it
   - Event parameters
   - User demographics

### Example: Viewing Signup Funnel

**To see your signup conversion rate:**

1. Go to **Reports** → **Engagement** → **Events**
2. Look at these events:
   - `signup_attempt` (how many started)
   - `signup_success` (how many completed)
3. Calculate: (signup_success / signup_attempt) × 100 = conversion %

**Better approach - Create a funnel exploration:**

1. Go to **Explore** → **Funnel exploration**
2. Create steps:
   - Step 1: `page_view` where `page_title` = "Landing"
   - Step 2: `signup_attempt`
   - Step 3: `signup_success`
   - Step 4: `login` (first login after signup)
3. Save the exploration

### Example: Viewing Revenue from Subscriptions

1. Go to **Reports** → **Monetization** → **Overview**
2. Or go to **Events** → Click `purchase`
3. You'll see:
   - Total revenue
   - Transaction IDs
   - Average purchase value
   - Revenue by plan type

### Example: Viewing Feature Usage

1. Go to **Reports** → **Engagement** → **Events**
2. Filter for business action events:
   - `product_action`
   - `sale_action`
   - `customer_action`
   - `expense_action`
3. See which features are used most

### Example: Viewing Error Rates

1. Go to **Reports** → **Engagement** → **Events**
2. Click on `exception`
3. See error descriptions and frequency
4. Use this to identify and fix issues

---

## Creating Custom Reports

### Sales Performance Dashboard

**Create a custom exploration:**

1. Go to **Explore** → **Free form**
2. Add dimensions:
   - Event name
   - Date
   - Device category
3. Add metrics:
   - Event count
   - Users
   - Total users
4. Add filters:
   - Event name: contains "sale_action" OR "product_action" OR "customer_action"
5. Visualize as line chart over time
6. Save as "Sales Performance"

### Subscription Funnel Dashboard

**Track your monetization funnel:**

1. Go to **Explore** → **Funnel exploration**
2. Set up funnel:
   - Step 1: `view_item_list` (View pricing)
   - Step 2: `select_item` (Select plan)
   - Step 3: `begin_checkout` (Start PayPal)
   - Step 4: `purchase` (Complete subscription)
3. Add segment: Compare by device, location, or user type
4. Save as "Subscription Funnel"

### User Engagement Report

**See how users interact with your app:**

1. Go to **Explore** → **Free form**
2. Dimensions: Event name, Date
3. Metrics: Event count, Active users
4. Filter: Engagement category events
5. Save as "User Engagement"

---

## Setting Up Conversion Goals

Define which events are your key conversions:

### Setting Up Conversions

1. Go to **Admin** (bottom left)
2. Click **Events** under Data display
3. Find these events and mark as conversions:
   - `signup_success` ✓ Mark as conversion
   - `purchase` ✓ Mark as conversion
   - `login` ✓ Mark as conversion
   - `sale_action` ✓ Mark as conversion (for business activity)

4. Now these will show in **Monetization** → **Conversions** report

### Setting Up Audiences

**Create audience segments for targeting:**

1. Go to **Admin** → **Audiences**
2. Click **New audience**

**Example Audiences to Create:**

- **Active Users:**
  - Condition: `login` count > 5 in last 30 days

- **High-Value Customers:**
  - Condition: `purchase` exists AND `sale_action` count > 20

- **Churning Users:**
  - Condition: Last active > 30 days ago

- **Feature Power Users:**
  - Condition: `product_action` + `sale_action` + `report_view` > 50 in last 30 days

- **Likely to Upgrade:**
  - Condition: `feature_gate_hit` count > 3 OR `view_item_list` exists

---

## Recommended Dashboards

### Dashboard 1: Business Health Overview

**Key Metrics to Display:**
- Daily Active Users (DAU)
- New signups (`signup_success`)
- Total sales completed (`sale_action` where action=complete)
- Revenue from subscriptions (`purchase` total value)
- Error rate (`exception` count)

**How to Create:**
1. Go to **Reports** → **Library** → **Create new collection**
2. Add cards for each metric above
3. Set time period: Last 30 days
4. Save as "Business Health"

### Dashboard 2: Conversion Funnel

**Key Metrics:**
- Landing page views
- Signup attempts → Success rate
- Demo starts
- Upgrade page views → Purchase rate
- Average revenue per user (ARPU)

### Dashboard 3: Product Engagement

**Key Metrics:**
- Feature usage by type (products, sales, inventory, reports)
- Time spent on each feature
- Feature adoption rate (% of users using each feature)
- Feature retention (users returning to features)

### Dashboard 4: Revenue & Monetization

**Key Metrics:**
- Monthly Recurring Revenue (MRR)
- New subscriptions by plan
- Churn rate (cancellations)
- Average Customer Lifetime Value (CLV)
- Conversion rate: Free → Paid

---

## Real-Time Monitoring

### View Live Activity

1. Go to **Reports** → **Realtime**
2. See:
   - Users active right now
   - Events happening in real-time
   - Pages being viewed
   - Conversions as they happen

**Great for:**
- Testing new features
- Monitoring marketing campaigns
- Checking if tracking is working

---

## Key Reports to Check Weekly

### Monday Morning Check:
1. **User Growth:** Reports → Acquisition → User acquisition
   - New signups last week
   - Signup conversion rate
   - Channel performance (organic, social, ads)

2. **Feature Adoption:** Reports → Engagement → Events
   - Which features are most used?
   - Are new features being adopted?
   - Any drop in key feature usage?

3. **Revenue Performance:** Reports → Monetization → Overview
   - New subscriptions
   - MRR growth
   - Churn rate

4. **Error Monitoring:** Reports → Engagement → Events → `exception`
   - Any spike in errors?
   - New error types?
   - Which pages have issues?

---

## Tips for Success

### 1. Regular Monitoring
- Check GA daily for the first month
- Set up weekly email reports
- Monitor real-time during launches

### 2. Set Up Alerts
1. Go to **Admin** → **Custom alerts**
2. Create alerts for:
   - Signup rate drops below X%
   - Error rate exceeds X per day
   - Zero purchases for 24 hours
   - Traffic drops more than 50%

### 3. Compare Time Periods
- Always compare week-over-week or month-over-month
- Look for trends, not just absolute numbers
- Seasonal patterns in business apps

### 4. Segment Your Data
- Compare desktop vs mobile users
- Compare free vs paid users (create custom dimensions)
- Compare by geographic location
- Compare by acquisition channel

### 5. Export Data for Deep Analysis
1. Any report can be exported (top right corner)
2. Export formats: PDF, CSV, Google Sheets
3. Use for presentations or deeper Excel analysis

---

## Troubleshooting

### Not Seeing Events?

1. **Check browser console:** Events logged with `[GA] Event tracked:`
2. **Verify GA tag is loaded:** Check Network tab for `gtag/js`
3. **Check DebugView:** Reports → Admin → DebugView (for real-time debugging)
4. **Wait 24-48 hours:** Some reports have data delay

### Events Showing Wrong Data?

1. Check event parameters in Events report
2. Use DebugView to see raw event data
3. Check code implementation in `src/utils/googleAnalytics.ts`

### Want More Custom Tracking?

Edit `src/utils/googleAnalytics.ts` to add new tracking functions. Follow the pattern:

```typescript
export const trackYourAction = (param1: string, param2: number) => {
  trackGAEvent('your_event_name', {
    param_1: param1,
    param_2: param2,
    event_category: 'Your Category',
    event_label: 'Your Label',
  });
};
```

Then import and use in your components:
```typescript
import { trackYourAction } from '../utils/googleAnalytics';

// In your component:
trackYourAction('value1', 123);
```

---

## Additional Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [GA4 Explorations Guide](https://support.google.com/analytics/answer/9327922)
- [GA4 BigQuery Export](https://support.google.com/analytics/answer/9358801) (for advanced analysis)

---

## Quick Reference: Event Names

Copy this list to quickly find events in GA:

**Authentication:**
- signup_attempt
- signup_success
- login_attempt
- login
- login_error
- password_reset

**Business Actions:**
- product_action
- sale_action
- customer_action
- expense_action
- inventory_action
- report_view
- invoice_generate

**Monetization:**
- view_item_list
- select_item
- begin_checkout
- purchase
- subscription_cancel

**Engagement:**
- page_view
- demo_start
- search
- export_data
- print
- exception
- feature_gate_hit
- settings_change

**Content:**
- blog_view
- contact_form
- cta_click

---

## Next Steps

1. **Set up conversions** for key events (signup_success, purchase)
2. **Create your first custom dashboard** using the templates above
3. **Set up alerts** for critical metrics
4. **Add custom dimensions** for user plan type (free/starter/pro)
5. **Export your first report** to share with your team
6. **Schedule weekly email reports** from GA

Happy tracking! 📊
