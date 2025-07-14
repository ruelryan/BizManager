import React, { useState } from 'react';
import { format, isAfter } from 'date-fns';
import { 
  X, 
  Edit, 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  Download,
  Printer
} from 'lucide-react';
import { useInstallmentStore } from '../store/installmentStore';
import { InstallmentPlan, InstallmentPayment } from '../types';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useReactToPrint } from 'react-to-print';

interface InstallmentPlanDetailsProps {
  plan: InstallmentPlan;
  onClose: () => void;
  onEditPlan: () => void;
  onRecordPayment: (payment: InstallmentPayment) => void;
}

export function InstallmentPlanDetails({ 
  plan, 
  onClose, 
  onEditPlan, 
  onRecordPayment 
}: InstallmentPlanDetailsProps) {
  const { updateInstallmentPlan, generateReminders } = useInstallmentStore();
  const [isGeneratingReminders, setIsGeneratingReminders] = useState(false);
  
  // Reference for printing
  const printRef = React.useRef<HTMLDivElement>(null);
  
  // Calculate progress
  const progress = plan.totalAmount > 0 
    ? ((plan.totalAmount - plan.remainingBalance) / plan.totalAmount) * 100 
    : 0;
  
  // Sort payments by due date
  const sortedPayments = [...plan.payments].sort((a, b) => 
    a.dueDate.getTime() - b.dueDate.getTime()
  );
  
  // Handle status change
  const handleStatusChange = async (status: 'active' | 'completed' | 'cancelled' | 'defaulted') => {
    try {
      await updateInstallmentPlan(plan.id, { status });
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };
  
  // Handle generate reminders
  const handleGenerateReminders = async () => {
    setIsGeneratingReminders(true);
    try {
      // Find all pending or overdue payments
      const pendingPayments = plan.payments.filter(p => 
        p.status === 'pending' || p.status === 'overdue'
      );
      
      // Generate reminders for each payment
      for (const payment of pendingPayments) {
        await generateReminders(payment.id, ['upcoming', 'due', 'overdue']);
      }
      
      alert('Reminders generated successfully!');
    } catch (error) {
      console.error('Error generating reminders:', error);
      alert('Failed to generate reminders. Please try again.');
    } finally {
      setIsGeneratingReminders(false);
    }
  };
  
  // Handle print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Installment Plan - ${plan.customerName}`,
  });
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'defaulted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Installment Plan Details
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Print"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6" ref={printRef}>
          {/* Plan Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.customerName}
                </h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Plan ID: {plan.id}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Created: {format(plan.createdAt, 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center mt-2">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-end">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Amount
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                <CurrencyDisplay amount={plan.totalAmount} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Remaining: <CurrencyDisplay amount={plan.remainingBalance} />
              </div>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Terms</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Down Payment:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    <CurrencyDisplay amount={plan.downPayment} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Term Length:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.termMonths} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.interestRate}% per year
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(plan.startDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(plan.endDate, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Payments:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.payments.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payments Made:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.payments.filter(p => p.status === 'paid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pending Payments:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.payments.filter(p => p.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overdue Payments:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.payments.filter(p => p.status === 'overdue').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {progress.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {plan.notes && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">{plan.notes}</p>
              </div>
            </div>
          )}
          
          {/* Payment Schedule */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Schedule</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {sortedPayments.map((payment, index) => {
                    const isPastDue = payment.status === 'pending' && isAfter(new Date(), payment.dueDate);
                    
                    return (
                      <tr key={payment.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                        isPastDue ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {format(payment.dueDate, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={payment.amount} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {payment.paymentDate 
                            ? format(payment.paymentDate, 'MMM dd, yyyy')
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {payment.paymentMethod || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium print:hidden">
                          {payment.status !== 'paid' && (
                            <button
                              onClick={() => onRecordPayment(payment)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 print:hidden">
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onEditPlan}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Plan</span>
              </button>
              
              <button
                onClick={handleGenerateReminders}
                disabled={isGeneratingReminders}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell className="h-4 w-4" />
                <span>
                  {isGeneratingReminders ? 'Generating...' : 'Generate Reminders'}
                </span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {plan.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Completed</span>
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('defaulted')}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Mark Defaulted</span>
                  </button>
                </>
              )}
              
              {plan.status !== 'active' && plan.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span>Reactivate Plan</span>
                </button>
              )}
              
              {plan.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel Plan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}