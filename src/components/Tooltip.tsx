import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 500,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate actual position based on viewport
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        // Check if tooltip would go off-screen and adjust position
        let newPosition = position;
        
        if (position === 'top' && triggerRect.top < tooltipRect.height + 10) {
          newPosition = 'bottom';
        } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + 10 > window.innerHeight) {
          newPosition = 'top';
        } else if (position === 'left' && triggerRect.left < tooltipRect.width + 10) {
          newPosition = 'right';
        } else if (position === 'right' && triggerRect.right + tooltipRect.width + 10 > window.innerWidth) {
          newPosition = 'left';
        }
        
        setActualPosition(newPosition);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200';
    
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
      top: 'after:content-[""] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900 after:dark:border-t-gray-700',
      bottom: 'after:content-[""] after:absolute after:bottom-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900 after:dark:border-b-gray-700',
      left: 'after:content-[""] after:absolute after:left-full after:top-1/2 after:transform after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-900 after:dark:border-l-gray-700',
      right: 'after:content-[""] after:absolute after:right-full after:top-1/2 after:transform after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-gray-900 after:dark:border-r-gray-700'
    };

    return `${baseClasses} ${positionClasses[actualPosition]} ${arrowClasses[actualPosition]} ${className}`;
  };

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={getTooltipClasses()}
          style={{
            opacity: isVisible ? 1 : 0,
            maxWidth: '200px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}