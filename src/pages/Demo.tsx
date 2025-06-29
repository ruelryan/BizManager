import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, BarChart3, Package, Users, TrendingUp, FileText, ArrowRight, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Demo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
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
            <button
              onClick={() => {
                const videoSection = document.getElementById('video-demo');
                if (videoSection) {
                  videoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Watch Video Demo
            </button>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="video-demo" className="py-12">
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