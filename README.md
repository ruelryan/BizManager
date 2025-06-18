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

### 🔄 **Offline-First Architecture**
- **Offline Capability**: Works seamlessly without internet connection
- **Auto-Sync**: Automatic synchronization when connection is restored
- **PWA Support**: Install as a mobile/desktop app
- **Real-time Updates**: Live data synchronization across devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
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

### 3. Set Up Database

Run the migration files in your Supabase SQL editor:

1. **Create Schema**: Run `supabase/migrations/create_business_schema.sql`
2. **Add Sample Data**: Run `supabase/migrations/add_sample_sales.sql`

### 4. Start Development
```bash
npm run dev
```

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