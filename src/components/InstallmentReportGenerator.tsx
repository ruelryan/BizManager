import React, { useState, useRef } from 'react';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { 
  X, 
  Calendar, 
  Download, 
  Printer, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useInstallmentStore } from '../store/installmentStore';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useReactToPrint } from 'react-to-print';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface InstallmentReportGeneratorProps {
  onClose: () => void;
}

export function InstallmentReportGenerator({ onClose }: InstallmentReportGeneratorProps) {
  const { installmentPlans, installmentPayments, generatePaymentReport } = useInstallmentStore();
  
  // Report options
  const [reportType, setReportType] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(true);
  const [showPaymentTrends, setShowPaymentTrends] = useState(true);
  
  // Reference for printing
  const printRef = useRef<HTMLDivElement>(null);
  
  // Generate report based on selected options
  const generateReport = () => {
    let startDate: Date, endDate: Date;
    
    if (reportType === 'monthly') {
      // Last 30 days
      startDate = subMonths(new Date(), 1);
      endDate = new Date();
    } else if (reportType === 'annual') {
      // Last 12 months
      startDate = subYears(new Date(), 1);
      endDate = new Date();
    } else {
      // Custom date range
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    }
    
    return generatePaymentReport(startDate, endDate);
  };
  
  const report = generateReport();
  
  // Prepare data for charts
  const prepareStatusData = () => {
    const statusCounts = {
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0
    };
    
    report.payments.forEach(payment => {
      if (payment.status in statusCounts) {
        statusCounts[payment.status as keyof typeof statusCounts]++;
      }
    });
    
    return [
      { name: 'Paid', value: statusCounts.paid, color: '#10b981' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#6b7280' }
    ];
  };
  
  const preparePaymentTrendsData = () => {
    // Group payments by month
    const paymentsByMonth: Record<string, { paid: number, pending: number, overdue: number }> = {};
    
    report.payments.forEach(payment => {
      const month = format(payment.dueDate, 'MMM yyyy');
      
      if (!paymentsByMonth[month]) {
        paymentsByMonth[month] = { paid: 0, pending: 0, overdue: 0 };
      }
      
      if (payment.status === 'paid') {
        paymentsByMonth[month].paid += payment.amount;
      } else if (payment.status === 'pending') {
        paymentsByMonth[month].pending += payment.amount;
      } else if (payment.status === 'overdue') {
        paymentsByMonth[month].overdue += payment.amount;
      }
    });
    
    // Convert to array for chart
    return Object.entries(paymentsByMonth).map(([month, data]) => ({
      month,
      paid: data.paid,
      pending: data.pending,
      overdue: data.overdue
    }));
  };
  
  const statusData = prepareStatusData();
  const paymentTrendsData = preparePaymentTrendsData();
  
  // Export report as CSV
  const exportToCSV = () => {
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
    csvContent += `Report Period,${format(report.startDate, 'yyyy-MM-dd')} to ${format(report.endDate, 'yyyy-MM-dd')}\n`;
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
  
  // Handle print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Installment Report - ${format(new Date(), 'yyyy-MM-dd')}`,
  });
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Installment Payment Reports
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Options */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Period
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={reportType === 'monthly'}
                        onChange={() => setReportType('monthly')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Last 30 Days</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={reportType === 'annual'}
                        onChange={() => setReportType('annual')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Last 12 Months</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={reportType === 'custom'}
                        onChange={() => setReportType('custom')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Custom Range</span>
                    </label>
                  </div>
                </div>
                
                {reportType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Components
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showStatusBreakdown}
                        onChange={(e) => setShowStatusBreakdown(e.target.checked)}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Payment Status Breakdown</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showPaymentTrends}
                        onChange={(e) => setShowPaymentTrends(e.target.checked)}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Payment Trends</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Report</span>
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Report Content */}
          <div className="lg:col-span-3" ref={printRef}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Installment Payment Report
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {format(report.startDate, 'MMM dd, yyyy')} - {format(report.endDate, 'MMM dd, yyyy')}
                </p>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collected</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={report.summary.paidAmount} />
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={report.summary.pendingAmount} />
                      </p>
                    </div>
                    <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-3">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={report.summary.overdueAmount} />
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="space-y-6">
                {/* Payment Status Breakdown */}
                {showStatusBreakdown && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Payment Status Breakdown
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Payment Trends */}
                {showPaymentTrends && paymentTrendsData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Payment Trends
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paymentTrendsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="paid" name="Paid" fill="#10b981" />
                          <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
                          <Bar dataKey="overdue" name="Overdue" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Detailed Metrics */}
              <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Report Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Payments:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {report.summary.totalPayments}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={report.summary.totalAmount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Paid Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={report.summary.paidAmount} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pending Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={report.summary.pendingAmount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Overdue Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={report.summary.overdueAmount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Delinquency Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {report.summary.delinquencyRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Details Table */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Details
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Customer
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {report.payments.map((payment) => {
                        const plan = installmentPlans.find(p => p.id === payment.installmentPlanId);
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {plan?.customerName || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {format(payment.dueDate, 'MMM dd, yyyy')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              <CurrencyDisplay amount={payment.amount} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                payment.status === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {payment.paymentDate 
                                ? format(payment.paymentDate, 'MMM dd, yyyy')
                                : '-'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}