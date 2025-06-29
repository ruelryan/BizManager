import React from 'react';
import { useCurrency } from '../hooks/useCurrency';

interface CurrencyDisplayProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showCurrencyCode?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  fromCurrency = 'PHP',
  className = '',
  showCurrencyCode = false
}) => {
  const { formatAmount, currency } = useCurrency();
  
  return (
    <span className={className}>
      {formatAmount(amount, fromCurrency)}
      {showCurrencyCode && ` ${currency?.code}`}
    </span>
  );
};