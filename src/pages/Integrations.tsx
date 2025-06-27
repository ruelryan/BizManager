import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Printer, Smartphone, Truck, Database, Mail, MessageSquare, Calendar } from 'lucide-react';

export function Integrations() {
  const integrationCategories = [
    {
      title: 'Payment Processing',
      icon: CreditCard,
      integrations: [
        {
          name: 'PayPal',
          description: 'Accept payments online with the world\'s most popular payment processor.',
          logo: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg',
          status: 'Available'
        },
        {
          name: 'GCash',
          description: 'Connect with the Philippines\' leading mobile wallet for seamless payments.',
          logo: 'https://assets.gcash.com/web-assets/gcash-logo-blue.svg',
          status: 'Coming Soon'
        },
        {
          name: 'Maya',
          description: 'Integrate with Maya (formerly PayMaya) for local payment processing.',
          logo: 'https://assets.website-files.com/6217c768b8b19637dc5f6371/6230aecb4e3c5c6d37d4eb20_Maya.png',
          status: 'Coming Soon'
        }
      ]
    },
    {
      title: 'Hardware',
      icon: Printer,
      integrations: [
        {
          name: 'Thermal Printers',
          description: 'Connect to popular thermal receipt printers for physical receipts.',
          logo: 'https://images.pexels.com/photos/6156399/pexels-photo-6156399.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          status: 'Available'
        },
        {
          name: 'Barcode Scanners',
          description: 'Quickly scan products using USB or Bluetooth barcode scanners.',
          logo: 'https://images.pexels.com/photos/7947303/pexels-photo-7947303.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          status: 'Available'
        },
        {
          name: 'Cash Drawers',
          description: 'Automatic cash drawer opening when completing cash transactions.',
          logo: 'https://images.pexels.com/photos/4386366/pexels-photo-4386366.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          status: 'Coming Soon'
        }
      ]
    },
    {
      title: 'Shipping & Logistics',
      icon: Truck,
      integrations: [
        {
          name: 'J&T Express',
          description: 'Generate shipping labels and track packages with J&T Express.',
          logo: 'https://1000logos.net/wp-content/uploads/2021/05/JT-Express-logo.png',
          status: 'Coming Soon'
        },
        {
          name: 'Grab Express',
          description: 'Book same-day deliveries through Grab\'s delivery service.',
          logo: 'https://assets.grab.com/wp-content/uploads/sites/8/2021/10/22182838/Grab_Logo_2021.png',
          status: 'Coming Soon'
        },
        {
          name: 'Lalamove',
          description: 'Integrate with Lalamove for on-demand delivery services.',
          logo: 'https://www.lalamove.com/hubfs/Lalamove-logo-red.png',
          status: 'Coming Soon'
        }
      ]
    },
    {
      title: 'Communication',
      icon: MessageSquare,
      integrations: [
        {
          name: 'SMS Notifications',
          description: 'Send automated SMS notifications to customers about orders and promotions.',
          logo: 'https://images.pexels.com/photos/5053740/pexels-photo-5053740.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          status: 'Available'
        },
        {
          name: 'Email Marketing',
          description: 'Connect with email marketing platforms to engage with your customers.',
          logo: 'https://images.pexels.com/photos/6375/quote-chalk-think-words.jpg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          status: 'Coming Soon'
        },
        {
          name: 'Facebook Messenger',
          description: 'Chat with customers directly through Facebook Messenger integration.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Facebook_Messenger_logo_2020.svg/150px-Facebook_Messenger_logo_2020.svg.png',
          status: 'Coming Soon'
        }
      ]
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Integrations & Extensions</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Connect BizManager with your favorite tools and services to create a seamless business ecosystem.
          </p>
        </div>
      </section>

      {/* Integrations List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {integrationCategories.map((category, index) => (
            <div key={index} className="mb-16">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                  <category.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.integrations.map((integration, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4">
                      <img 
                        src={integration.logo} 
                        alt={integration.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          integration.status === 'Available' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {integration.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{integration.description}</p>
                      
                      {integration.status === 'Available' ? (
                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                          Connect
                        </button>
                      ) : (
                        <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed">
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Request Integration */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Request an Integration</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Don't see the integration you need? Let us know what tools or services you'd like to connect with BizManager, and we'll consider adding it to our roadmap.
            </p>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="integration-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Integration Name *
                </label>
                <input
                  type="text"
                  id="integration-name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Shopify, QuickBooks, etc."
                />
              </div>
              
              <div>
                <label htmlFor="integration-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Integration Type *
                </label>
                <select
                  id="integration-type"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select integration type</option>
                  <option value="payment">Payment Processing</option>
                  <option value="ecommerce">E-commerce Platform</option>
                  <option value="accounting">Accounting Software</option>
                  <option value="shipping">Shipping & Logistics</option>
                  <option value="marketing">Marketing Tools</option>
                  <option value="hardware">Hardware Device</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="integration-details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How would you use this integration? *
                </label>
                <textarea
                  id="integration-details"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe how this integration would help your business..."
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* API Access */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Developer API</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Build Your Own Integrations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For developers and businesses with custom needs, we offer a comprehensive API that allows you to build your own integrations with BizManager.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">API Features</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      RESTful endpoints for all resources
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Secure authentication with API keys
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Comprehensive documentation
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Webhook support for real-time events
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Available in Plans</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      Free Plan: Not available
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">⚠</span>
                      Starter Plan: Limited access (100 requests/day)
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Pro Plan: Full access (10,000 requests/day)
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link 
                  to="/api-docs" 
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  View API Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Coming Soon</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mobile App</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Native mobile apps for iOS and Android with offline capabilities and barcode scanning.
              </p>
              <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">Coming Q3 2025</div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Appointment Booking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Allow customers to book appointments and services directly through your BizManager account.
              </p>
              <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">Coming Q4 2025</div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Marketing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built-in email marketing tools to create campaigns and automate customer communications.
              </p>
              <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">Coming Q1 2026</div>
            </div>
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