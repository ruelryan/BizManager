import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, CreditCard, FileText, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useInstallmentStore } from '../store/installmentStore';
import { InstallmentPayment } from '../types';
import { CurrencyDisplay } from './CurrencyDisplay';

interface InstallmentPaymentFormProps {
  payment: InstallmentPayment;
  onClose: () => void;
}

export function InstallmentPaymentForm({ payment, onClose }: InstallmentPaymentFormProps) {
  const { paymentTypes } = useStore();
  const { 
    installmentPlans, 
    updateInstallmentPayment, 
    generateReminders 
  } = useInstallmentStore();
  
  // Form state
  const [formData, setFormData] = useState({
    amount: payment.amount,
    paymentDate: payment.paymentDate ? format(payment.paymentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    status: payment.status,
    paymentMethod: payment.paymentMethod || paymentTypes[0]?.id || 'cash',
    notes: payment.notes || '',
    createReminders: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get the installment plan for this payment
  const plan = installmentPlans.find(p => p.id === payment.installmentPlanId);
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
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
      // Prepare payment data
      const paymentData: Partial<InstallmentPayment> = {
        amount: formData.amount,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
        status: formData.status === 'paid' ? 'paid' : payment.status,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };
      
      // Update payment
      await updateInstallmentPayment(payment.id, paymentData);
      
      // Generate reminders if requested
      if (formData.createReminders && formData.status !== 'paid') {
        await generateReminders(payment.id, ['upcoming', 'due', 'overdue']);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      setErrors({ submit: 'Failed to save payment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Record Payment
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
          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {plan?.customerName}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {format(payment.dueDate, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                <CurrencyDisplay amount={payment.amount} />
              </span>
            </div>
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.amount 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
            )}
          </div>
          
          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.paymentDate 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.paymentDate}</p>
            )}
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.paymentMethod 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                {paymentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.paymentMethod}</p>
            )}
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Status
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={formData.status === 'paid'}
                  onChange={() => setFormData(prev => ({ ...prev, status: 'paid' }))}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Paid</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={formData.status !== 'paid'}
                  onChange={() => setFormData(prev => ({ ...prev, status: payment.status }))}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {payment.status === 'pending' ? 'Still Pending' : 'Still Overdue'}
                </span>
              </label>
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
                placeholder="Add any notes about this payment..."
              />
            </div>
          </div>
          
          {/* Reminders */}
          {formData.status !== 'paid' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createReminders"
                checked={formData.createReminders}
                onChange={(e) => setFormData(prev => ({ ...prev, createReminders: e.target.checked }))}
                className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <label htmlFor="createReminders" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <Bell className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                Create payment reminders
              </label>
            </div>
          )}
          
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
                formData.status === 'paid' ? 'Record Payment' : 'Update Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}