import React, { useState, useEffect } from 'react';
import { X, Check, History, AlertTriangle, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useCurrency } from '../hooks/useCurrency';

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
  const { symbol, currency, convertAmount } = useCurrency();
  
  // Convert the PHP values to the user's currency for display
  const displayCurrentBalance = convertAmount(currentBalance);
  const displayCurrentCreditLimit = convertAmount(currentCreditLimit);
  
  // State for the new credit limit (in user's currency)
  const [newCreditLimit, setNewCreditLimit] = useState(displayCurrentCreditLimit);
  
  // Default adjustment amount in user's currency (equivalent to ~100 PHP)
  const [adjustmentAmount, setAdjustmentAmount] = useState(() => {
    // Calculate a reasonable default increment based on currency
    if (currency?.code === 'JPY' || currency?.code === 'KRW') {
      return Math.max(100, Math.round(convertAmount(100)));
    } else if (currency?.code === 'USD' || currency?.code === 'EUR' || currency?.code === 'GBP') {
      return Math.max(5, Math.round(convertAmount(100)));
    } else {
      return Math.max(1, Math.round(convertAmount(100)));
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [specificValue, setSpecificValue] = useState('');
  
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Convert back to PHP for storage in the database
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

  const handleIncrease = () => {
    setNewCreditLimit(prev => prev + adjustmentAmount);
  };

  const handleDecrease = () => {
    setNewCreditLimit(prev => Math.max(0, prev - adjustmentAmount));
  };

  const handleSetSpecificValue = () => {
    const value = parseFloat(specificValue);
    if (!isNaN(value) && value >= 0) {
      setNewCreditLimit(value);
    }
  };

  // Calculate available credit and utilization
  const availableCredit = displayCurrentCreditLimit - displayCurrentBalance;
  const creditUtilizationPercent = currentCreditLimit > 0 ? (currentBalance / currentCreditLimit) * 100 : 0;

  // Calculate the change amount and percentage
  const changeAmount = newCreditLimit - displayCurrentCreditLimit;
  const changePercentage = displayCurrentCreditLimit > 0 
    ? (changeAmount / displayCurrentCreditLimit) * 100 
    : 0;

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
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Update Credit Limit</h4>
            
            {/* New Credit Limit Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 text-center">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">New Credit Limit</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {symbol}{newCreditLimit.toFixed(2)}
              </div>
              
              {/* Change indicator */}
              {newCreditLimit !== displayCurrentCreditLimit && (
                <div className={`text-sm mt-1 ${
                  newCreditLimit > displayCurrentCreditLimit 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {changeAmount > 0 ? '+' : ''}
                  {symbol}{Math.abs(changeAmount).toFixed(2)} ({changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%)
                </div>
              )}
            </div>
            
            {/* Adjustment Controls */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleDecrease}
                className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Minus className="h-4 w-4 mr-1" />
                Decrease
              </button>
              <button
                onClick={handleIncrease}
                className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                {[5, 10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setAdjustmentAmount(amount)}
                    className={`py-2 px-3 text-sm rounded-lg border ${
                      adjustmentAmount === amount
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {symbol}{amount}
                  </button>
                ))}
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleIncrease}
                  className="ml-2 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  +
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
                    type="text"
                    value={specificValue}
                    onChange={(e) => setSpecificValue(e.target.value)}
                    onBlur={handleSetSpecificValue}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetSpecificValue()}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter exact amount"
                  />
                </div>
                <button
                  onClick={handleSetSpecificValue}
                  className="ml-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Set
                </button>
              </div>
            </div>
            
            {/* Warning if new limit is less than balance */}
            {newCreditLimit < displayCurrentBalance && (
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