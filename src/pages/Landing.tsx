import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  FileText, 
  ArrowRight,
  Check,
  Star,
  ChevronRight,
  Shield,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MobileMenu } from '../components/MobileMenu';

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState({
    header: false,
    navItems: Array(5).fill(false),
    ctaButtons: false,
  });
  
  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation timing for elements
  useEffect(() => {
    // Header text animation
    setTimeout(() => {
      setIsVisible(prev => ({ ...prev, header: true }));
    }, 500);

    // Navigation items staggered animation
    isVisible.navItems.forEach((_, index) => {
      setTimeout(() => {
        setIsVisible(prev => {
          const newNavItems = [...prev.navItems];
          newNavItems[index] = true;
          return { ...prev, navItems: newNavItems };
        });
      }, 200 * (index + 1));
    });

    // CTA buttons animation
    setTimeout(() => {
      setIsVisible(prev => ({ ...prev, ctaButtons: true }));
    }, 700);
  }, []);

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animation').forEach(el => {
      observer.observe(el);
    });

    return () => {
      document.querySelectorAll('.scroll-animation').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);
  
  const features = [
    {
      icon: Package,
      title: 'Smart Inventory',
      description: 'Track stock levels in real-time with barcode scanning and low-stock alerts.'
    },
    {
      icon: TrendingUp,
      title: 'Sales Analytics',
      description: 'Gain powerful insights with visual reports and performance metrics.'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Build stronger relationships with detailed customer profiles and history.'
    },
    {
      icon: FileText,
      title: 'Professional Invoicing',
      description: 'Create beautiful, branded invoices and receipts that look professional.'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Sign Up Free',
      description: 'Create your account in under 60 seconds',
    },
    {
      number: 2,
      title: 'Add Your Products',
      description: 'Import or manually add your inventory',
    },
    {
      number: 3,
      title: 'Start Selling',
      description: 'Process sales and track performance',
    },
    {
      number: 4,
      title: 'Grow Your Business',
      description: 'Scale with powerful insights and tools',
    }
  ];

  const testimonials = [
    {
      name: 'Maria Santos',
      role: 'Café Owner',
      company: 'Santos Coffee House',
      quote: 'BizManager helped us increase our revenue by 40% in just 3 months. The inventory tracking is a game-changer!',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'John Rodriguez',
      role: 'Store Manager',
      company: 'Rodriguez Electronics',
      quote: 'The reporting features give us insights we never had before. We can now make data-driven decisions daily.',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Lisa Chen',
      role: 'Boutique Owner',
      company: 'Chen Fashion',
      quote: 'Customer management has never been easier. Our repeat customer rate increased by 60% since using BizManager.',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '₱0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 10 products',
        'Up to 30 sales/month',
        'Basic dashboard',
        'Customer management'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Starter',
      price: '₱199',
      period: 'per month',
      description: 'For growing businesses',
      features: [
        'Unlimited products',
        'Unlimited sales',
        'Advanced dashboard',
        'Basic reports',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Pro',
      price: '₱499',
      period: 'per month',
      description: 'For established businesses',
      features: [
        'Everything in Starter',
        'PDF invoices',
        'Advanced reports',
        'Goal tracking',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">BizManager</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {['About', 'Features', 'Pricing', 'Login'].map((item, index) => (
                <Link 
                  key={item} 
                  to={`/${item.toLowerCase()}`} 
                  className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors transform transition-opacity duration-500 ${
                    isVisible.navItems[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item}
                </Link>
              ))}
              <Link 
                to="/signup" 
                className={`bg-blue-600 dark:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-md transform transition-opacity duration-500 ${
                  isVisible.navItems[4] ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Get Started Free
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors transform transition-opacity duration-500 ${
                  isVisible.navItems[4] ? 'opacity-100' : 'opacity-0'
                }`}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>
            </nav>

            {/* Mobile menu button and theme toggle */}
            <div className="flex items-center space-x-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 
              className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white transition-opacity duration-500 ${
                isVisible.header ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Manage Your Business
              <br />
              <span className="text-blue-600 dark:text-blue-400">
                With Confidence
              </span>
            </h1>
            
            <p 
              className={`text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transition-opacity duration-500 ${
                isVisible.header ? 'opacity-100' : 'opacity-0'
              }`}
            >
              The complete business management solution for modern entrepreneurs in the Philippines
            </p>
            
            <div 
              className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-opacity duration-500 ${
                isVisible.ctaButtons ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Link 
                to="/signup" 
                className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-md flex items-center w-full sm:w-auto justify-center"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/demo" 
                className="border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 w-full sm:w-auto text-center"
              >
                Watch Demo
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Your Business
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage, grow, and scale your business efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 scroll-animation"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/features" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Explore all features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our simple, intuitive setup process gets you up and running quickly
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Desktop Timeline */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2 z-0"></div>
                
                {steps.map((step, index) => (
                  <div key={index} className="relative z-10 flex flex-col items-center max-w-xs scroll-animation" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      {step.description}
                    </p>
                    {index < steps.length - 1 && (
                      <ChevronRight className="absolute -right-8 top-6 h-6 w-6 text-blue-400 dark:text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Timeline */}
            <div className="lg:hidden space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 scroll-animation" style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Link 
              to="/signup" 
              className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-md inline-flex items-center"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Business Owners
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See how BizManager is helping businesses like yours achieve remarkable results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 scroll-animation"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business needs. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-md border ${
                  tier.popular 
                    ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' 
                    : 'border-gray-200 dark:border-gray-700'
                } scroll-animation`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium">
                      <Star className="mr-1 h-4 w-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">/{tier.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{tier.description}</p>

                  <ul className="space-y-3 mb-6 text-left">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    to="/signup"
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center block transition-all ${
                      tier.popular
                        ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/pricing" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              See full pricing details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
      <footer className="bg-gray-900 text-white py-12 scroll-animation">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">BizManager</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete business management solution for modern entrepreneurs in the Philippines.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="text-gray-400 hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms-of-service.html" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy-policy.html" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 BizManager. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                Login
              </Link>
              <Link to="/signup" className="text-gray-400 hover:text-white transition-colors text-sm">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}