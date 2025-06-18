import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Mail, Lock, Eye, EyeOff, Crown, Star, Package, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';

export function Login() {
  const navigate = useNavigate();
  const { signIn, isLoading } = useStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    email: 'demo@businessmanager.com',
    password: 'demo123',
    plan: 'free' as 'free' | 'starter' | 'pro',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // For demo purposes, we'll simulate different plans
      // In a real app, you would authenticate with Supabase
      await signIn(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  const planOptions = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Basic features with limitations',
      icon: Package,
      color: 'text-gray-600 dark:text-gray-400',
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      description: 'Unlimited products & basic reports',
      icon: Star,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'All features including PDF invoices & advanced analytics',
      icon: Crown,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mb-4 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BizManager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Plan to Test
              </label>
              <div className="space-y-2">
                {planOptions.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <label
                      key={plan.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.plan === plan.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={formData.plan === plan.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value as any }))}
                        className="sr-only"
                      />
                      <IconComponent className={`h-5 w-5 mr-3 ${plan.color}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {plan.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.description}
                        </div>
                      </div>
                      {formData.plan === plan.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                `Sign In as ${planOptions.find(p => p.id === formData.plan)?.name}`
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Demo Credentials</h3>
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p><strong>Email:</strong> demo@businessmanager.com</p>
              <p><strong>Password:</strong> demo123</p>
            </div>
          </div>

          {/* Plan Testing Info */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Testing Different Plans</h3>
            <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <p><strong>Free:</strong> Limited to 10 products, basic features only</p>
              <p><strong>Starter:</strong> Unlimited products, basic reports</p>
              <p><strong>Pro:</strong> All features including PDF invoices & advanced analytics</p>
            </div>
          </div>

          {/* Supabase Setup Notice */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">Supabase Setup Required</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-400">
              <p>To enable full functionality, please set up your Supabase project and add the environment variables to your .env file.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Sign up for free
              </a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Trusted by businesses worldwide</p>
          <div className="flex justify-center space-x-8 text-xs text-gray-500 dark:text-gray-500">
            <span>✓ Secure & Reliable</span>
            <span>✓ 24/7 Support</span>
            <span>✓ Free Plan Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}