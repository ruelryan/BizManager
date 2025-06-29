import React, { useState, useEffect } from 'react';
import { X, Check, History, AlertTriangle, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useCurrency } from '../hooks/useCurrency';
import { currencies } from '../utils/currency';

interface CreditLimitManagerProps {
  customerId: string;
  customerName: string;
  currentBalance: number;
  currentCreditLimit: number;
  onClose: () => void;
  onUpdate: (newCreditLimit: number) => Promise<void>;
}

interface CreditHistoryItem {
  date: Date;
  action: 'increase' | 'decrease' | 'payment';
  amount: number;
  notes: string;
}

export function CreditLimitManager({ 
  customerId, 
  customerName, 
  currentBalance, 
  currentCreditLimit,
  onClose,
  onUpdate
}: CreditLimitManagerProps) {
  const { symbol, currency, convertAmount, formatAmount } = useCurrency();
  const [newCreditLimit, setNewCreditLimit] = useState(currentCreditLimit);
  const [adjustmentAmount, setAdjustmentAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [adjustmentDirection, setAdjustmentDirection] = useState<'increase' | 'decrease'>('increase');
  
  // This would come from the database in a real implementation
  const mockCreditHistory: CreditHistoryItem[] = [
    {
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      action: 'increase',
      amount: 5000,
      notes: 'Initial credit limit'
    },
    {
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      action: 'decrease',
      amount: 2000,
      notes: 'Purchase on credit'
    },
    {
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      action: 'payment',
      amount: 1000,
      notes: 'Partial payment'
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      action: 'decrease',
      amount: 1500,
      notes: 'Purchase on credit'
    }
  ];

  // Calculate appropriate increment based on currency
  useEffect(() => {
    if (currency) {
      // Base increment is 100 PHP
      const baseIncrement = 100;
      
      // Convert to current currency
      let convertedIncrement = convertAmount(baseIncrement, 'PHP');
      
      // Round to appropriate unit based on currency
      if (currency.code === 'JPY' || currency.code === 'KRW') {
        // Round to nearest 100 for JPY and KRW
        convertedIncrement = Math.round(convertedIncrement / 100) * 100;
        if (convertedIncrement < 100) convertedIncrement = 100;
      } else if (currency.code === 'USD' || currency.code === 'EUR' || currency.code === 'GBP') {
        // Round to nearest 5 for major currencies
        convertedIncrement = Math.round(convertedIncrement / 5) * 5;
        if (convertedIncrement < 5) convertedIncrement = 5;
      } else {
        // Round to nearest whole number for other currencies
        convertedIncrement = Math.round(convertedIncrement);
        if (convertedIncrement < 1) convertedIncrement = 1;
      }
      
      setAdjustmentAmount(convertedIncrement);
    }
  }, [currency, convertAmount]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Convert the credit limit back to PHP for storage
      const phpCreditLimit = convertAmount(newCreditLimit, currency?.code || 'PHP', 'PHP');
      await onUpdate(phpCreditLimit);
      onClose();
    } catch (error) {
      console.error('Failed to update credit limit:', error);
      alert('Failed to update credit limit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustment = (direction: 'increase' | 'decrease') => {
    setAdjustmentDirection(direction);
    if (direction === 'increase') {
      setNewCreditLimit(prev => prev + adjustmentAmount);
    } else {
      setNewCreditLimit(prev => Math.max(0, prev - adjustmentAmount));
    }
  };

  const handleCustomAdjustment = (amount: number) => {
    setAdjustmentAmount(amount);
  };

  // Calculate available credit and utilization
  const availableCredit = currentCreditLimit - currentBalance;
  const creditUtilizationPercent = (currentBalance / currentCreditLimit) * 100 || 0;

  // Common increment options based on currency
  const getIncrementOptions = () => {
    if (!currency) return [100, 500, 1000, 5000];
    
    switch (currency.code) {
      case 'USD':
      case 'EUR':
      case 'GBP':
        return [5, 10, 50, 100, 500];
      case 'JPY':
      case 'KRW':
        return [100, 500, 1000, 5000, 10000];
      default:
        // Scale based on exchange rate compared to PHP
        const baseOptions = [100, 500, 1000, 5000];
        return baseOptions.map(opt => Math.round(convertAmount(opt, 'PHP')));
    }
  };

  const incrementOptions = getIncrementOptions();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Credit Limit
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Customer Information</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="mb-2">
                <span className="text-gray-600 dark:text-gray-400">Customer:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{customerName}</span>
              </div>
              <div className="mb-2">
                <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={currentBalance} />
                </span>
              </div>
              <div className="mb-2">
                <span className="text-gray-600 dark:text-gray-400">Credit Limit:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={currentCreditLimit} />
                </span>
              </div>
              <div className="mb-2">
                <span className="text-gray-600 dark:text-gray-400">Available Credit:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={availableCredit} />
                </span>
              </div>
              
              {/* Credit Utilization Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Credit Utilization</span>
                  <span className={`font-medium ${
                    creditUtilizationPercent > 80 
                      ? 'text-red-600 dark:text-red-400' 
                      : creditUtilizationPercent > 50 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-green-600 dark:text-green-400'
                  }`}>
                    {creditUtilizationPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      creditUtilizationPercent > 80 
                        ? 'bg-red-600' 
                        : creditUtilizationPercent > 50 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(creditUtilizationPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Update Credit Limit</h4>
            
            {/* New Credit Limit Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 text-center">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">New Credit Limit</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                <CurrencyDisplay amount={newCreditLimit} />
              </div>
              
              {/* Change indicator */}
              {newCreditLimit !== currentCreditLimit && (
                <div className={`text-sm mt-1 ${
                  newCreditLimit > currentCreditLimit 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {newCreditLimit > currentCreditLimit ? '+' : ''}
                  <CurrencyDisplay 
                    amount={newCreditLimit - currentCreditLimit} 
                  />
                  {' '}
                  ({((newCreditLimit / currentCreditLimit - 1) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
            
            {/* Adjustment Controls */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleAdjustment('decrease')}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border ${
                  adjustmentDirection === 'decrease'
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <Minus className="h-4 w-4 mr-1" />
                Decrease
              </button>
              <button
                onClick={() => handleAdjustment('increase')}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border ${
                  adjustmentDirection === 'increase'
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Increase
              </button>
            </div>
            
            {/* Increment Amount Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adjustment Amount ({currency?.code})
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {incrementOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleCustomAdjustment(amount)}
                    className={`py-2 px-3 text-sm rounded-lg border ${
                      adjustmentAmount === amount
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {symbol}{amount.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={adjustmentAmount}
                  onChange={(e) => handleCustomAdjustment(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => handleAdjustment(adjustmentDirection)}
                  className={`ml-2 py-2 px-4 rounded-lg ${
                    adjustmentDirection === 'increase'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {adjustmentDirection === 'increase' ? '+' : '-'}
                </button>
              </div>
            </div>
            
            {/* Set to specific value */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Set Specific Value
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    {symbol}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {newCreditLimit < currentBalance && (
              <div className="mt-2 flex items-start text-sm text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <span>
                  Warning: New credit limit is less than current balance. Customer will not be able to make additional purchases on credit until balance is reduced.
                </span>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
            >
              <History className="h-4 w-4 mr-1" />
              {showHistory ? 'Hide Credit History' : 'View Credit History'}
            </button>
            
            {showHistory && (
              <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {mockCreditHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(item.date, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.action === 'increase' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : item.action === 'payment'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {item.action === 'increase' 
                              ? 'Limit Increase' 
                              : item.action === 'payment'
                                ? 'Payment'
                                : 'Purchase'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                          <span className={
                            item.action === 'increase' || item.action === 'payment'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }>
                            {item.action === 'increase' || item.action === 'payment' ? '+' : '-'}
                            <CurrencyDisplay amount={item.amount} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Update Credit Limit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}