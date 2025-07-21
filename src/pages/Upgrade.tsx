import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Shield, AlertCircle, Sun, Moon } from 'lucide-react';
import { plans } from '../utils/plans';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { PayPalSubscriptionButton } from '../components/PayPalSubscriptionButton';
import { useTheme } from '../contexts/ThemeContext';

export function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = React.useState(location.state?.planId || 'starter');
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [paypalPlanId, setPaypalPlanId] = React.useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = React.useState(true);
  const [isSettingUpPayPal, setIsSettingUpPayPal] = React.useState(false);

  const plan = plans.find(p => p.id === selectedPlan);

  // Fetch PayPal Plan ID from database
  React.useEffect(() => {
    const fetchPayPalPlanId = async () => {
      try {
        setLoadingPlanId(true);
        const { supabase } = await import('../lib/supabase');
        
        // Map our plan IDs to PayPal product IDs
        const paypalProductId = selectedPlan === 'starter' ? 'BIZMANAGER_STARTER' : 'BIZMANAGER_PRO';
        
        const { data, error } = await supabase
          .from('paypal_billing_plans')
          .select('paypal_plan_id')
          .eq('paypal_product_id', paypalProductId)
          .eq('status', 'ACTIVE')
          .single();
          
        if (error) {
          console.error('Error fetching PayPal plan ID:', error);
          setPaymentError('Unable to load payment options. Please try again.');
        } else {
          setPaypalPlanId(data.paypal_plan_id);
        }
      } catch (error) {
        console.error('Error fetching PayPal plan ID:', error);
        setPaymentError('Unable to load payment options. Please try again.');
      } finally {
        setLoadingPlanId(false);
      }
    };

    fetchPayPalPlanId();
  }, [selectedPlan]);

  const handlePayPalSubscriptionSuccess = async (subscriptionId: string) => {
    console.log('Subscription created successfully:', subscriptionId);
    
    // Navigate to success page - webhook will handle the actual subscription activation
    navigate('/profile', { 
      state: { 
        subscriptionCreated: true, 
        subscriptionId: subscriptionId,
        planName: plan?.name 
      } 
    });
  };

  const handlePayPalError = (error: Error | unknown) => {
    console.error('PayPal payment failed:', error);
    setPaymentError('PayPal payment failed. Please try again.');
  };

  // Set up PayPal products and plans
  const setupPayPalProducts = async () => {
    setIsSettingUpPayPal(true);
    setPaymentError(null);
    
    try {
      const { supabase } = await import('../lib/supabase');
      
      console.log('Setting up PayPal products...');
      const { data, error } = await supabase.functions.invoke('setup-paypal-products', {
        body: {}
      });
      
      if (error) {
        console.error('PayPal setup error:', error);
        throw new Error(error.message || 'Failed to setup PayPal products');
      }
      
      console.log('PayPal setup successful:', data);
      
      // Refresh the page to reload the plan IDs
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to setup PayPal products:', error);
      setPaymentError('Failed to setup PayPal products. Please ensure PayPal credentials are configured.');
    } finally {
      setIsSettingUpPayPal(false);
    }
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
          <p className="text-gray-600 dark:text-gray-400">Start your monthly subscription to unlock premium features. Cancel anytime.</p>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">≈ ${usdPrice} USD monthly</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">🔄 Auto-renewing</div>
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
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">14-day money-back guarantee</span>
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
              
              {/* PayPal Subscription Button */}
              {loadingPlanId ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading payment options...</span>
                </div>
              ) : paypalPlanId ? (
                <PayPalSubscriptionButton
                  planId={paypalPlanId}
                  planName={plan?.name || selectedPlan}
                  onSuccess={handlePayPalSubscriptionSuccess}
                  onError={handlePayPalError}
                />
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                      PayPal subscription products need to be set up first.
                    </p>
                    <button
                      onClick={setupPayPalProducts}
                      disabled={isSettingUpPayPal}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSettingUpPayPal ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Setting up PayPal...
                        </>
                      ) : (
                        'Setup PayPal Products'
                      )}
                    </button>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      This is a one-time setup process
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Monthly Total</span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white">₱{plan.price}/month</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">${usdPrice} USD recurring</div>
                </div>
              </div>
            </div>

            {/* Auto-Renewal Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium">Auto-Renewing Subscription</p>
                  <p>Your subscription will automatically renew monthly. Cancel anytime from your profile settings - no cancellation fees.</p>
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

      </div>
    </div>
  );
}