import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { HelpCircle } from 'lucide-react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

interface TourStep {
  element: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const dashboardTour: TourStep[] = [
  {
    element: '[data-tour="dashboard"]',
    intro: 'Welcome to your dashboard! This is your business command center where you can see key metrics at a glance.',
    position: 'right'
  },
  {
    element: '.quick-actions',
    intro: 'These quick actions help you perform common tasks like creating new sales, adding products, and managing customers.',
    position: 'top'
  },
  {
    element: '[data-tour="sales"]',
    intro: 'Click here to manage your sales transactions and create new sales.',
    position: 'right'
  },
  {
    element: '[data-tour="products"]',
    intro: 'Manage your product catalog and inventory from here.',
    position: 'right'
  },
  {
    element: '[data-tour="customers"]',
    intro: 'Keep track of your customers and their purchase history.',
    position: 'right'
  },
  {
    element: '[data-tour="reports"]',
    intro: 'View detailed reports and analytics about your business performance.',
    position: 'right'
  },
  {
    element: '[data-tour="settings"]',
    intro: 'Access your profile settings and account information here.',
    position: 'top'
  }
];

export function ProductTour() {
  const { userSettings, updateUserSettings } = useStore();
  const [showTourButton, setShowTourButton] = React.useState(false);

  useEffect(() => {
    // Show tour automatically for new users
    if (userSettings && !userSettings.hasCompletedTour) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTour();
      }, 1000);
    }
    setShowTourButton(true);
  }, [userSettings]);

  const startTour = () => {
    const intro = introJs();
    
    intro.setOptions({
      steps: dashboardTour,
      showProgress: true,
      showBullets: false,
      exitOnOverlayClick: false,
      exitOnEsc: true,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Get Started!',
      skipLabel: 'Skip Tour',
      hidePrev: false,
      hideNext: false,
      scrollToElement: true,
      scrollPadding: 30,
      disableInteraction: true,
      tooltipClass: 'custom-tooltip',
      highlightClass: 'custom-highlight',
      overlayOpacity: 0.5,
    });

    intro.oncomplete(() => {
      // Mark tour as completed
      updateUserSettings({ hasCompletedTour: true });
    });

    intro.onexit(() => {
      // Mark tour as completed even if skipped
      updateUserSettings({ hasCompletedTour: true });
    });

    intro.start();
  };

  if (!showTourButton) return null;

  return (
    <>
      {/* Tour Button */}
      <button
        onClick={startTour}
        className="fixed bottom-20 right-4 z-40 bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors lg:bottom-4"
        title="Start Product Tour"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Custom CSS for tour styling */}
      <style jsx global>{`
        .custom-tooltip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          font-family: inherit;
          max-width: 300px;
        }

        .dark .custom-tooltip {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }

        .custom-highlight {
          border-radius: 8px;
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .introjs-tooltip .introjs-tooltiptext {
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }

        .dark .introjs-tooltip .introjs-tooltiptext {
          color: #f3f4f6;
        }

        .introjs-tooltip .introjs-button {
          background: #3b82f6;
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .introjs-tooltip .introjs-button:hover {
          background: #2563eb;
        }

        .introjs-tooltip .introjs-skipbutton {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .introjs-tooltip .introjs-skipbutton:hover {
          background: #f9fafb;
          color: #374151;
        }

        .dark .introjs-tooltip .introjs-skipbutton {
          color: #9ca3af;
          border-color: #4b5563;
        }

        .dark .introjs-tooltip .introjs-skipbutton:hover {
          background: #374151;
          color: #f3f4f6;
        }
      `}</style>
    </>
  );
}