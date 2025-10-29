import React from 'react';
import { Helmet } from 'react-helmet-async';

export function Blog() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 p-8">
      <Helmet>
        <title>BizManager Blog - Insights for Philippine SMEs</title>
        <meta name="description" content="Stay updated with the latest business tips, industry insights, and BizManager news for small and medium enterprises in the Philippines." />
      </Helmet>
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">BizManager Blog</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Welcome to the BizManager blog! Here you'll find articles, tips, and insights to help you grow and manage your business more effectively.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Placeholder for blog post list */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon: Your First Blog Post!</h2>
            <p className="text-gray-700 dark:text-gray-300">We're working on exciting content to help your business thrive. Stay tuned!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
