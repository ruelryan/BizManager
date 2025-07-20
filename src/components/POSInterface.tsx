import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, Search, ShoppingCart, CreditCard, DollarSign, User, Tag, Calculator, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Product, Sale, SaleItem } from '../types';
import { CurrencyDisplay } from './CurrencyDisplay';
import { BarcodeScanner } from './BarcodeScanner';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

interface POSInterfaceProps {
  onClose: () => void;
  onSaleComplete?: (sale: Sale) => void;
}

export function POSInterface({ onClose, onSaleComplete }: POSInterfaceProps) {
  const { products, customers, addSale, paymentTypes } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentTypes[0]?.id || 'cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.currentStock > 0;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal; // Add tax calculations if needed

  // Add product to cart
  const addToCart = (product: Product) => {
    const specialPrice = selectedCustomer?.specialPricing?.[product.id];
    const price = specialPrice || product.price;
    
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        price,
        quantity: 1,
        total: price
      };
      setCart([...cart, newItem]);
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Handle barcode scan
  const handleBarcodeScan = (code: string) => {
    setShowScanner(false);
    const product = products.find(p => p.barcode === code);
    if (product && product.currentStock > 0) {
      addToCart(product);
    } else {
      alert('Product not found or out of stock');
    }
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    
    try {
      const saleItems: SaleItem[] = cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      const saleData = {
        customerId: selectedCustomer?.id || '',
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerEmail: selectedCustomer?.email || undefined,
        items: saleItems,
        total: total,
        paymentType: paymentMethod,
        status: 'paid' as const,
        date: new Date()
      };

      const sale = await addSale(saleData);
      
      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setAmountReceived('');
      setShowPayment(false);
      
      if (onSaleComplete && sale) {
        onSaleComplete(sale);
      }
      
      // Show success message
      alert('Sale completed successfully!');
      
    } catch (error: any) {
      console.error('Failed to process sale:', error);
      alert('Failed to process sale: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment interface
  const PaymentInterface = () => {
    const change = parseFloat(amountReceived) - total;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Process Payment</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <CurrencyDisplay amount={total} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {paymentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount Received</label>
              <input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
              {change > 0 && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Change: <CurrencyDisplay amount={change} />
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processPayment}
                disabled={isProcessing || !amountReceived || parseFloat(amountReceived) < total}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Complete Sale'}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 flex">
      {/* Main POS Interface */}
      <div className="flex-1 flex">
        {/* Product Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Tag className="h-4 w-4" />
                  <span>Scan</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => {
                const specialPrice = selectedCustomer?.specialPricing?.[product.id];
                const displayPrice = specialPrice || product.price;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all hover:scale-105 text-left"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Stock: {product.currentStock}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {specialPrice ? (
                          <div className="text-sm">
                            <span className="line-through text-gray-400">
                              <CurrencyDisplay amount={product.price} />
                            </span>
                            <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                              <CurrencyDisplay amount={specialPrice} />
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            <CurrencyDisplay amount={product.price} />
                          </span>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({cart.length})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {selectedCustomer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerSearch(true)}
                className="w-full flex items-center justify-center space-x-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Add Customer</span>
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                      {item.productName}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-medium text-gray-900 dark:text-white w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <CurrencyDisplay amount={item.price} /> each
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        <CurrencyDisplay amount={item.total} />
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Total & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    <CurrencyDisplay amount={total} />
                  </span>
                </div>
                
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Process Payment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPayment && <PaymentInterface />}
      
      {showCustomerSearch && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Customer</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerSearch(false);
                  }}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCustomerSearch(false)}
              className="mt-4 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}