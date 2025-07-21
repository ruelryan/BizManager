import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Shield, AlertCircle, Sun, Moon, Star, Zap, Crown, CreditCard, Lock, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-colors duration-500">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mb-8 px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Previous Page
          </button>
          
          {/* Plan Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
            {plan.id === 'starter' ? (
              <Zap className="h-8 w-8 text-white" />
            ) : (
              <Crown className="h-8 w-8 text-white" />
            )}
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Upgrade to {plan.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your business management experience with premium features and unlimited access.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-5 lg:grid-cols-3">
          {/* Plan Summary - Enhanced */}
          <div className="xl:col-span-2 lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-gray-200 dark:border-gray-700 h-full">
              {/* Premium Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Plan Summary</h2>
            
              {/* Plan Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  {plan.id === 'starter' ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name} Plan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Perfect for growing businesses</p>
                  </div>
                </div>
                
                {/* Pricing Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">₱{plan.price}</span>
                      <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">≈ ${usdPrice} USD monthly</div>
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-renewing
                    </div>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What's included:</h3>
                <div className="space-y-3">
                  {plan.id === 'starter' && (
                    <>
                      <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Unlimited products & sales</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">No more limits on your inventory</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Advanced dashboard</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Enhanced insights and metrics</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Basic reports & analytics</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Track your business performance</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Email support</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Get help when you need it</p>
                        </div>
                      </div>
                    </>
                  )}
                  {plan.id === 'pro' && (
                    <>
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Everything in Starter</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">All starter features included</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">PDF invoice generation</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Professional invoices for clients</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Advanced reports & goal tracking</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Detailed business analytics</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Cash flow analysis</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Understand your money flow</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Priority support</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Get faster response times</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Money-back Guarantee */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center">
                  <Shield className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div className="text-center">
                    <span className="block text-sm font-semibold text-blue-900 dark:text-blue-300">14-Day Money-Back Guarantee</span>
                    <span className="text-xs text-blue-700 dark:text-blue-400">Risk-free trial period</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form - Enhanced */}
          <div className="xl:col-span-3 lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl border border-gray-200 dark:border-gray-700 h-full">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Payment with PayPal</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Protected by industry-standard encryption</p>
                </div>
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="mb-8 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Payment Error</h3>
                      <span className="text-sm text-red-700 dark:text-red-400">{paymentError}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dark Mode Notice for PayPal */}
              {theme === 'dark' && (
                <div className="mb-8 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                      <Sun className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                        PayPal Dark Mode Notice
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4 leading-relaxed">
                        PayPal's payment forms may appear with dark text on dark backgrounds. For the best experience, you can temporarily switch to light mode during payment.
                      </p>
                      <button
                        onClick={toggleTheme}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Switch to Light Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Information - Enhanced */}
              <div className="space-y-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-bold">PP</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">PayPal Secure Payment</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Trusted by millions worldwide</p>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Amount:</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${usdPrice} USD</span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">(≈ ₱{plan.price})</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">PayPal accepts:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">PayPal balance</span>
                      </div>
                      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Credit cards</span>
                      </div>
                      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Debit cards</span>
                      </div>
                      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Bank accounts</span>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300 text-center">
                        💡 You don't need a PayPal account to pay with your card
                      </p>
                    </div>
                  </div>
                </div>
              
                {/* PayPal Subscription Button - Enhanced */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  {loadingPlanId ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <span className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading payment options...</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Preparing your secure payment</span>
                    </div>
                  ) : paypalPlanId ? (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ready to upgrade?</h3>
                      <PayPalSubscriptionButton
                        planId={paypalPlanId}
                        planName={plan?.name || selectedPlan}
                        onSuccess={handlePayPalSubscriptionSuccess}
                        onError={handlePayPalError}
                      />
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Setup Required</h3>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-6">
                          PayPal subscription products need to be set up first.
                        </p>
                        <button
                          onClick={setupPayPalProducts}
                          disabled={isSettingUpPayPal}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {isSettingUpPayPal ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                              Setting up PayPal...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-3 h-5 w-5" />
                              Setup PayPal Products
                            </>
                          )}
                        </button>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
                          This is a one-time setup process
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total - Enhanced */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-6 border-t-4 border-blue-500 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Monthly Total</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Billed monthly, cancel anytime</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₱{plan.price}</span>
                    <span className="text-xl text-gray-600 dark:text-gray-400">/month</span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">${usdPrice} USD recurring</div>
                  </div>
                </div>
              </div>

              {/* Important Notices - Enhanced */}
              <div className="space-y-4">
                {/* Auto-Renewal Notice */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Auto-Renewing Subscription</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                        Your subscription will automatically renew monthly. Cancel anytime from your profile settings - no cancellation fees.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300 mb-2">Secure Payment Processing</p>
                      <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                        Your payment is processed securely by PayPal with industry-standard encryption and fraud protection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  By subscribing, you agree to our <span className="font-medium text-blue-600 dark:text-blue-400">Terms of Service</span> and <span className="font-medium text-blue-600 dark:text-blue-400">Privacy Policy</span>.<br />
                  You can cancel anytime with no hidden fees.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal Benefits - Enhanced */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why PayPal?</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">Trusted by millions of businesses worldwide</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure & Trusted</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                PayPal's advanced security and fraud protection keeps your financial information safe with industry-leading encryption
              </p>
            </div>
            
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multiple Payment Options</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Pay with PayPal balance, credit cards, debit cards, or bank account - all in one secure platform
              </p>
            </div>
            
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg font-bold">₱$</span>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Global Currency Support</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Seamless automatic currency conversion from PHP to USD with competitive exchange rates
              </p>
            </div>
          </div>
          
          {/* Additional Benefits */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Buyer Protection</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get refunds for eligible purchases if something goes wrong, with PayPal's purchase protection
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Protection</h5>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your financial details are never shared with merchants, keeping your information private and secure
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}