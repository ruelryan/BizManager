import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building, ArrowLeft, Check, Shield } from 'lucide-react';
import { plans } from '../utils/plans';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';

export function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [selectedPlan, setSelectedPlan] = React.useState(location.state?.planId || 'starter');
  const [paymentMethod, setPaymentMethod] = React.useState<'gcash' | 'card' | 'bank'>('gcash');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const plan = plans.find(p => p.id === selectedPlan);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update user plan
    if (user) {
      setUser({
        ...user,
        plan: selectedPlan as any,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    }
    
    setIsProcessing(false);
    navigate('/', { state: { upgraded: true } });
  };

  if (!plan) {
    return <div>Plan not found</div>;
  }

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
                <span className="text-2xl font-bold text-gray-900 dark:text-white">₱{plan.price}/month</span>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payment Method</h2>

            {/* Payment Method Selection */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <input
                  type="radio"
                  name="payment"
                  value="gcash"
                  checked={paymentMethod === 'gcash'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <Smartphone className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">GCash</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Pay with your GCash wallet</div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <CreditCard className="mr-3 h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Visa, Mastercard, etc.</div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <Building className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Bank Transfer</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Direct bank transfer</div>
                </div>
              </label>
            </div>

            {/* Payment Form Fields */}
            {paymentMethod === 'gcash' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GCash Number
                  </label>
                  <input
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Bank Transfer Instructions</h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <p><strong>Account Name:</strong> BizManager Philippines</p>
                  <p><strong>Account Number:</strong> 1234-5678-9012</p>
                  <p><strong>Bank:</strong> BPI</p>
                  <p><strong>Amount:</strong> ₱{plan.price}</p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">₱{plan.price}/month</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Subscribe to ${plan.name} - ₱${plan.price}/month`
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              You can cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}