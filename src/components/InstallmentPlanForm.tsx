import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Percent, Clock, User, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useInstallmentStore } from '../store/installmentStore';
import { InstallmentPlan, Customer, Sale } from '../types';
import { CurrencyDisplay } from './CurrencyDisplay';

interface InstallmentPlanFormProps {
  plan?: InstallmentPlan | null;
  saleId?: string;
  onClose: () => void;
}

export function InstallmentPlanForm({ plan, saleId, onClose }: InstallmentPlanFormProps) {
  const { customers, sales } = useStore();
  const { addInstallmentPlan, updateInstallmentPlan, generatePaymentSchedule } = useInstallmentStore();
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: plan?.customerId || '',
    totalAmount: plan?.totalAmount || 0,
    downPayment: plan?.downPayment || 0,
    termMonths: plan?.termMonths || 3,
    interestRate: plan?.interestRate || 0,
    startDate: plan?.startDate ? format(plan.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    notes: plan?.notes || '',
    saleId: plan?.saleId || saleId || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<any[]>([]);
  
  // If a sale ID is provided, pre-fill the form with sale data
  useEffect(() => {
    if (saleId && !plan) {
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        setFormData(prev => ({
          ...prev,
          customerId: sale.customerId || '',
          totalAmount: sale.total,
          saleId
        }));
      }
    }
  }, [saleId, sales, plan]);
  
  // Generate payment schedule preview when form data changes
  useEffect(() => {
    if (formData.totalAmount > 0 && formData.termMonths > 0) {
      const remainingAmount = formData.totalAmount - formData.downPayment;
      if (remainingAmount > 0) {
        const schedule = generatePaymentSchedule(
          formData.totalAmount,
          formData.downPayment,
          formData.termMonths,
          formData.interestRate,
          new Date(formData.startDate)
        );
        setPaymentSchedule(schedule);
      } else {
        setPaymentSchedule([]);
      }
    }
  }, [formData, generatePaymentSchedule]);
  
  // Calculate remaining balance
  const remainingBalance = formData.totalAmount - formData.downPayment;
  
  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (formData.termMonths <= 0 || remainingBalance <= 0) return 0;
    
    const monthlyInterestRate = formData.interestRate / 100 / 12;
    
    if (formData.interestRate > 0) {
      // Formula for monthly payment with interest: P * r * (1 + r)^n / ((1 + r)^n - 1)
      const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, formData.termMonths);
      const denominator = Math.pow(1 + monthlyInterestRate, formData.termMonths) - 1;
      return remainingBalance * (numerator / denominator);
    } else {
      // Simple division for zero interest
      return remainingBalance / formData.termMonths;
    }
  };
  
  const monthlyPayment = calculateMonthlyPayment();
  
  // Calculate end date
  const calculateEndDate = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + formData.termMonths);
    return format(endDate, 'yyyy-MM-dd');
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0';
    }
    
    if (formData.downPayment < 0) {
      newErrors.downPayment = 'Down payment cannot be negative';
    }
    
    if (formData.downPayment >= formData.totalAmount) {
      newErrors.downPayment = 'Down payment must be less than total amount';
    }
    
    if (formData.termMonths <= 0) {
      newErrors.termMonths = 'Term must be at least 1 month';
    }
    
    if (formData.interestRate < 0) {
      newErrors.interestRate = 'Interest rate cannot be negative';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endDate = new Date(formData.startDate);
      endDate.setMonth(endDate.getMonth() + formData.termMonths);
      
      if (plan) {
        // Update existing plan
        await updateInstallmentPlan(plan.id, {
          customerId: formData.customerId,
          totalAmount: formData.totalAmount,
          downPayment: formData.downPayment,
          remainingBalance,
          termMonths: formData.termMonths,
          interestRate: formData.interestRate,
          startDate: new Date(formData.startDate),
          endDate,
          notes: formData.notes,
          saleId: formData.saleId || undefined
        });
      } else {
        // Create new plan
        await addInstallmentPlan({
          customerId: formData.customerId,
          totalAmount: formData.totalAmount,
          downPayment: formData.downPayment,
          remainingBalance,
          termMonths: formData.termMonths,
          interestRate: formData.interestRate,
          status: 'active',
          startDate: new Date(formData.startDate),
          endDate,
          notes: formData.notes,
          saleId: formData.saleId || undefined
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving installment plan:', error);
      setErrors({ submit: 'Failed to save installment plan. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {plan ? 'Edit Installment Plan' : 'Create New Installment Plan'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.customerId 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customerId}</p>
            )}
          </div>
          
          {/* Amount Fields */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    totalAmount: parseFloat(e.target.value) || 0 
                  }))}
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.totalAmount 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.totalAmount}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Down Payment
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.downPayment}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    downPayment: parseFloat(e.target.value) || 0 
                  }))}
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.downPayment 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              {errors.downPayment && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.downPayment}</p>
              )}
            </div>
          </div>
          
          {/* Term and Interest */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Term (Months) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.termMonths}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    termMonths: parseInt(e.target.value) || 0 
                  }))}
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.termMonths 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              {errors.termMonths && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.termMonths}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (% per year)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    interestRate: parseFloat(e.target.value) || 0 
                  }))}
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.interestRate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              {errors.interestRate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.interestRate}</p>
              )}
            </div>
          </div>
          
          {/* Start Date and Sale ID */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.startDate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Sale (Optional)
              </label>
              <select
                value={formData.saleId}
                onChange={(e) => setFormData(prev => ({ ...prev, saleId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None</option>
                {sales
                  .filter(sale => !sale.installmentId || (plan && sale.installmentId === plan.id))
                  .map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoiceNumber} - <CurrencyDisplay amount={sale.total} />
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add any additional notes about this installment plan..."
              />
            </div>
          </div>
          
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Summary</h3>
              <button
                type="button"
                onClick={() => setShowPaymentPreview(!showPaymentPreview)}
                className="text-blue-600 dark:text-blue-400 text-sm flex items-center"
              >
                {showPaymentPreview ? 'Hide Details' : 'Show Details'}
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showPaymentPreview ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={formData.totalAmount} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Down Payment:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={formData.downPayment} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={remainingBalance} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={monthlyPayment} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {calculateEndDate()}
                </span>
              </div>
            </div>
            
            {/* Payment Schedule Preview */}
            {showPaymentPreview && paymentSchedule.length > 0 && (
              <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Schedule</h4>
                <div className="max-h-40 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Due Date
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paymentSchedule.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-300">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-300">
                            {format(payment.dueDate, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={payment.amount} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {errors.submit && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {errors.submit}
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                plan ? 'Update Plan' : 'Create Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}