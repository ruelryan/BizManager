import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Beaker, Code, Briefcase, Award, GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';

export function About() {
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
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About BizManager</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl">
              BizManager is an all-in-one business management SaaS for modern entrepreneurs in the Philippines.
            </p>
            <ul className="mt-6 space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">• Manage sales, inventory, and customers in one place.</li>
              <li className="flex items-start">• Get real-time analytics and professional invoicing.</li>
              <li className="flex items-start">• Start free, upgrade as you grow.</li>
            </ul>
            <Link 
              to="/contact" 
              className="mt-8 inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg"
            >
              Try BizManager Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
              <img 
                src="/263811169_609784763605045_5307824981917022036_n.jpg" 
                alt="Ruel Ryan Rosal" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Ruel Ryan Rosal, RCh. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}