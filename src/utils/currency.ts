// Currency conversion utilities
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to PHP (base currency)
}

export const currencies: Record<string, CurrencyInfo> = {
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 1 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.0179 }, // 1 PHP = 0.0179 USD
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.0164 }, // 1 PHP = 0.0164 EUR
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.0141 }, // 1 PHP = 0.0141 GBP
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 2.74 }, // 1 PHP = 2.74 JPY
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 0.0241 }, // 1 PHP = 0.0241 SGD
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 0.0798 }, // 1 PHP = 0.0798 MYR
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 0.606 }, // 1 PHP = 0.606 THB
};

// Convert amount from PHP to target currency
export const convertFromPHP = (amount: number, targetCurrency: string): number => {
  const currency = currencies[targetCurrency];
  if (!currency) return amount;
  return amount * currency.rate;
};

// Convert amount from source currency to PHP
export const convertToPHP = (amount: number, sourceCurrency: string): number => {
  const currency = currencies[sourceCurrency];
  if (!currency) return amount;
  return amount / currency.rate;
};

// Convert between any two currencies
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to PHP first, then to target currency
  const phpAmount = convertToPHP(amount, fromCurrency);
  return convertFromPHP(phpAmount, toCurrency);
};

// Format currency with proper symbol and locale
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = currencies[currencyCode];
  if (!currency) return `${amount.toLocaleString()}`;
  
  // Format with appropriate decimal places
  const decimals = currencyCode === 'JPY' ? 0 : 2;
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${currency.symbol}${formattedAmount}`;
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencies[currencyCode];
  return currency?.symbol || currencyCode;
};

// Hook for currency conversion in components
export const useCurrencyConverter = (userCurrency: string = 'PHP') => {
  const convertAmount = (amount: number, fromCurrency: string = 'PHP') => {
    return convertCurrency(amount, fromCurrency, userCurrency);
  };

  const formatAmount = (amount: number, fromCurrency: string = 'PHP') => {
    const convertedAmount = convertAmount(amount, fromCurrency);
    return formatCurrency(convertedAmount, userCurrency);
  };

  return {
    convertAmount,
    formatAmount,
    symbol: getCurrencySymbol(userCurrency),
    currency: currencies[userCurrency],
  };
};