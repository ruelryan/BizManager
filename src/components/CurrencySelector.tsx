import React, { useEffect, useState } from 'react';
import { Globe, MapPin } from 'lucide-react';
import { currencies } from '../utils/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  autoDetect?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  autoDetect = true
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Auto-detect currency based on user's location
  useEffect(() => {
    if (autoDetect && navigator.geolocation) {
      const detectCurrency = async () => {
        try {
          setIsDetecting(true);
          setDetectionError(null);
          
          // First try to get currency from IP-based geolocation (doesn't require permission)
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          
          if (data && data.currency) {
            // Check if the detected currency is supported
            if (currencies[data.currency]) {
              onChange(data.currency);
              console.log(`Currency auto-detected: ${data.currency} (${data.country_name})`);
            } else {
              console.log(`Detected currency ${data.currency} is not supported, using default`);
            }
          } else {
            console.log('Could not detect currency from IP, falling back to default');
          }
        } catch (error) {
          console.error('Error detecting currency:', error);
          setDetectionError('Could not auto-detect currency');
        } finally {
          setIsDetecting(false);
        }
      };
      
      // Only detect if the current value is the default (PHP)
      if (value === 'PHP') {
        detectCurrency();
      }
    }
  }, [autoDetect, onChange, value]);

  return (
    <div className={`relative ${className}`}>
      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
      >
        {Object.values(currencies).map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.name} ({currency.code})
          </option>
        ))}
      </select>
      
      {isDetecting && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
      
      {autoDetect && !isDetecting && !detectionError && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 dark:text-blue-400">
          <MapPin className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};