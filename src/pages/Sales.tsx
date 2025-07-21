import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Eye, Edit, Trash2, ChevronDown, X, AlertTriangle, Tag, FileText, RotateCcw, Settings, Send, Download, DollarSign, Calendar, CreditCard, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Sale, SaleItem } from '../types';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { DigitalReceipt } from '../components/DigitalReceipt';
import { ReturnRefundForm } from '../components/ReturnRefundForm';
import { PaymentTypeManager } from '../components/PaymentTypeManager';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { POSInterface } from '../components/POSInterface';
import { useReactToPrint } from 'react-to-print';

export function Sales() {
  const { sales, products, customers, addSale, updateSale, deleteSale, paymentTypes } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPOSInterface, setShowPOSInterface] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState<number>(0);
  const [showCodeScanner, setShowCodeScanner] = useState(false);
  const [showDigitalReceipt, setShowDigitalReceipt] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showPaymentTypeManager, setShowPaymentTypeManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'sales' | 'invoices'>('sales');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Add a ref for printing invoice
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const handlePrintInvoice = useReactToPrint({
    content: () => invoicePrintRef.current,
    documentTitle: viewingSale ? `Invoice-${viewingSale.invoiceNumber}` : 'Invoice',
    removeAfterPrint: true,
  });

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesFilter = filterStatus === 'all' || sale.status === filterStatus;
    const matchesSearch = (sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
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

  // Handle delete with confirmation and countdown
  const handleDeleteSale = (id: string) => {
    if (deleteConfirm === id) {
      // Second click - actually delete
      deleteSale(id);
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

  const handleCodeScanned = (code: string) => {
    setShowCodeScanner(false);
    
    // Find product by code
    const product = products.find(p => p.barcode === code);
    
    if (product) {
      // If we're in add/edit mode, add the product to the sale
      if (showAddForm || editingSale) {
        // This would add the product to the current sale form
        alert(`Product found: ${product.name}`);
      } else {
        // Otherwise, just show product details
        alert(`Product found: ${product.name}\nPrice: ${product.price}\nStock: ${product.currentStock}`);
      }
    } else {
      alert(`No product found with code: ${code}`);
    }
  };

  const handleShowDigitalReceipt = (sale: Sale) => {
    setViewingSale(sale);
    setShowDigitalReceipt(true);
  };

  const handleSendReceiptEmail = () => {
    // In a real implementation, this would send an email
    alert('Receipt sent to customer email');
    setShowDigitalReceipt(false);
  };

  const handleReturnComplete = (returnData: any) => {
    // In a real implementation, this would process the return/refund
    console.log('Return data:', returnData);
    alert('Return processed successfully');
    setShowReturnForm(false);
  };

  const SearchableProductSelect = ({ 
    value, 
    onChange, 
    onPriceChange,
    placeholder = "Search and select product...",
    required = false,
    customerId = ''
  }: {
    value: string;
    onChange: (productId: string) => void;
    onPriceChange?: (price: number) => void;
    placeholder?: string;
    required?: boolean;
    customerId?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Get customer special pricing if available
    const customer = customers.find(c => c.id === customerId);
    const hasSpecialPricing = customer?.specialPricing && Object.keys(customer.specialPricing).length > 0;

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
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
        // Check if customer has special pricing for this product
        if (hasSpecialPricing && customer?.specialPricing?.[product.id]) {
          onPriceChange(customer.specialPricing[product.id]);
        } else {
          onPriceChange(product.price);
        }
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

    const handleScanCode = () => {
      setIsOpen(false);
      setShowCodeScanner(true);
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
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleScanCode}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Enter Product Code"
              aria-label="Scan product code"
            >
              <Tag className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Toggle product dropdown"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                // Check if this product has special pricing for the selected customer
                const hasSpecialPrice = hasSpecialPricing && customer?.specialPricing?.[product.id];
                const specialPrice = hasSpecialPrice ? customer?.specialPricing?.[product.id] : null;
                
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-base">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category} • Stock: {product.currentStock}
                          {product.barcode && ` • Code: ${product.barcode}`}
                        </div>
                      </div>
                      <div className="text-base font-medium ml-4 min-w-[100px] text-right">
                        {hasSpecialPrice ? (
                          <div>
                            <span className="line-through text-gray-400 dark:text-gray-500 text-sm">
                              <CurrencyDisplay amount={product.price} />
                            </span>
                            <span className="text-green-600 dark:text-green-400 ml-1 block">
                              <CurrencyDisplay amount={specialPrice} />
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-900 dark:text-white">
                            <CurrencyDisplay amount={product.price} />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
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
    const [formData, setFormData] = useState({
      customerName: sale?.customerName || '',
      customerEmail: sale?.customerEmail || '',
      customerId: sale?.customerId || '',
      items: sale?.items || [{ productId: '', quantity: 1, price: 0, total: 0 }],
      paymentType: sale?.paymentType || paymentTypes[0]?.id || 'cash',
      status: sale?.status || 'paid' as const,
      useCredit: false,
      installmentTerms: 12,
      installmentDownPayment: 0,
      installmentInterestRate: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(customers.find(c => c.id === sale?.customerId) || null);

    // Remove credit-related calculations

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        // Set default customer name if empty
        const customerName = formData.customerName.trim() || 'Walk-in Customer';
        
        const saleItems = formData.items
          .filter(item => item.productId)
          .map(item => {
            const product = products.find(p => p.id === item.productId);
            
            // Check if customer has special pricing for this product
            let price = item.price || product?.price || 0;
            if (selectedCustomer?.specialPricing?.[item.productId]) {
              price = selectedCustomer.specialPricing[item.productId];
            }
            
            return {
              productId: item.productId,
              productName: product?.name || '',
              quantity: item.quantity,
              price: price,
              total: item.quantity * price,
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
          setIsSubmitting(false);
          return;
        }

        // Check if customer is selected for installment
        if (formData.status === 'pending' && !selectedCustomer) {
          alert('Please select a customer for pending sales');
          setIsSubmitting(false);
          return;
        }

        const dueDate = formData.status === 'pending' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          : undefined;

        let installmentPlanId = undefined;
        
        // Create installment plan if needed
        if (formData.status === 'pending' && selectedCustomer) {
          const installmentRemainingBalance = total - (formData.installmentDownPayment ?? 0);
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + formData.installmentTerms);
          
          const installmentPlan = {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            totalAmount: total,
            downPayment: formData.installmentDownPayment,
            remainingBalance: installmentRemainingBalance,
            termMonths: formData.installmentTerms,
            interestRate: formData.installmentInterestRate,
            status: 'active' as const,
            startDate: new Date(),
            endDate,
            notes: `Installment plan for sale`,
            saleId: `temp-${Date.now()}`
          };
          
          // await addInstallmentPlan(installmentPlan); // This line was removed as per edit hint
          installmentPlanId = installmentPlan.saleId;
        }

        const saleData = {
          customerId: formData.customerId || sale?.customerId || '',
          customerName,
          customerEmail: formData.customerEmail || undefined,
          items: saleItems,
          total,
          paymentType: formData.paymentType,
          status: formData.status,
          date: sale?.date || new Date(),
          dueDate,
          useCredit: formData.useCredit,
          installmentPlanId
        };

        if (sale) {
          await updateSale(sale.id, saleData);
        } else {
          await addSale(saleData);
        }

        onClose();
        setFormData({
          customerName: '',
          customerEmail: '',
          customerId: '',
          items: [{ productId: '', quantity: 1, price: 0, total: 0 }],
          paymentType: paymentTypes[0]?.id || 'cash',
          status: 'paid',
          useCredit: false,
          installmentTerms: 12,
          installmentDownPayment: 0,
          installmentInterestRate: 0
        });
      } catch (error: any) {
        console.error('Failed to save sale:', error);
        alert('Failed to save sale: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { productId: '', quantity: 1, price: 0, total: 0 }],
      }));
    };

    const removeItem = (index: number) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    };

    const updateItem = (index: number, field: string, value: any) => {
      setFormData(prev => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // Recalculate total if quantity or price changes
        if (field === 'quantity' || field === 'price') {
          updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
        }
        
        return { ...prev, items: updatedItems };
      });
    };

    const handleCustomerSelect = (customerId: string) => {
      const customer = customers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
      
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer?.name || '',
        customerEmail: customer?.email || ''
      }));
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
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
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
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
                  <div key={index} className="grid gap-3 grid-cols-12 items-end">
                    <div className="col-span-5">
                      <SearchableProductSelect
                        value={item.productId}
                        onChange={(productId) => updateItem(index, 'productId', productId)}
                        onPriceChange={(price) => updateItem(index, 'price', price)}
                        placeholder="Search products..."
                        required
                        customerId={formData.customerId}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Price"
                      />
                    </div>
                    <div className="col-span-3 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[100px]">
                        <CurrencyDisplay amount={item.total} />
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPaymentTypeManager(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </button>
                </div>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {paymentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
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

            {/* Installment Options */}
            {/* Removed installment options */}


            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">
                  <CurrencyDisplay amount={formData.items.reduce((sum, item) => sum + item.total, 0)} />
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-tour="add-sale-submit"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  sale ? 'Update Sale' : 'Create Sale'
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

  // Sale View Modal
  const SaleViewModal = ({ sale, onClose }: { sale: Sale; onClose: () => void }) => {
    // Find the payment type name
    const paymentTypeName = paymentTypes.find(pt => pt.id === sale.paymentType)?.name || sale.paymentType;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sale Details - {sale.invoiceNumber}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleShowDigitalReceipt(sale)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"
                  title="View Digital Receipt"
                  aria-label="View digital receipt"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1"
                  title="Download PDF"
                  aria-label="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close sale details"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          {/* Wrap only the invoice content in this ref */}
          <div ref={invoicePrintRef} className="p-6 space-y-6">
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
                        <CurrencyDisplay amount={item.price} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={item.total} />
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
                    <span className="text-gray-900 dark:text-white">
                      <CurrencyDisplay amount={sale.total} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Payment Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method:</span>
                  <p className="text-gray-900 dark:text-white capitalize">{paymentTypeName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <p className="text-gray-900 dark:text-white capitalize">{getCalculatedStatus(sale)}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-between p-6 pt-0">
            <button
              onClick={() => {
                onClose();
                setShowReturnForm(true);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Process Return
            </button>
            <button
              onClick={() => handleShowDigitalReceipt(sale)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FileText className="h-4 w-4 mr-1" />
              View Receipt
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your sales and transactions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCodeScanner(true)}
            className="flex items-center space-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Tag className="h-5 w-5" />
            <span>Enter Code</span>
          </button>
          <button
            onClick={() => setShowReturnForm(true)}
            className="flex items-center space-x-2 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Return/Refund</span>
          </button>
          <button
            onClick={() => setShowPOSInterface(true)}
            data-tour="pos-interface"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Monitor className="h-5 w-5" />
            <span>New Sale</span>
          </button>
        </div>
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
                // Find the payment type name
                const paymentTypeName = paymentTypes.find(pt => pt.id === sale.paymentType)?.name || sale.paymentType;
                
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
                      <CurrencyDisplay amount={sale.total} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                      {paymentTypeName}
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
                          className={`relative transition-colors ${
                            deleteConfirm === sale.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirm === sale.id ? `Click again to confirm (${deleteCountdown}s)` : 'Delete sale'}
                          aria-label={deleteConfirm === sale.id ? `Confirm delete sale (${deleteCountdown}s)` : 'Delete sale'}
                        >
                          {deleteConfirm === sale.id ? (
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
      {viewingSale && (
        <SaleViewModal 
          sale={viewingSale} 
          onClose={() => setViewingSale(null)} 
        />
      )}
      {showCodeScanner && (
        <BarcodeScanner 
          onScan={handleCodeScanned} 
          onClose={() => setShowCodeScanner(false)} 
        />
      )}
      {showDigitalReceipt && viewingSale && (
        <DigitalReceipt 
          sale={viewingSale} 
          onClose={() => setShowDigitalReceipt(false)}
          onSendEmail={handleSendReceiptEmail}
        />
      )}
      {showReturnForm && (
        <ReturnRefundForm 
          onClose={() => setShowReturnForm(false)}
          onComplete={handleReturnComplete}
        />
      )}
      {showPaymentTypeManager && (
        <PaymentTypeManager
          onClose={() => setShowPaymentTypeManager(false)}
        />
      )}
      {showPOSInterface && (
        <POSInterface
          onClose={() => setShowPOSInterface(false)}
          onSaleComplete={(sale) => {
            setShowPOSInterface(false);
            // Optional: Show the completed sale
            setViewingSale(sale);
          }}
        />
      )}
    </div>
  );
}