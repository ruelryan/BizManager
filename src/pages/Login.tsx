import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Mail, Lock, Eye, EyeOff, Crown, Star, Package, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ThemeToggle } from '../components/ThemeToggle';

export function Login() {
  const navigate = useNavigate();
  const { signIn, isLoading } = useStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showSignUp, setShowSignUp] = React.useState(false);
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
      await signIn(formData.email, formData.password, formData.plan);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  const handleGoogleSignUp = () => {
    // In a real app, this would integrate with Google OAuth
    alert('Google Sign-up would be implemented here with OAuth integration');
  };

  const handleFacebookSignUp = () => {
    // In a real app, this would integrate with Facebook OAuth
    alert('Facebook Sign-up would be implemented here with OAuth integration');
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

  if (showSignUp) {
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
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create your account</p>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sign up with</h2>
                
                {/* Social Sign Up Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                  
                  <button
                    onClick={handleFacebookSignUp}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => setShowSignUp(false)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Sign in
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Demo Available</h3>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p>You can also try the demo version by going back to sign in with the demo credentials.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Demo Mode Notice */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Demo Mode</h3>
            <div className="text-sm text-green-700 dark:text-green-400">
              <p>This demo works offline with sample data. For full functionality with Supabase integration, set up your environment variables.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => setShowSignUp(true)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign up for free
              </button>
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