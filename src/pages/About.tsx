import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, Package, TrendingUp, FileText, Shield, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function About() {
  const { theme } = useTheme();

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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About BizManager</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We're on a mission to empower small and medium businesses with powerful, affordable tools to manage and grow their operations.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300">
                BizManager was founded in 2023 by a team of entrepreneurs who experienced firsthand the challenges of running a small business in the Philippines. After struggling with expensive, complex software that wasn't designed for local businesses, they decided to build a solution specifically tailored to the needs of Filipino entrepreneurs.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                What started as a simple inventory management tool has grown into a comprehensive business management platform used by thousands of businesses across the country. Our focus has always been on creating intuitive, affordable software that helps businesses operate more efficiently and profitably.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Today, BizManager is proud to serve businesses of all sizes, from small family-owned shops to growing enterprises with multiple locations. We remain committed to our mission of making powerful business tools accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Our Core Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Customer First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We build our products based on real customer needs and feedback, ensuring that every feature adds genuine value.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Trust & Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We treat your business data with the utmost care, implementing robust security measures to protect your information.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Local Focus</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We design our solutions specifically for the Philippine market, addressing the unique challenges faced by local businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Meet Our Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" 
                alt="Maria Reyes" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Maria Reyes</h3>
              <p className="text-blue-600 dark:text-blue-400 mb-2">CEO & Co-Founder</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                Former small business owner with a passion for helping entrepreneurs succeed.
              </p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" 
                alt="Miguel Santos" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Miguel Santos</h3>
              <p className="text-blue-600 dark:text-blue-400 mb-2">CTO & Co-Founder</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                Tech innovator with 15+ years experience building scalable software solutions.
              </p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" 
                alt="Sofia Cruz" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sofia Cruz</h3>
              <p className="text-blue-600 dark:text-blue-400 mb-2">Head of Customer Success</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                Dedicated to ensuring our customers get the most value from BizManager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Want to Learn More?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            We'd love to hear from you and answer any questions you might have about BizManager.
          </p>
          <Link 
            to="/contact" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
          >
            Contact Us
          </Link>
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