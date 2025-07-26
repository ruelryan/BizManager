import React, { useState, useEffect } from 'react';
import { BarChart3, Users, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface SignupAnalyticsProps {
  isVisible?: boolean;
}

export function SignupAnalytics({ isVisible = false }: SignupAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    formStarts: 0,
    formCompletions: 0,
    errors: 0,
    fbclidPresent: false,
    pixelLoaded: false
  });

  useEffect(() => {
    if (!isVisible) return;

    // Check if Facebook Pixel is loaded
    const checkPixelStatus = () => {
      const pixelLoaded = typeof window !== 'undefined' && window.fbq;
      const fbclidPresent = !!new URLSearchParams(window.location.search).get('fbclid');
      
      setAnalytics(prev => ({
        ...prev,
        pixelLoaded,
        fbclidPresent
      }));
    };

    checkPixelStatus();
    
    // Track form interactions
    const trackFormStart = () => {
      setAnalytics(prev => ({ ...prev, formStarts: prev.formStarts + 1 }));
    };

    const trackFormCompletion = () => {
      setAnalytics(prev => ({ ...prev, formCompletions: prev.formCompletions + 1 }));
    };

    const trackError = () => {
      setAnalytics(prev => ({ ...prev, errors: prev.errors + 1 }));
    };

    // Add event listeners
    document.addEventListener('focusin', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') {
        trackFormStart();
      }
    });

    // Listen for form submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', trackFormCompletion);
    });

    // Listen for error messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.textContent?.includes('error') || element.textContent?.includes('Error')) {
              trackError();
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      forms.forEach(form => {
        form.removeEventListener('submit', trackFormCompletion);
      });
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Signup Analytics
        </h3>
        <button
          onClick={() => setAnalytics(prev => ({ ...prev, pageViews: prev.pageViews + 1 }))}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Page Views:</span>
          <span className="font-medium">{analytics.pageViews}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Form Starts:</span>
          <span className="font-medium">{analytics.formStarts}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Completions:</span>
          <span className="font-medium">{analytics.formCompletions}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Errors:</span>
          <span className="font-medium">{analytics.errors}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Facebook Pixel:</span>
          {analytics.pixelLoaded ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">FB Click ID:</span>
          {analytics.fbclidPresent ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </div>
      
      {analytics.formStarts > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Conversion Rate: {analytics.formCompletions > 0 ? 
              Math.round((analytics.formCompletions / analytics.formStarts) * 100) : 0}%
          </div>
        </div>
      )}
    </div>
  );
} 