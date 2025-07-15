# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
  - `VITE_PAYPAL_CLIENT_ID` - PayPal client ID for payments

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: Zustand with persistence
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: PayPal SDK integration
- **PWA**: Vite PWA plugin with offline support

### Key Architectural Patterns

#### State Management
- **Store**: Single Zustand store (`src/store/useStore.ts`) with persistence
- **Offline-first**: Local state syncs with Supabase when online
- **Demo mode**: Special handling for demo accounts (user ID: 'demo-user-id')

#### Data Flow
1. **Supabase Integration**: All data operations go through `src/lib/supabase.ts`
2. **Data Transformations**: Consistent transforms between app and database formats
3. **Error Handling**: Centralized error handling with user-friendly messages

#### Authentication
- **Multi-provider**: Email/password, Google, Facebook via Supabase Auth
- **Demo account**: `demo@businessmanager.com` / `demo123` for testing
- **Session management**: Automatic token refresh and persistence

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main app shell with navigation
│   ├── FeatureGate.tsx # Plan-based feature access control
│   ├── PayPalButton.tsx # PayPal payment integration
│   └── ThemeToggle.tsx # Dark/light mode switching
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── hooks/              # Custom React hooks
├── lib/                # External service integrations
│   └── supabase.ts     # Supabase client and data transformations
├── pages/              # Route-based page components
├── store/              # Zustand state management
│   └── useStore.ts     # Main application store
├── types/              # TypeScript type definitions
│   ├── index.ts        # Core business types
│   └── database.ts     # Supabase-generated types
└── utils/              # Helper functions
```

### Database Schema (Supabase)

#### Core Tables
- `products` - Product catalog with stock tracking
- `sales` - Sales transactions with items and payments
- `customers` - Customer database with credit limits
- `expenses` - Business expense tracking
- `user_settings` - Per-user configuration and subscription info
- `inventory_transactions` - Stock movement tracking

#### Security
- **Row Level Security (RLS)** enabled on all tables
- **User-based isolation** using `user_id` column
- **Automatic user context** in all queries

### Payment Integration

#### PayPal Setup
- Uses PayPal SDK for secure payments
- Supports subscriptions for plan upgrades
- Handles currency conversion (PHP to USD)
- Webhook verification for payment confirmation

#### Subscription Plans
- **Free**: Limited features (10 products, 30 sales/month)
- **Starter**: ₱199/month - Unlimited products/sales
- **Pro**: ₱499/month - All features including PDF invoices

### Offline/PWA Features

#### Service Worker
- Custom service worker in `src/service-worker.ts`
- Caches static assets and API responses
- Background sync for offline operations

#### Offline Data Handling
- **Local storage**: Zustand persistence for offline capability
- **Conflict resolution**: Optimistic updates with server reconciliation
- **Sync indicators**: Visual feedback for sync status

### Development Guidelines

#### Code Style
- Follow existing TypeScript patterns
- Use Tailwind CSS classes for styling
- Implement proper error boundaries
- Add loading states for async operations

#### Data Operations
- Always use the store actions for data modifications
- Handle both demo and real user modes
- Implement proper error handling with user feedback
- Use consistent data transformation patterns

#### Testing
- Demo account provides full feature testing
- Use environment variables for configuration
- Test offline functionality thoroughly

### Common Patterns

#### Feature Gating
```typescript
import { getEffectivePlan } from '../store/useStore';

// Check user plan for feature access
const userPlan = getEffectivePlan(user);
const hasFeature = userPlan !== 'free';
```

#### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  throw error; // Re-throw for UI handling
}
```

#### Offline Support
```typescript
// Store checks for demo mode automatically
if (user.id === 'demo-user-id') {
  // Local state update only
} else {
  // Update both local state and Supabase
}
```

### Deployment Notes

#### Build Configuration
- Vite handles bundling with code splitting
- PWA manifest configured for mobile installation
- Environment variables must be prefixed with `VITE_`

#### Database Migrations
- SQL files in `supabase/migrations/` directory
- Run migrations through Supabase dashboard
- Include in deployment checklist

### Troubleshooting

#### Common Issues
- **Auth initialization**: Check environment variables
- **Database connection**: Verify Supabase URL and key
- **Payment issues**: Confirm PayPal client ID
- **Offline sync**: Check network connectivity handling

#### Demo Mode
- Use demo credentials for testing: `demo@businessmanager.com` / `demo123`
- Demo data is pre-populated and resets on logout
- All features available in demo mode