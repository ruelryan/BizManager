import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Return } from '../types';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { ReturnRefundForm } from '../components/ReturnRefundForm';

export function Returns() {
  const { returns, sales, products, addReturn } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterRefundMethod, setFilterRefundMethod] = useState<'all' | 'original' | 'store_credit' | 'cash'>('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showNewReturnForm, setShowNewReturnForm] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');

  // Filter returns based on search and filters
  const filteredReturns = returns.filter(returnItem => {
    // Search filter
    const matchesSearch = 
      returnItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.originalSaleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.items.some(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Status filter
    const matchesStatus = filterStatus === 'all' || returnItem.status === filterStatus;

    // Refund method filter
    const matchesRefundMethod = filterRefundMethod === 'all' || returnItem.refundMethod === filterRefundMethod;

    // Date range filter
    let matchesDateRange = true;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      matchesDateRange = returnItem.date >= cutoffDate;
    }

    return matchesSearch && matchesStatus && matchesRefundMethod && matchesDateRange;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate statistics
  const stats = {
    totalReturns: returns.length,
    totalRefundAmount: returns.reduce((sum, ret) => sum + ret.total, 0),
    pendingReturns: returns.filter(ret => ret.status === 'pending').length,
    defectiveItems: returns.reduce((sum, ret) => 
      sum + ret.items.filter(item => item.isDefective).length, 0
    )
  };

  const handleReturnComplete = async (returnData: any) => {
    try {
      const returnId = await addReturn(returnData);
      setShowNewReturnForm(false);
      alert(`Return ${returnId} processed successfully!`);
    } catch (error: any) {
      console.error('Failed to process return:', error);
      alert(`Failed to process return: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRefundMethodLabel = (method: string) => {
    switch (method) {
      case 'original': return 'Original Payment';
      case 'store_credit': return 'Store Credit';
      case 'cash': return 'Cash';
      default: return method;
    }
  };

  const exportReturnsData = () => {
    const csvHeader = [
      'Return ID', 'Date', 'Original Sale', 'Customer', 'Items', 'Total Amount', 
      'Refund Method', 'Status', 'Reason', 'Defective Items'
    ].join(',');

    const csvData = filteredReturns.map(returnItem => {
      const originalSale = sales.find(s => s.id === returnItem.originalSaleId);
      const defectiveCount = returnItem.items.filter(item => item.isDefective).length;
      
      return [
        returnItem.id,
        format(returnItem.date, 'yyyy-MM-dd'),
        returnItem.originalSaleId,
        originalSale?.customerName || 'N/A',
        returnItem.items.length,
        returnItem.total,
        getRefundMethodLabel(returnItem.refundMethod),
        returnItem.status,
        `"${returnItem.reason}"`,
        defectiveCount
      ].join(',');
    }).join('\n');

    const csv = csvHeader + '\n' + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `returns-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns & Refunds</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage product returns and process refunds</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportReturnsData}
            className="flex items-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowNewReturnForm(true)}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Process Return</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReturns}</p>
            </div>
            <div className="rounded-lg p-3 bg-blue-100 dark:bg-blue-900/30">
              <RotateCcw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Refund Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <CurrencyDisplay amount={stats.totalRefundAmount} />
              </p>
            </div>
            <div className="rounded-lg p-3 bg-green-100 dark:bg-green-900/30">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingReturns}</p>
            </div>
            <div className="rounded-lg p-3 bg-yellow-100 dark:bg-yellow-900/30">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defective Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.defectiveItems}</p>
            </div>
            <div className="rounded-lg p-3 bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Returns
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, reason, product..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Refund Method
            </label>
            <select
              value={filterRefundMethod}
              onChange={(e) => setFilterRefundMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="original">Original Payment</option>
              <option value="store_credit">Store Credit</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Returns History ({filteredReturns.length})
          </h2>
        </div>

        {filteredReturns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Return Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Original Sale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items & Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Refund Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReturns.map((returnItem) => {
                  const originalSale = sales.find(s => s.id === returnItem.originalSaleId);
                  const defectiveCount = returnItem.items.filter(item => item.isDefective).length;
                  
                  return (
                    <tr key={returnItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {returnItem.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format(returnItem.date, 'MMM dd, yyyy')}
                          </div>
                          {defectiveCount > 0 && (
                            <div className="flex items-center mt-1">
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-xs text-red-600 dark:text-red-400">
                                {defectiveCount} defective
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {returnItem.originalSaleId}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {originalSale?.customerName || 'Walk-in'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {returnItem.items.length} items
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={returnItem.total} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getRefundMethodLabel(returnItem.refundMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(returnItem.status)}`}>
                          {returnItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedReturn(returnItem)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No returns found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filterStatus !== 'all' || filterRefundMethod !== 'all' 
                ? 'No returns match your current filters.' 
                : 'No returns have been processed yet.'}
            </p>
            <button
              onClick={() => setShowNewReturnForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Process First Return
            </button>
          </div>
        )}
      </div>

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Return Details
                </h3>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FileText className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Return Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Return Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Return ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedReturn.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {format(selectedReturn.date, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedReturn.status)}`}>
                        {selectedReturn.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Refund Method:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {getRefundMethodLabel(selectedReturn.refundMethod)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Financial Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={selectedReturn.total} />
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Items Count:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedReturn.items.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Returned Items */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Returned Items</h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedReturn.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 dark:text-white">{item.productName}</span>
                              {item.isDefective && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Defective
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={item.price} />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={item.total} />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Return Reason</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  {selectedReturn.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Return Form */}
      {showNewReturnForm && (
        <ReturnRefundForm 
          onClose={() => setShowNewReturnForm(false)}
          onComplete={handleReturnComplete}
        />
      )}
    </div>
  );
}