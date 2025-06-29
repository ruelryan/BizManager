import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, AlertTriangle, CreditCard, Tag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Customer } from '../types';
import { CreditLimitManager } from '../components/CreditLimitManager';
import { CustomerPricing } from '../components/CustomerPricing';
import { CurrencyDisplay } from './components/CurrencyDisplay';
import { CurrencyInput } from './components/CurrencyInput';

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState<number>(0);
  const [showCreditManager, setShowCreditManager] = useState<Customer | null>(null);
  const [showCustomerPricing, setShowCustomerPricing] = useState<Customer | null>(null);

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm));
    
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && customer.isActive) ||
      (filterActive === 'inactive' && !customer.isActive);
    
    return matchesSearch && matchesFilter;
  });

  // Handle delete with confirmation and countdown
  const handleDeleteCustomer = (id: string) => {
    if (deleteConfirm === id) {
      // Second click - actually delete
      deleteCustomer(id);
      setDeleteConfirm(null);
      setDeleteCountdown(0);
    } else {
      // First click - start confirmation
      setDeleteConfirm(id);
      setDeleteCountdown(5);
      
      // Start countdown
      const interval = setInterval(() => {
        setDeleteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setDeleteConfirm(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleUpdateCreditLimit = async (customerId: string, newCreditLimit: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    await updateCustomer(customerId, {
      ...customer,
      creditLimit: newCreditLimit
    });
  };

  const CustomerForm = ({ customer, onClose }: { customer?: Customer; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      creditLimit: customer?.creditLimit || 0,
      isActive: customer?.isActive ?? true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        if (customer) {
          await updateCustomer(customer.id, formData);
        } else {
          await addCustomer(formData);
        }
        
        onClose();
      } catch (error: any) {
        console.error('Failed to save customer:', error);
        alert('Failed to save customer: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="+63 912 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Customer's address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Limit
              </label>
              <CurrencyInput
                value={formData.creditLimit}
                onChange={(value) => setFormData(prev => ({ ...prev, creditLimit: value }))}
                min={0}
                step={100}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set to 0 for no credit limit
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active Customer
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  customer ? 'Update Customer' : 'Add Customer'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Credit Status
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
              {filteredCustomers.map((customer) => {
                // Calculate credit utilization percentage
                const creditUtilization = customer.creditLimit > 0 
                  ? (customer.balance / customer.creditLimit) * 100 
                  : 0;
                
                // Determine credit status color
                const creditStatusColor = customer.creditLimit === 0 
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
                  : creditUtilization > 90 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                    : creditUtilization > 70 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                
                // Check if customer has special pricing
                const hasSpecialPricing = customer.specialPricing && Object.keys(customer.specialPricing).length > 0;
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      {customer.address && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{customer.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.phone && (
                        <div className="text-sm text-gray-900 dark:text-gray-300">{customer.phone}</div>
                      )}
                      {customer.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.creditLimit > 0 ? (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            Balance: <CurrencyDisplay amount={customer.balance} /> / <CurrencyDisplay amount={customer.creditLimit} />
                          </div>
                          <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                            <div 
                              className={`h-1.5 rounded-full ${
                                creditUtilization > 90 
                                  ? 'bg-red-500' 
                                  : creditUtilization > 70 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No credit</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                        
                        {hasSpecialPricing && (
                          <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Special Pricing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setEditingCustomer(customer)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setShowCreditManager(customer)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          title="Manage Credit Limit"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setShowCustomerPricing(customer)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="Special Pricing"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className={`relative transition-colors ${
                            deleteConfirm === customer.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirm === customer.id ? `Click again to confirm (${deleteCountdown}s)` : 'Delete customer'}
                        >
                          {deleteConfirm === customer.id ? (
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs font-medium">{deleteCountdown}</span>
                            </div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
      {filteredCustomers.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No customers found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterActive !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by adding your first customer.'}
          </p>
        </div>
      )}

      {/* Forms and Modals */}
      {showAddForm && (
        <CustomerForm onClose={() => setShowAddForm(false)} />
      )}
      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}
      {showCreditManager && (
        <CreditLimitManager
          customerId={showCreditManager.id}
          customerName={showCreditManager.name}
          currentBalance={showCreditManager.balance}
          currentCreditLimit={showCreditManager.creditLimit}
          onClose={() => setShowCreditManager(null)}
          onUpdate={(newLimit) => handleUpdateCreditLimit(showCreditManager.id, newLimit)}
        />
      )}
      {showCustomerPricing && (
        <CustomerPricing
          customerId={showCustomerPricing.id}
          customerName={showCustomerPricing.name}
          onClose={() => setShowCustomerPricing(null)}
          onSave={() => setShowCustomerPricing(null)}
        />
      )}
    </div>
  );
}