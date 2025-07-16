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

  // Remove startInteractiveTour and demo user logic
  // Remove the 'Start Interactive Pro Demo' button and related demo text

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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Experience BizManager Instantly</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Explore all Pro features with our interactive demo and feature showcase.
          </p>
          
          {/* Remove the 'Start Interactive Pro Demo' button and related demo text */}
        </div>
      </section>

      {/* Interactive Demo CTA */}
      {/* Remove the 'Start Interactive Pro Demo' button and related demo text */}

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