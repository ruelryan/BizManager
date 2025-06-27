import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Zap,
  Globe,
  Shield,
  Smartphone,
  Cloud,
  ArrowRight,
  Check
} from 'lucide-react';

export function Features() {
  const coreFeatures = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, set alerts, and manage your product catalog with ease.',
      details: [
        'Real-time stock tracking',
        'Low stock alerts and notifications',
        'Barcode scanning support',
        'Product categorization',
        'Cost and price tracking',
        'Stock adjustment history'
      ]
    },
    {
      icon: DollarSign,
      title: 'Sales Tracking',
      description: 'Record transactions, generate receipts, and monitor your sales performance.',
      details: [
        'Quick sale processing',
        'Multiple payment methods',
        'Digital receipts',
        'Sales history and search',
        'Return and refund handling',
        'Daily sales summaries'
      ]
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Build stronger relationships with comprehensive customer profiles and purchase history.',
      details: [
        'Customer database',
        'Purchase history tracking',
        'Contact information',
        'Customer segmentation',
        'Credit limit management',
        'Customer-specific pricing'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Reports & Analytics',
      description: 'Gain insights into your business performance with detailed reports and dashboards.',
      details: [
        'Sales performance reports',
        'Inventory valuation',
        'Product performance analysis',
        'Customer buying patterns',
        'Profit margin calculation',
        'Exportable data in multiple formats'
      ]
    }
  ];

  const advancedFeatures = [
    {
      icon: FileText,
      title: 'Professional Invoicing',
      description: 'Create beautiful invoices and receipts that reflect your brand.',
      plan: 'Pro'
    },
    {
      icon: BarChart3,
      title: 'Goal Tracking',
      description: 'Set and monitor monthly revenue goals with visual progress indicators.',
      plan: 'Pro'
    },
    {
      icon: Zap,
      title: 'Cash Flow Analysis',
      description: 'Track income, expenses, and profit margins with detailed breakdowns.',
      plan: 'Pro'
    },
    {
      icon: Globe,
      title: 'Multi-Currency Support',
      description: 'Work with multiple currencies and automatic exchange rate conversion.',
      plan: 'Starter & Pro'
    }
  ];

  const technicalFeatures = [
    {
      icon: Smartphone,
      title: 'PWA Support',
      description: 'Install as a mobile or desktop app for quick access and offline functionality.'
    },
    {
      icon: Shield,
      title: 'Secure Data Storage',
      description: 'Enterprise-grade security with encrypted data transmission and storage.'
    },
    {
      icon: Cloud,
      title: 'Automatic Backups',
      description: 'Your data is automatically backed up to prevent any loss of information.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header with back button */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features for Your Business</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover all the tools and capabilities that make BizManager the complete solution for managing and growing your business.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Core Business Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{feature.description}</p>
                
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Advanced Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {advancedFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {feature.plan}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Technical Capabilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                  <th className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">Free</th>
                  <th className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">Starter</th>
                  <th className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Products</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Up to 10</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Unlimited</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Sales per month</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Up to 30</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Unlimited</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Dashboard</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Basic</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Advanced</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Advanced</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Customer Management</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Reports</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Basic</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Advanced</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">PDF Invoices</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Goal Tracking</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Cash Flow Analysis</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">Support</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Community</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Email</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how BizManager can transform your business operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/pricing" 
              className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-200"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 BizManager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}