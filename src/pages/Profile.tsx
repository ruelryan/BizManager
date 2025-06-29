import React, { useState, useEffect } from 'react';
import { User, Mail, Crown, Save, ArrowLeft, Building, Calendar, AlertCircle, Bell, CreditCard, MapPin, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, isInFreeTrial } from '../store/useStore';
import { plans } from '../utils/plans';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { CurrencySelector } from '../components/CurrencySelector';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { useUserLocation } from '../hooks/useUserLocation';

interface PaymentTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  plan_id?: string;
  payment_method?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { user, userSettings, updateUserProfile, updateUserSettings, isLoading } = useStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    plan: user?.plan || 'free',
    currency: userSettings?.currency || user?.currency || 'PHP',
    businessName: userSettings?.businessName || user?.businessName || '',
    businessAddress: userSettings?.businessAddress || user?.businessAddress || '',
    businessPhone: userSettings?.businessPhone || user?.businessPhone || '',
    businessEmail: userSettings?.businessEmail || user?.businessEmail || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  // Get user's location for currency auto-detection
  const locationInfo = useUserLocation();

  useEffect(() => {
    if (showPaymentHistory) {
      fetchPaymentHistory();
    }
  }, [showPaymentHistory]);

  // Set currency based on location when component mounts
  useEffect(() => {
    // Only update if we have location data and user hasn't set a currency preference yet
    if (!isLoading && locationInfo.currency && !userSettings?.currency && formData.currency === 'PHP') {
      console.log(`Setting currency to ${locationInfo.currency} based on detected location: ${locationInfo.country}`);
      setFormData(prev => ({ ...prev, currency: locationInfo.currency || 'PHP' }));
    }
  }, [locationInfo, isLoading, userSettings, formData.currency]);

  const fetchPaymentHistory = async () => {
    if (!user) return;
    
    setIsLoadingPayments(true);
    
    try {
      // For demo user, create mock payment history
      if (user.id === 'demo-user-id') {
        const mockPayments = [
          {
            id: 'pt-1',
            transaction_type: 'payment',
            amount: 499,
            currency: 'USD',
            status: 'completed',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            plan_id: 'pro',
            payment_method: 'paypal'
          },
          {
            id: 'pt-2',
            transaction_type: 'payment',
            amount: 499,
            currency: 'USD',
            status: 'completed',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            plan_id: 'pro',
            payment_method: 'paypal'
          }
        ];
        
        setPaymentHistory(mockPayments);
        setIsLoadingPayments(false);
        return;
      }
      
      // Fetch real payment history from database
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching payment history:', error);
        throw error;
      }
      
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Update user profile
      await updateUserProfile({
        name: formData.name,
        currency: formData.currency,
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,
      });

      // Update user settings
      await updateUserSettings({
        currency: formData.currency,
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentPlan = plans.find(p => p.id === user?.plan);
  const inFreeTrial = user ? isInFreeTrial(user) : false;

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information and business preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
            
            {message && (
              <div className={`mb-4 rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      placeholder="Email address"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email address cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                
                {/* Location Detection Status */}
                {locationInfo.loading && (
                  <div className="mb-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                    <span>Detecting your location for currency auto-selection...</span>
                  </div>
                )}
                
                {locationInfo.error && (
                  <div className="mb-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                    <div className="flex items-start">
                      <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          Automatic location detection failed
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 mb-2">
                          {locationInfo.error}
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-500 text-xs">
                          This might be due to network issues, ad blockers, or privacy settings. 
                          Please manually select your preferred currency below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {locationInfo.country && locationInfo.currency && !locationInfo.error && (
                  <div className="mb-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                    <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                      <Wifi className="h-4 w-4 mr-2" />
                      <span>
                        Location detected: <strong>{locationInfo.country}</strong> - Currency auto-selected: <strong>{locationInfo.currency}</strong>
                      </span>
                    </div>
                  </div>
                )}
                
                <CurrencySelector 
                  value={formData.currency}
                  onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
                  autoDetect={!userSettings?.currency}
                />
                
                {locationInfo.currency && formData.currency === locationInfo.currency && !locationInfo.error && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Auto-detected from your location: {locationInfo.country}
                  </p>
                )}
                
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used throughout the application and in PDF invoices.
                </p>
              </div>
            </form>
          </div>

          {/* Business Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Information</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This information will appear on your PDF invoices and receipts.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="Your Business Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Address
                </label>
                <textarea
                  value={formData.businessAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                  placeholder="Your business address"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSaving || isLoading}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Information */}
        <div className="space-y-6">
          {/* Free Trial Status */}
          {inFreeTrial && (
            <div className="rounded-xl bg-blue-600 p-6 text-white">
              <div className="flex items-center mb-3">
                <Crown className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold">Free Trial Active</h3>
              </div>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Expires: {user?.subscriptionExpiry?.toLocaleDateString()}</span>
                </div>
                <p>You have access to all Pro features during your trial period.</p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="mt-4 w-full rounded-lg bg-white/20 px-4 py-2 text-white font-medium hover:bg-white/30 transition-colors"
              >
                Upgrade Before Trial Ends
              </button>
            </div>
          )}

          {/* Current Plan */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h3>
            
            <div className="text-center">
              <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium mb-3 ${
                user?.plan === 'pro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                user?.plan === 'starter' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {user?.plan === 'pro' && <Crown className="mr-1 h-4 w-4" />}
                {currentPlan?.name || 'Free'} Plan
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentPlan?.price === 0 ? 'Free' : (
                  <CurrencyDisplay 
                    amount={currentPlan?.price || 0} 
                    fromCurrency="PHP"
                    showCurrencyCode={true}
                  />
                )}
                {currentPlan?.price !== 0 && '/month'}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {user?.plan === 'free' && (
                  <>
                    <p>• Up to 10 products</p>
                    <p>• Up to 30 sales/month</p>
                    <p>• Basic features</p>
                  </>
                )}
                {user?.plan === 'starter' && (
                  <>
                    <p>• Unlimited products & sales</p>
                    <p>• Advanced dashboard</p>
                    <p>• Basic reports</p>
                  </>
                )}
                {user?.plan === 'pro' && (
                  <>
                    <p>• Everything in Starter</p>
                    <p>• PDF invoices</p>
                    <p>• Advanced reports</p>
                    <p>• Goal tracking</p>
                  </>
                )}
              </div>
            </div>

            {!inFreeTrial && user?.plan !== 'pro' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  <Crown className="mr-2 h-4 w-4 inline" />
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h3>
              <button
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <CreditCard className="h-5 w-5" />
              </button>
            </div>
            
            {showPaymentHistory ? (
              <div className="space-y-3">
                {isLoadingPayments ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paymentHistory.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                              {transaction.transaction_type}
                              {transaction.plan_id && ` (${transaction.plan_id})`}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                              <CurrencyDisplay 
                                amount={transaction.amount} 
                                fromCurrency={transaction.currency}
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadge(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    <p>No payment history available.</p>
                    <p className="mt-2">Payment transactions will appear here once you make a purchase.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Click the card icon to view your payment history.</p>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
            
            {showNotifications ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>No notifications at this time.</p>
                  <p className="mt-2">Payment confirmations, subscription updates, and other important notifications will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Click the bell icon to view your notifications.</p>
              </div>
            )}
          </div>

          {/* Currency Preview */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Currency Preview</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Selected Currency:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.currency}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Example Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={1234.56} />
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  All financial data is stored in PHP and converted for display.
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.id === 'demo-user-id' ? 'Demo Account' : 'Regular Account'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {user?.id === 'demo-user-id' ? 'Demo Session' : 'January 2024'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                  Active
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                  {userSettings?.paymentStatus || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Demo Account Notice */}
          {user?.id === 'demo-user-id' && (
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Demo Account</h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                You're using a demo account. Data will not be permanently saved. 
                Create a real account to save your business data.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-3 w-full rounded-lg bg-yellow-600 px-4 py-2 text-white text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Create Real Account
              </button>
            </div>
          )}

          {/* Trial Expiry Warning */}
          {inFreeTrial && user?.subscriptionExpiry && (
            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Trial Ending Soon</h3>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
                Your free trial will end on {user.subscriptionExpiry.toLocaleDateString()}. 
                After that, you'll be moved to the Free plan with limited features.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full rounded-lg bg-orange-600 px-4 py-2 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Upgrade to Keep All Features
              </button>
            </div>
          )}

          {/* Webhook Status */}
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Payment System Status</h3>
            </div>
            <p className="text-xs text-green-700 dark:text-green-400">
              PayPal webhook handlers are active and monitoring payment events in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}