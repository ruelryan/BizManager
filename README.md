# BizManager - Business Management System

A comprehensive business management solution built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### 🏪 **Core Business Management**
- **Product Management**: Add, edit, and track products with categories, pricing, and stock levels
- **Sales Tracking**: Record sales transactions with multiple payment methods
- **Customer Management**: Maintain customer database with contact information and purchase history
- **Inventory Management**: Track stock levels with low-stock alerts and inventory transactions

### 📊 **Analytics & Reporting**
- **Dashboard**: Real-time business metrics and key performance indicators
- **Sales Reports**: Detailed sales analytics with charts and trends
- **Product Performance**: Track best-selling products and revenue by category
- **Cash Flow Analysis**: Monitor income, expenses, and profit margins

### 💼 **Professional Features**
- **PDF Invoice Generation**: Create professional invoices (Pro plan)
- **Goal Tracking**: Set and monitor monthly revenue goals
- **Multi-Plan Support**: Free, Starter, and Pro plans with different feature sets
- **Dark Mode**: Beautiful dark/light theme support

### 💳 **Payment Integration**
- **PayPal Integration**: Secure international payments through PayPal
- **Local Payment Methods**: GCash, Bank Transfer, Credit/Debit Cards
- **Automatic Currency Conversion**: PHP to USD for PayPal transactions
- **Subscription Management**: Automated plan upgrades and renewals

### 🔄 **Offline-First Architecture**
- **Offline Capability**: Works seamlessly without internet connection
- **Auto-Sync**: Automatic synchronization when connection is restored
- **PWA Support**: Install as a mobile/desktop app
- **Real-time Updates**: Live data synchronization across devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payment Processing**: PayPal SDK
- **State Management**: Zustand with persistence
- **Offline Storage**: LocalForage (IndexedDB)
- **Charts**: Recharts
- **PDF Generation**: React-PDF
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd bizmanager
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up PayPal Integration

1. Create a PayPal Developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a new app in your PayPal Developer Dashboard
3. Get your Client ID and Client Secret
4. Add PayPal credentials to your `.env` file:
```env
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

For production, you'll also need to:
- Create subscription plans in PayPal
- Set up webhook endpoints for payment verification
- Configure Supabase Edge Functions for payment processing

### 4. Set Up Database

Run the migration files in your Supabase SQL editor:

1. **Create Schema**: Run `supabase/migrations/create_business_schema.sql`
2. **Add Sample Data**: Run `supabase/migrations/add_sample_sales.sql`

### 5. Start Development
```bash
npm run dev
```

## PayPal Integration

### Setup Steps

1. **PayPal Developer Account**
   - Sign up at [developer.paypal.com](https://developer.paypal.com)
   - Create a new application
   - Note your Client ID and Client Secret

2. **Environment Variables**
   ```env
   VITE_PAYPAL_CLIENT_ID=your_client_id_here
   ```

3. **Subscription Plans** (Optional)
   - Create subscription plans in PayPal Dashboard
   - Add plan IDs to environment variables
   ```env
   VITE_PAYPAL_PLAN_ID_STARTER=your_starter_plan_id
   VITE_PAYPAL_PLAN_ID_PRO=your_pro_plan_id
   ```

4. **Webhook Configuration**
   - Set up webhooks in PayPal Dashboard
   - Point to your Supabase Edge Function endpoint
   - Configure payment verification logic

### Payment Flow

1. User selects PayPal as payment method
2. PayPal SDK creates secure payment session
3. User completes payment on PayPal
4. PayPal returns payment confirmation
5. System verifies payment and updates user subscription
6. User gains access to premium features

### Currency Handling

- Prices are displayed in PHP (Philippine Peso)
- PayPal processes payments in USD
- Automatic currency conversion at current exchange rates
- Exchange rate: ~₱56 = $1 USD (approximate)

## Database Schema

### Tables

#### Products
- Product catalog with pricing, stock, and categories
- Automatic stock updates on sales
- Low-stock alerts and inventory tracking

#### Sales
- Complete sales transactions with items and payments
- Support for multiple payment methods
- Customer linking and receipt generation

#### Customers
- Customer database with contact information
- Purchase history and account balances
- Credit limit management

#### Inventory Transactions
- Detailed stock movement tracking
- Automatic entries on sales
- Manual stock adjustments with reasons

#### User Settings
- Per-user business configuration
- Monthly goals and preferences
- Business information for invoices

### Security

- **Row Level Security (RLS)** enabled on all tables
- **User-based access control** for multi-tenant support
- **Secure authentication** with Supabase Auth
- **Data validation** with database constraints

## Features by Plan

### 🆓 **Free Plan**
- Up to 10 products
- Up to 30 sales per month
- Basic dashboard and inventory
- Customer management

### ⭐ **Starter Plan** - ₱199/month
- Unlimited products and sales
- Advanced dashboard
- Basic reports and analytics
- Email support

### 👑 **Pro Plan** - ₱499/month
- Everything in Starter
- PDF invoice generation
- Advanced reports and goal tracking
- Cash flow analysis
- Priority support
- Data export capabilities

## Payment Methods

### International
- **PayPal**: Secure payment processing for global customers
- **Credit/Debit Cards**: Via PayPal gateway

### Philippines
- **GCash**: Mobile wallet payments
- **Bank Transfer**: Direct bank transfers
- **Credit/Debit Cards**: Local card processing

## Offline Capabilities

### Smart Sync System
- **Optimistic Updates**: UI responds immediately
- **Conflict Resolution**: Handles data conflicts intelligently
- **Retry Logic**: Automatic retry for failed syncs
- **Visual Indicators**: Clear sync status and pending items

### PWA Features
- **Installable**: Add to home screen on mobile/desktop
- **Offline-First**: Core functionality works without internet
- **Background Sync**: Syncs data when connection returns
- **Push Notifications**: Order updates and alerts (future)

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── PayPalButton.tsx # PayPal payment integration
│   └── ...
├── pages/              # Main application pages
├── store/              # Zustand state management
├── lib/                # Supabase client and utilities
├── types/              # TypeScript type definitions
├── utils/              # Helper functions and utilities
└── contexts/           # React contexts (theme, etc.)
```

### Key Components
- **Layout**: Main app shell with navigation
- **FeatureGate**: Plan-based feature access control
- **PayPalButton**: Secure payment processing
- **ThemeToggle**: Dark/light mode switching
- **Store**: Centralized state with offline sync

### Build and Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your preferred hosting platform
```

## Security Considerations

### PayPal Security
- Client-side integration uses PayPal SDK
- Payment verification happens server-side
- No sensitive PayPal credentials exposed to frontend
- Webhook verification for payment confirmation

### Data Protection
- All user data isolated by Row Level Security
- Encrypted data transmission
- Secure authentication with Supabase
- No payment data stored locally

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub issues
- **Feature Requests**: Submit via GitHub discussions
- **Email**: Contact support for Pro plan users

---

Built with ❤️ for small and medium businesses to manage their operations efficiently.