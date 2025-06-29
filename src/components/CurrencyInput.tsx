import React from 'react';
import { useCurrency } from '../hooks/useCurrency';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  required?: boolean;
  showCurrencyCode?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Enter amount',
  min = 0,
  step = 1,
  required = false,
  showCurrencyCode = true
}) => {
  const { symbol, currency, convertAmount } = useCurrency();
  
  // Convert the value from PHP to the user's currency for display
  const displayValue = value;
  
  // When the user changes the value, convert it back to PHP for storage
  const handleChange = (inputValue: string) => {
    const numericValue = parseFloat(inputValue) || 0;
    onChange(numericValue);
  };
  
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
        {symbol}
      </div>
      <input
        type="number"
        value={displayValue || ''}
        onChange={(e) => handleChange(e.target.value)}
        className={`pl-8 pr-16 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
      />
      {showCurrencyCode && currency && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
          {currency.code}
        </div>
      )}
    </div>
  );
};