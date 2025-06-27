import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, BarChart3, Package, Users, TrendingUp, FileText, ArrowRight } from 'lucide-react';

export function Demo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToFeature = (index: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = features[index].videoTime;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
      setCurrentFeature(index);
    }
  };

  // Update current feature based on video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      for (let i = features.length - 1; i >= 0; i--) {
        if (currentTime >= features[i].videoTime) {
          setCurrentFeature(i);
          break;
        }
      }
    }
  };

  // Get the current feature's icon component
  const CurrentFeatureIcon = features[currentFeature].icon;

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
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Watch our demo to see how BizManager can transform your business operations and help you grow.
          </p>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Video Player */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl mb-8 bg-gray-900">
              {/* Placeholder for actual video - in a real app, you'd use a real video */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                >
                  <source src="https://example.com/demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Play/Pause Button Overlay */}
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50 transition-opacity"
                >
                  <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="h-10 w-10 text-white" />
                    ) : (
                      <Play className="h-10 w-10 text-white ml-1" />
                    )}
                  </div>
                </button>
              </div>
              
              {/* Video Controls */}
              <div className="bg-gray-900 p-4">
                <div className="flex items-center justify-between text-white">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-5 w-5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                  
                  <div className="text-sm text-gray-400">
                    Demo Video • 5:30
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => jumpToFeature(index)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      currentFeature === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <FeatureIcon className={`h-6 w-6 mb-2 ${
                      currentFeature === index ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <h3 className="font-semibold text-sm">{feature.name}</h3>
                  </button>
                );
              })}
            </div>
            
            {/* Current Feature Description */}
            <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <CurrentFeatureIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-4 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {features[currentFeature].name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {features[currentFeature].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Key Features Highlighted
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                Real-time Dashboard
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Live sales and revenue tracking
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Inventory alerts and notifications
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Daily, weekly, and monthly comparisons
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Customizable KPI widgets
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                Smart Inventory
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Automatic stock updates with sales
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Low stock alerts and reorder suggestions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Barcode scanning support
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Product categorization and search
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                Advanced Analytics
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Sales trends and forecasting
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Product performance analysis
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Customer buying patterns
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Exportable reports in multiple formats
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                Professional Documents
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Customizable invoice templates
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Digital receipts with your branding
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  PDF generation and email sending
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Payment tracking and reminders
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience BizManager?</h2>
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