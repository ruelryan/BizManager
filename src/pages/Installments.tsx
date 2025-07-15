import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Bell, 
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useInstallmentStore } from '../store/installmentStore';
import { InstallmentPlan, InstallmentPayment, Customer } from '../types';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { InstallmentPlanForm } from '../components/InstallmentPlanForm';
import { InstallmentPaymentForm } from '../components/InstallmentPaymentForm';
import { InstallmentPlanDetails } from '../components/InstallmentPlanDetails';
import { InstallmentReportGenerator } from '../components/InstallmentReportGenerator';

export function Installments() {
  // Store hooks
  const { customers } = useStore();
  const { 
    installmentPlans, 
    installmentPayments, 
    fetchInstallmentPlans, 
    fetchInstallmentPayments,
    getPaymentSummary,
    generatePaymentReport
  } = useInstallmentStore();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'defaulted' | 'cancelled'>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<InstallmentPayment | null>(null);
  
  // Summary metrics
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    activePlans: 0,
    completionRate: 0
  });
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchInstallmentPlans();
      await fetchInstallmentPayments();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchInstallmentPlans, fetchInstallmentPayments]);
  
  // Update summary when time range changes
  useEffect(() => {
    const summary = getPaymentSummary(timeRange);
    setSummary(summary);
  }, [timeRange, installmentPlans, installmentPayments, getPaymentSummary]);
  
  // Filter plans based on search term and status filter
  const filteredPlans = installmentPlans.filter(plan => {
    const matchesSearch = 
      plan.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle plan selection
  const handleSelectPlan = (plan: InstallmentPlan) => {
    setSelectedPlan(plan);
    setShowPlanDetails(true);
  };
  
  // Handle payment selection
  const handleSelectPayment = (payment: InstallmentPayment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(true);
  };
  
  // Get customer by ID
  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(c => c.id === id);
  };
  
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
  
  // Export data as CSV
  const exportToCSV = () => {
    // Generate report for the selected time range
    let startDate: Date, endDate: Date;
    const now = new Date();
    
    if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // All time
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2100, 11, 31);
    }
    
    const report = generatePaymentReport(startDate, endDate);
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Payment ID,Plan ID,Customer,Amount,Due Date,Payment Date,Status,Payment Method\n";
    
    // Add data rows
    report.payments.forEach(payment => {
      const plan = installmentPlans.find(p => p.id === payment.installmentPlanId);
      const customerName = plan?.customerName || 'Unknown';
      
      csvContent += [
        payment.id,
        payment.installmentPlanId,
        customerName,
        payment.amount,
        format(payment.dueDate, 'yyyy-MM-dd'),
        payment.paymentDate ? format(payment.paymentDate, 'yyyy-MM-dd') : '',
        payment.status,
        payment.paymentMethod || ''
      ].join(',') + "\n";
    });
    
    // Add summary section
    csvContent += "\nSummary\n";
    csvContent += `Report Period,${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`;
    csvContent += `Total Payments,${report.summary.totalPayments}\n`;
    csvContent += `Total Amount,${report.summary.totalAmount}\n`;
    csvContent += `Paid Amount,${report.summary.paidAmount}\n`;
    csvContent += `Pending Amount,${report.summary.pendingAmount}\n`;
    csvContent += `Overdue Amount,${report.summary.overdueAmount}\n`;
    csvContent += `Delinquency Rate,${report.summary.delinquencyRate.toFixed(2)}%\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `installment_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Installment Payments</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer installment plans and payment schedules</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowReportGenerator(true)}
            className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Installment Plan</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector and Summary Stats */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Time Range Selector */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Period</h2>
          <div className="space-y-2">
            <button
              onClick={() => setTimeRange('month')}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg ${
                timeRange === 'month'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>This Month</span>
              {timeRange === 'month' && <CheckCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg ${
                timeRange === 'year'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>This Year</span>
              {timeRange === 'year' && <CheckCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg ${
                timeRange === 'all'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>All Time</span>
              {timeRange === 'all' && <CheckCircle className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="mt-6">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center space-x-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="md:col-span-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Collected */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={summary.totalCollected} />
                </p>
              </div>
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          {/* Pending Payments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={summary.totalPending} />
                </p>
              </div>
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          {/* Active Plans */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.activePlans}</p>
              </div>
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          {/* Overdue Payments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={summary.totalOverdue} />
                </p>
              </div>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Installment Plans Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Next Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredPlans.map((plan) => {
                // Find next pending payment
                const nextPayment = plan.payments
                  .filter(p => p.status === 'pending')
                  .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
                
                // Calculate progress percentage
                const progress = plan.totalAmount > 0 
                  ? ((plan.totalAmount - plan.remainingBalance) / plan.totalAmount) * 100 
                  : 0;
                
                return (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.customerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {plan.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <CurrencyDisplay amount={plan.totalAmount} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={plan.remainingBalance} />
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {plan.termMonths} months
                      {plan.interestRate > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.interestRate}% interest
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {format(plan.startDate, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {nextPayment ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={nextPayment.amount} />
                          </div>
                          <div className={`text-xs ${
                            isAfter(new Date(), nextPayment.dueDate)
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {format(nextPayment.dueDate, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No pending payments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleSelectPlan(plan)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowAddForm(true);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          title="Edit Plan"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (nextPayment) {
                              setSelectedPayment(nextPayment);
                              setShowPaymentForm(true);
                            }
                          }}
                          className={`${
                            nextPayment
                              ? 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          }`}
                          disabled={!nextPayment}
                          title="Record Payment"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No installment plans found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'Get started by creating your first installment plan.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Installment Plan
            </button>
          )}
        </div>
      )}

      {/* Forms and Modals */}
      {showAddForm && (
        <InstallmentPlanForm
          plan={selectedPlan}
          onClose={() => {
            setShowAddForm(false);
            setSelectedPlan(null);
          }}
        />
      )}
      
      {showPaymentForm && selectedPayment && (
        <InstallmentPaymentForm
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedPayment(null);
          }}
        />
      )}
      
      {showPlanDetails && selectedPlan && (
        <InstallmentPlanDetails
          plan={selectedPlan}
          onClose={() => {
            setShowPlanDetails(false);
            setSelectedPlan(null);
          }}
          onEditPlan={() => {
            setShowPlanDetails(false);
            setShowAddForm(true);
          }}
          onRecordPayment={(payment) => {
            setShowPlanDetails(false);
            setSelectedPayment(payment);
            setShowPaymentForm(true);
          }}
        />
      )}
      
      {showReportGenerator && (
        <InstallmentReportGenerator
          onClose={() => setShowReportGenerator(false)}
        />
      )}
    </div>
  );
}