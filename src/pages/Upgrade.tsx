import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Shield, AlertCircle, Sun, Moon } from 'lucide-react';
import { plans } from '../utils/plans';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { PayPalOneTimeButton } from '../components/PayPalOneTimeButton';
import { useTheme } from '../contexts/ThemeContext';

export function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = React.useState(location.state?.planId || 'starter');
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const plan = plans.find(p => p.id === selectedPlan);

  const handlePayPalSuccess = () => {
    // Update user plan after successful PayPal payment
    if (user) {
      setUser({
        ...user,
        plan: selectedPlan as any,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    }
    
    navigate('/', { state: { upgraded: true, paymentMethod: 'PayPal' } });
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal payment failed:', error);
    setPaymentError('PayPal payment failed. Please try again.');
  };

  if (!plan) {
    return <div>Plan not found</div>;
  }

  // Convert PHP to USD for PayPal display
  const usdPrice = (plan.price / 56).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade to {plan.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete your subscription to unlock premium features</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Plan Summary */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Plan Summary</h2>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900 dark:text-white">{plan.name} Plan</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">₱{plan.price}/month</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">≈ ${usdPrice} USD</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white">What's included:</h3>
              <ul className="space-y-2">
                {plan.id === 'starter' && (
                  <>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Unlimited products & sales
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Advanced dashboard
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Basic reports & analytics
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Email support
                    </li>
                  </>
                )}
                {plan.id === 'pro' && (
                  <>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Everything in Starter
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      PDF invoice generation
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Advanced reports & goal tracking
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Cash flow analysis
                    </li>
                    <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Priority support
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">30-day money-back guarantee</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Secure Payment with PayPal</h2>

            {/* Error Message */}
            {paymentError && (
              <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-300">{paymentError}</span>
                </div>
              </div>
            )}

            {/* Dark Mode Notice for PayPal */}
            {theme === 'dark' && (
              <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                <div className="flex items-start">
                  <div className="flex items-center mr-3">
                    <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                      PayPal Dark Mode Notice
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                      PayPal's payment forms may appear with dark text on dark backgrounds. For the best experience, you can temporarily switch to light mode during payment.
                    </p>
                    <button
                      onClick={toggleTheme}
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                    >
                      <Sun className="mr-1.5 h-4 w-4" />
                      Switch to Light Mode
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PayPal Information */}
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">PP</span>
                  </div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">PayPal Secure Payment</h3>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                  <p><strong>Amount:</strong> ${usdPrice} USD (≈ ₱{plan.price})</p>
                  <p>PayPal accepts:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>PayPal account balance</li>
                    <li>Credit cards (Visa, Mastercard, American Express)</li>
                    <li>Debit cards</li>
                    <li>Bank accounts</li>
                  </ul>
                  <p className="font-medium">You don't need a PayPal account to pay with your card.</p>
                </div>
              </div>
              
              {/* PayPal Button */}
              <PayPalOneTimeButton
                planId={selectedPlan}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
              />
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white">₱{plan.price}/month</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">${usdPrice} USD</div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-green-800 dark:text-green-300">
                  <p className="font-medium">Secure Payment Processing</p>
                  <p>Your payment is processed securely by PayPal with industry-standard encryption.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              You can cancel anytime.
            </p>
          </div>
        </div>

        {/* PayPal Benefits */}
        <div className="mt-8 rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Why PayPal?</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Secure & Trusted</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PayPal's advanced security protects your financial information
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Multiple Payment Options</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pay with PayPal balance, cards, or bank account
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Global Currency Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatic currency conversion from PHP to USD
              </p>
            </div>
          </div>
        </div>

        {/* PayPal Setup Notice */}
        <div className="mt-8 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">PayPal Integration Setup</h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
            <p>To complete PayPal integration, you need to:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Create a PayPal Developer account at <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline">developer.paypal.com</a></li>
              <li>Create a new app and get your Client ID</li>
              <li>Add <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_PAYPAL_CLIENT_ID=your_client_id</code> to your .env file</li>
              <li>For production, switch to live PayPal environment</li>
              <li>Configure webhook endpoints for payment verification</li>
            </ol>
            <p className="mt-3 font-medium">Current status: <span className="text-yellow-600 dark:text-yellow-400">Demo mode (PayPal sandbox)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}