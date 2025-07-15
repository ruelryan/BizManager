import React from 'react';
import { format } from 'date-fns';
import { Plus, Search, Edit, Trash2, Receipt, DollarSign, ChevronDown, AlertTriangle, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Expense } from '../types';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { PaymentTypeManager } from '../components/PaymentTypeManager';

export function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, getExpenseCategories, paymentTypes } = useStore();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [deleteCountdown, setDeleteCountdown] = React.useState<number>(0);
  const [showPaymentTypeManager, setShowPaymentTypeManager] = React.useState(false);

  // Get unique categories
  const categories = getExpenseCategories();

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  // Handle delete with confirmation and countdown
  const handleDeleteExpense = (id: string) => {
    if (deleteConfirm === id) {
      // Second click - actually delete
      deleteExpense(id);
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

  const ExpenseForm = ({ expense, onClose }: { expense?: Expense; onClose: () => void }) => {
    const [formData, setFormData] = React.useState({
      description: expense?.description || '',
      amount: expense?.amount || 0,
      category: expense?.category || '',
      date: expense?.date ? format(expense.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: expense?.paymentMethod || paymentTypes[0]?.id || 'cash',
      notes: expense?.notes || '',
    });
    const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
    const [customCategory, setCustomCategory] = React.useState('');

    const existingCategories = getExpenseCategories();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const finalCategory = customCategory || formData.category;
      
      const expenseData = {
        ...formData,
        category: finalCategory,
        date: new Date(formData.date),
      };

      if (expense) {
        updateExpense(expense.id, expenseData);
      } else {
        addExpense(expenseData);
      }
      
      onClose();
    };

    const handleCategorySelect = (category: string) => {
      setFormData(prev => ({ ...prev, category }));
      setCustomCategory('');
      setShowCategoryDropdown(false);
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {expense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Office rent, Utilities, Supplies"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (PHP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customCategory || formData.category}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Type or select category"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                
                {showCategoryDropdown && existingCategories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {existingCategories.map((category, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setShowPaymentTypeManager(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </button>
                </div>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {paymentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional notes about this expense..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                {expense ? 'Update Expense' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your business expenses and costs</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              <CurrencyDisplay amount={totalExpenses} />
            </p>
          </div>
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
            <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowPaymentTypeManager(true)}
            className="flex items-center space-x-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Payment Types</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredExpenses.map((expense) => {
                // Find the payment type name
                const paymentTypeName = paymentTypes.find(pt => pt.id === expense.paymentMethod)?.name || expense.paymentMethod;
                
                return (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </div>
                      {expense.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                      -<CurrencyDisplay amount={expense.amount} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {format(expense.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                      {paymentTypeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setEditingExpense(expense)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Edit Expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className={`relative transition-colors ${
                            deleteConfirm === expense.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirm === expense.id ? `Click again to confirm (${deleteCountdown}s)` : 'Delete Expense'}
                        >
                          {deleteConfirm === expense.id ? (
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
      {filteredExpenses.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No expenses found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms.' : 'Start tracking your business expenses.'}
          </p>
        </div>
      )}

      {/* Forms */}
      {showAddForm && (
        <ExpenseForm onClose={() => setShowAddForm(false)} />
      )}
      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
      {showPaymentTypeManager && (
        <PaymentTypeManager
          onClose={() => setShowPaymentTypeManager(false)}
        />
      )}
    </div>
  );
}