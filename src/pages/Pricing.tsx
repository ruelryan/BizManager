import React from 'react';
import { Check, Crown, Star, ArrowRight, AlertCircle, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { plans } from '../utils/plans';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';

export function Pricing() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  const features = [
    'Product Management',
    'Sales Tracking',
    'Customer Management',
    'Basic Dashboard',
    'Inventory Tracking',
    'Basic Reports',
    'PDF Invoice Generation',
    'Advanced Reports',
    'Goal Tracking',
    'Cash Flow Analysis',
    'Priority Support',
    'Data Export',
  ];

  const planFeatures = {
    free: [
      'Up to 10 products',
      'Up to 30 sales/month',
      'Basic dashboard',
      'Customer management',
      'Inventory tracking',
    ],
    starter: [
      'Unlimited products',
      'Unlimited sales',
      'Advanced dashboard',
      'Customer management',
      'Inventory tracking',
      'Basic reports',
      'Email support',
    ],
    pro: [
      'Everything in Starter',
      'PDF invoice generation',
      'Advanced reports',
      'Goal tracking',
      'Cash flow analysis',
      'Priority support',
      'Data export',
      'Custom branding',
    ],
  };

  const getPrice = (plan: any) => {
    if (plan.price === 0) return 'Free';
    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price; // 2 months free on yearly
    return `₱${price}`;
  };

  const getPeriod = () => {
    return billingCycle === 'yearly' ? '/year' : '/month';
  };

  const handleUpgradeClick = (planId: string) => {
    if (user) {
      navigate('/upgrade', { state: { planId } });
    } else {
      navigate('/login', { state: { from: '/upgrade' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between p-4">
        <Link
          to="/"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          <Home className="mr-2 h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Scale your business with the right tools for your needs
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="ml-1 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                Save 2 months
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white dark:bg-gray-800 p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-sm font-medium text-white">
                    <Star className="mr-1 h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {getPrice(plan)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xl text-gray-500 dark:text-gray-400 ml-1">
                      {getPeriod()}
                    </span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ₱{plan.price}/month billed yearly
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {planFeatures[plan.id as keyof typeof planFeatures].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-8">
                {user?.plan === plan.id ? (
                  <div className="w-full rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-center text-sm font-medium text-green-800 dark:text-green-300">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgradeClick(plan.id)}
                    className={`flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PayPal Integration Notice */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Secure Payment with PayPal
                </h3>
                <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                  <p>We use PayPal for secure payment processing worldwide!</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Secure payment processing with industry-standard encryption</li>
                    <li>Accept PayPal balance, credit cards, debit cards, and bank accounts</li>
                    <li>Automatic currency conversion from PHP to USD</li>
                    <li>No PayPal account required - pay directly with your card</li>
                    <li>Instant plan activation upon successful payment</li>
                    <li>A PayPal account is required for subscription payments</li>
                  </ul>
                  <p className="font-medium mt-3">
                    PayPal handles all payment methods securely, so you can pay however you prefer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our Free plan gives you access to core features forever. No credit card required.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major payment methods through PayPal: credit cards, debit cards, bank accounts, and PayPal balance.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is PayPal payment secure?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, all PayPal transactions are processed securely through PayPal's encrypted payment system with buyer protection.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do I need a PayPal account?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, you can pay directly with your credit or debit card through PayPal without creating an account.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to grow your business?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of businesses already using BizManager
            </p>
            <button
              onClick={() => handleUpgradeClick('starter')}
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-lg font-medium text-blue-600 transition-colors hover:bg-gray-100"
            >
              <Crown className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}