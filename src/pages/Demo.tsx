import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, BarChart3, Package, Users, TrendingUp, FileText, ArrowRight, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Demo() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const navigate = useNavigate();
  const { setUser } = useStore();

  const features = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Get a complete overview of your business with real-time metrics and KPIs.',
      icon: BarChart3,
      videoTime: 0 // Time in seconds where this feature appears in the video
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Track stock levels, set alerts, and manage your product catalog with ease.',
      icon: Package,
      videoTime: 30
    },
    {
      id: 'customers',
      name: 'Customer Management',
      description: 'Build stronger relationships with comprehensive customer profiles and purchase history.',
      icon: Users,
      videoTime: 60
    },
    {
      id: 'sales',
      name: 'Sales Tracking',
      description: 'Record transactions, generate receipts, and monitor your sales performance.',
      icon: TrendingUp,
      videoTime: 90
    },
    {
      id: 'invoices',
      name: 'Professional Invoicing',
      description: 'Create beautiful invoices and receipts that reflect your brand.',
      icon: FileText,
      videoTime: 120
    }
  ];

  // Remove all video-related state, refs, and handlers (isPlaying, videoRef, togglePlayPause, jumpToFeature, handleTimeUpdate, etc.)
  // Replace the video demo section with a feature showcase carousel or card grid
  // For each feature, show its icon, name, and description in a card
  // Allow users to click through features (carousel or next/prev buttons)
  // Keep the 'Start Interactive Pro Demo' button as the main CTA

  // Get the current feature's icon component
  const CurrentFeatureIcon = features[currentFeature].icon;

  // Start interactive tour
  const startInteractiveTour = () => {
    // Set up demo Pro account
    setUser({
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@businessmanager.com',
      plan: 'pro',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    
    // Navigate to dashboard with tour parameter
    navigate('/dashboard?tour=true');
  };

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

      {/* Demo Hero */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">See BizManager in Action</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Watch our demo to see how BizManager can transform your business operations and help you grow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startInteractiveTour}
              className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-md flex items-center justify-center"
            >
              <Crown className="mr-2 h-5 w-5" />
              Start Interactive Pro Demo
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Demo CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Try It Yourself?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience all Pro features with our interactive demo. No sign-up required!
          </p>
          <button
            onClick={startInteractiveTour}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
          >
            <Crown className="mr-2 h-5 w-5" />
            Start Interactive Pro Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
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