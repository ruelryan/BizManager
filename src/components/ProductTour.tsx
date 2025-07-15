import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ArrowRight, 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  FileText,
  Settings,
  ShoppingCart
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  action?: () => void;
}

export function ProductTour() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Define tour steps
  const tourSteps: TourStep[] = [
    {
      target: 'body',
      title: 'Welcome to BizManager Pro!',
      content: 'You\'re now using our Pro demo account with all premium features unlocked. Let\'s take a quick tour to show you what\'s possible.',
      position: 'bottom',
      action: () => navigate('/dashboard')
    },
    {
      target: '[data-tour="dashboard"]',
      title: 'Dashboard Overview',
      content: 'Your dashboard gives you a complete overview of your business performance with real-time metrics and KPIs.',
      position: 'bottom'
    },
    {
      target: '[data-tour="sales"]',
      title: 'Sales Management',
      content: 'Track all your sales transactions, generate receipts, and process returns or refunds.',
      position: 'right',
      action: () => navigate('/sales')
    },
    {
      target: '[data-tour="add-sale"]',
      title: 'Create New Sales',
      content: 'Quickly add new sales with our intuitive interface. Select products, apply discounts, and choose payment methods.',
      position: 'bottom'
    },
    {
      target: '[data-tour="products"]',
      title: 'Product Management',
      content: 'Manage your entire product catalog with detailed inventory tracking and pricing.',
      position: 'right',
      action: () => navigate('/products')
    },
    {
      target: '[data-tour="reports"]',
      title: 'Advanced Reports',
      content: 'Pro users get access to detailed analytics and custom reports to track business performance.',
      position: 'right',
      action: () => navigate('/reports')
    },
    {
      target: '[data-tour="settings"]',
      title: 'Profile & Settings',
      content: 'Customize your account, manage subscription, and set business preferences.',
      position: 'left',
      action: () => navigate('/profile')
    }
  ];

  // Handle closing the tour
  const handleClose = () => {
    setIsVisible(false);
    // Remove all tour highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight', 'pulse-animation');
    });
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  // Handle skip
  const handleSkip = () => {
    handleClose();
  };

  // Set up Pro demo account
  useEffect(() => {
    // Set up demo Pro account
    setUser({
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@businessmanager.com',
      plan: 'pro',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
  }, [setUser]);

  // Highlight the target element for the current step
  useEffect(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight', 'pulse-animation');
    }

    // Find the target element
    let targetElement: HTMLElement | null = null;
    if (step.target === 'body') {
      targetElement = document.body;
    } else {
      targetElement = document.querySelector(step.target);
    }

    // Highlight the target element
    if (targetElement && step.target !== 'body') {
      targetElement.classList.add('tour-highlight', 'pulse-animation');
      setHighlightedElement(targetElement);
      
      // Scroll to the element if needed
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Execute action if defined
    if (step.action) {
      step.action();
    }
  }, [currentStep, tourSteps, highlightedElement]);

  // Add tour-specific styles
  useEffect(() => {
    // Add styles for tour highlights
    const style = document.createElement('style');
    style.innerHTML = `
      .tour-highlight {
        position: relative;
        z-index: 1000;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
        border-radius: 4px;
      }
      
      .pulse-animation {
        animation: tour-pulse 2s infinite;
      }
      
      @keyframes tour-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
    `;
    document.head.appendChild(style);

    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  if (!step) return null;

  // Calculate position for the tooltip
  const getTooltipPosition = () => {
    if (step.target === 'body' || !highlightedElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipHeight = 200; // Approximate height
    const tooltipWidth = 300; // Approximate width

    switch (step.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - rect.top + 10}px`,
          left: `${rect.left + rect.width / 2 - tooltipWidth / 2}px`,
          transform: 'none'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2 - tooltipHeight / 2}px`,
          left: `${rect.right + 10}px`,
          transform: 'none'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left + rect.width / 2 - tooltipWidth / 2}px`,
          transform: 'none'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2 - tooltipHeight / 2}px`,
          right: `${window.innerWidth - rect.left + 10}px`,
          transform: 'none'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  // Get the appropriate icon for the current step
  const getStepIcon = () => {
    switch (currentStep) {
      case 0: return <BarChart3 className="h-5 w-5" />;
      case 1: return <BarChart3 className="h-5 w-5" />;
      case 2: return <ShoppingCart className="h-5 w-5" />;
      case 3: return <ShoppingCart className="h-5 w-5" />;
      case 4: return <Package className="h-5 w-5" />;
      case 5: return <TrendingUp className="h-5 w-5" />;
      case 6: return <Settings className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Tooltip */}
      <div 
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 pointer-events-auto"
        style={getTooltipPosition()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-2">
              {getStepIcon()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {step.content}
        </p>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip tour
          </button>
          
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
              {currentStep + 1} of {tourSteps.length}
            </span>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}