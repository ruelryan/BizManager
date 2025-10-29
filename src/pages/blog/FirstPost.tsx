import React from 'react';
import { Helmet } from 'react-helmet-async';

export function BlogPost() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 p-8">
      <Helmet>
        <title>Your First Blog Post - BizManager Blog</title>
        <meta name="description" content="This is a placeholder for your first blog post. Learn how BizManager can help your business." />
      </Helmet>
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Your First Blog Post Title</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          This is the content of your first blog post. You can write about anything relevant to your business, industry trends, tips, or company news.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Start creating valuable content to attract more visitors to your website!
        </p>
      </div>
    </div>
  );
}
