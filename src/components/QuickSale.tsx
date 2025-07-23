import React, { useState } from 'react';
import { X, Search, ShoppingCart, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Product, SaleItem } from '../types';
import { CurrencyDisplay } from './CurrencyDisplay';

interface QuickSaleProps {
  onClose: () => void;
}

export function QuickSale({ onClose }: QuickSaleProps) {
  const { products, customers, addSale, paymentTypes } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total
  const total = selectedItems.reduce((sum, item) => sum + item.total, 0);

  // Add product to sale
  const addProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    if (currentQtyInCart >= product.currentStock) {
      // Optionally show an alert or feedback
      alert(`Cannot add more. Only ${product.currentStock} in stock.`);
      return;
    }
    if (existingItem) {
      // Increase quantity
      setSelectedItems(items =>
        items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.currentStock) {
      alert(`Cannot add more. Only ${product.currentStock} in stock.`);
      return;
    }
    if (newQuantity === 0) {
      setSelectedItems(items => items.filter(item => item.productId !== productId));
    } else {
      setSelectedItems(items =>
        items.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
            : item
        )
      );
    }
  };

  // Process the sale
  const processSale = async () => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    
    try {
      const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
      
      await addSale({
        customerId: selectedCustomer || 'walk-in',
        customerName: selectedCustomerData?.name || null,
        customerEmail: selectedCustomerData?.email,
        items: selectedItems,
        total,
        paymentType: paymentMethod,
        status: 'paid',
        date: new Date(),
      });

      // Reset form
      setSelectedItems([]);
      setSelectedCustomer('');
      setPaymentMethod('cash');
      setSearchTerm('');
      
      onClose();
    } catch (error) {
      console.error('Failed to process sale:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Quick Sale
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Products */}
          <div className="flex-1 p-6 border-r border-gray-200 dark:border-gray-700">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 h-full overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  disabled={product.currentStock === 0}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    product.currentStock === 0
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {product.category}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      <CurrencyDisplay amount={product.price} />
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      product.currentStock > product.minStock
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : product.currentStock > 0
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {product.currentStock === 0 ? 'Out of Stock' : `${product.currentStock} left`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="w-80 p-6 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cart ({selectedItems.length})
            </h3>

            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.productName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <CurrencyDisplay amount={item.price} /> each
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={products.find(p => p.id === item.productId)?.currentStock || 1}
                      value={item.quantity}
                      onChange={e => {
                        const product = products.find(p => p.id === item.productId);
                        let val = parseInt(e.target.value) || 1;
                        if (product && val > product.currentStock) {
                          alert(`Cannot add more. Only ${product.currentStock} in stock.`);
                          val = product.currentStock;
                        }
                        updateQuantity(item.productId, val);
                      }}
                      className="w-14 text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer (Optional)
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPaymentMethod(type.name)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      paymentMethod === type.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {type.name.toLowerCase().includes('cash') && <Banknote className="h-4 w-4" />}
                      {type.name.toLowerCase().includes('card') && <CreditCard className="h-4 w-4" />}
                      {type.name.toLowerCase().includes('digital') && <QrCode className="h-4 w-4" />}
                    </div>
                    <div className="text-sm font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-xl font-bold text-gray-900 dark:text-white">
                <span>Total:</span>
                <CurrencyDisplay amount={total} />
              </div>
            </div>

            {/* Process Sale Button */}
            <button
              onClick={processSale}
              disabled={selectedItems.length === 0 || isProcessing}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedItems.length === 0 || isProcessing
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}