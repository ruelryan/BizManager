import React from 'react';
import { Globe } from 'lucide-react';
import { currencies } from '../utils/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
      >
        {Object.values(currencies).map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.name} ({currency.code})
          </option>
        ))}
      </select>
    </div>
  );
};