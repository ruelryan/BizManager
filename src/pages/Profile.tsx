import React from 'react';
import { User, Mail, Crown, Save, ArrowLeft, Globe, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { plans } from '../utils/plans';

const currencies = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

export function Profile() {
  const navigate = useNavigate();
  const { user, userSettings, updateUserProfile, updateUserSettings, isLoading } = useStore();
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    plan: user?.plan || 'free',
    currency: userSettings?.currency || user?.currency || 'PHP',
    businessName: userSettings?.businessName || user?.businessName || '',
    businessAddress: userSettings?.businessAddress || user?.businessAddress || '',
    businessPhone: userSettings?.businessPhone || user?.businessPhone || '',
    businessEmail: userSettings?.businessEmail || user?.businessEmail || '',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const selectedCurrency = currencies.find(c => c.code === formData.currency);

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
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
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
                {currentPlan?.price === 0 ? 'Free' : `${selectedCurrency?.symbol}${currentPlan?.price}/month`}
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

            {user?.plan !== 'pro' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Crown className="mr-2 h-4 w-4 inline" />
                  Upgrade Plan
                </button>
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
                  {selectedCurrency?.name} ({selectedCurrency?.code})
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                <span className="font-medium text-gray-900 dark:text-white text-lg">
                  {selectedCurrency?.symbol}
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Example: {selectedCurrency?.symbol}1,234.56
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
        </div>
      </div>
    </div>
  );
}