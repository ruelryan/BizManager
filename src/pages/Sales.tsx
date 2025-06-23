import React from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Eye, Edit, Trash2, ChevronDown, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Sale } from '../types';

export function Sales() {
  const { sales, products, addSale, updateSale, deleteSale } = useStore();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingSale, setEditingSale] = React.useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = React.useState<Sale | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesFilter = filterStatus === 'all' || sale.status === filterStatus;
    return matchesFilter;
  });

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Calculate overdue status based on due date
  const getCalculatedStatus = (sale: Sale): Sale['status'] => {
    if (sale.status === 'paid') return 'paid';
    if (sale.status === 'pending' && sale.dueDate && new Date() > sale.dueDate) {
      return 'overdue';
    }
    return sale.status;
  };

  const handleDeleteSale = (id: string) => {
    if (deleteConfirm === id) {
      deleteSale(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const SearchableProductSelect = ({ 
    value, 
    onChange, 
    onPriceChange,
    placeholder = "Search and select product...",
    required = false 
  }: {
    value: string;
    onChange: (productId: string) => void;
    onPriceChange?: (price: number) => void;
    placeholder?: string;
    required?: boolean;
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProduct = products.find(p => p.id === value);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (product: any) => {
      onChange(product.id);
      if (onPriceChange) {
        onPriceChange(product.price);
      }
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleClear = () => {
      onChange('');
      if (onPriceChange) {
        onPriceChange(0);
      }
      setSearchTerm('');
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={isOpen ? searchTerm : (selectedProduct?.name || '')}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            required={required}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {selectedProduct && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.category} • Stock: {product.currentStock}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                      ₱{product.price.toLocaleString()}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No products found' : 'No products available'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const AddSaleForm = ({ sale, onClose }: { sale?: Sale; onClose: () => void }) => {
    const [formData, setFormData] = React.useState({
      customerName: sale?.customerName || '',
      customerEmail: sale?.customerEmail || '',
      items: sale?.items || [{ productId: '', quantity: 1, price: 0 }],
      paymentType: sale?.paymentType || 'cash' as const,
      status: sale?.status || 'paid' as const,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Set default customer name if empty
      const customerName = formData.customerName.trim() || 'Walk-in Customer';
      
      const saleItems = formData.items
        .filter(item => item.productId)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || '',
            quantity: item.quantity,
            price: item.price || product?.price || 0,
            total: item.quantity * (item.price || product?.price || 0),
          };
        });

      const total = saleItems.reduce((sum, item) => sum + item.total, 0);

      // Check stock availability
      const stockErrors: string[] = [];
      saleItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.currentStock < item.quantity) {
          stockErrors.push(`${product.name} has only ${product.currentStock} units in stock`);
        }
      });

      if (stockErrors.length > 0) {
        alert(`Stock Error:\n${stockErrors.join('\n')}`);
        return;
      }

      const dueDate = formData.status === 'pending' 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        : undefined;

      const saleData = {
        customerId: sale?.customerId || crypto.randomUUID(),
        customerName,
        customerEmail: formData.customerEmail || undefined,
        items: saleItems,
        total,
        paymentType: formData.paymentType,
        status: formData.status,
        date: sale?.date || new Date(),
        dueDate,
      };

      if (sale) {
        updateSale(sale.id, saleData);
      } else {
        addSale(saleData);
      }

      onClose();
      setFormData({
        customerName: '',
        customerEmail: '',
        items: [{ productId: '', quantity: 1, price: 0 }],
        paymentType: 'cash',
        status: 'paid',
      });
    };

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { productId: '', quantity: 1, price: 0 }],
      }));
    };

    const removeItem = (index: number) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    };

    const updateItem = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        ),
      }));
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {sale ? 'Edit Sale' : 'Add New Sale'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Walk-in Customer"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-4 items-end">
                    <div>
                      <SearchableProductSelect
                        value={item.productId}
                        onChange={(productId) => updateItem(index, 'productId', productId)}
                        onPriceChange={(price) => updateItem(index, 'price', price)}
                        placeholder="Search products..."
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Qty"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Price"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₱{(item.quantity * item.price).toLocaleString()}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Type
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value as any }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="gcash">GCash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending (7 days due)</option>
                </select>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">₱{formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                {sale ? 'Update Sale' : 'Create Sale'}
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

  // Sale View Modal
  const SaleViewModal = ({ sale, onClose }: { sale: Sale; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sale Details - {sale.invoiceNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Sale Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer:</h3>
              <p className="text-gray-900 dark:text-white font-medium">{sale.customerName || 'Walk-in Customer'}</p>
              {sale.customerEmail && (
                <p className="text-gray-600 dark:text-gray-400">{sale.customerEmail}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Date: {format(sale.date, 'MMM dd, yyyy')}
              </p>
              {sale.dueDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due: {format(sale.dueDate, 'MMM dd, yyyy')}
                </p>
              )}
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium mt-2 ${getStatusColor(getCalculatedStatus(sale))}`}>
                {getCalculatedStatus(sale)}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-300">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-300">
                      ₱{item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ₱{item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">₱{sale.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method:</span>
                <p className="text-gray-900 dark:text-white capitalize">{sale.paymentType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <p className="text-gray-900 dark:text-white capitalize">{getCalculatedStatus(sale)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your sales and transactions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Sale</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Payment
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
              {filteredSales.map((sale) => {
                const calculatedStatus = getCalculatedStatus(sale);
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {sale.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {sale.customerName || 'Walk-in Customer'}
                      </div>
                      {sale.customerEmail && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{sale.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {format(sale.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₱{sale.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                      {sale.paymentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(calculatedStatus)}`}>
                        {calculatedStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setViewingSale(sale)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="View Sale"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEditingSale(sale)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          title="Edit Sale"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className={`transition-colors ${
                            deleteConfirm === sale.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirm === sale.id ? 'Click again to confirm deletion' : 'Delete sale'}
                        >
                          <Trash2 className="h-4 w-4" />
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
      {filteredSales.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
            📊
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sales found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first sale.
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddForm && <AddSaleForm onClose={() => setShowAddForm(false)} />}
      {editingSale && (
        <AddSaleForm 
          sale={editingSale} 
          onClose={() => setEditingSale(null)} 
        />
      )}
      {viewingSale && (
        <SaleViewModal 
          sale={viewingSale} 
          onClose={() => setViewingSale(null)} 
        />
      )}
    </div>
  );
}