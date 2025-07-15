import React, { useState } from 'react';
import { X, Search, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Sale, SaleItem } from '../types';
import { useStore } from '../store/useStore';
import { BarcodeScanner } from './BarcodeScanner';

interface ReturnRefundFormProps {
  onClose: () => void;
  onComplete: (returnData: any) => void;
}

export function ReturnRefundForm({ onClose, onComplete }: ReturnRefundFormProps) {
  const { sales, products } = useStore();
  const [step, setStep] = useState<'search' | 'select' | 'items' | 'confirm'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<{
    item: SaleItem;
    quantity: number;
    reason: string;
    isDefective: boolean;
  }[]>([]);
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [refundMethod, setRefundMethod] = useState<'original' | 'store_credit' | 'cash'>('original');
  const [showCodeScanner, setShowCodeScanner] = useState(false);

  // Filter sales based on search term
  const filteredSales = sales.filter(sale => 
    sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    // Also search by product code
    sale.items.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.barcode && product.barcode.includes(searchTerm);
    })
  ).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first

  const handleSaleSelect = (sale: Sale) => {
    setSelectedSale(sale);
    setStep('items');
    // Initialize return items with zero quantities
    setReturnItems(sale.items.map(item => ({
      item,
      quantity: 0,
      reason: '',
      isDefective: false
    })));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newReturnItems = [...returnItems];
    // Ensure quantity doesn't exceed original purchase quantity
    const maxQuantity = newReturnItems[index].item.quantity;
    newReturnItems[index].quantity = Math.min(Math.max(0, quantity), maxQuantity);
    setReturnItems(newReturnItems);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const newReturnItems = [...returnItems];
    newReturnItems[index].reason = reason;
    setReturnItems(newReturnItems);
  };

  const handleDefectiveChange = (index: number, isDefective: boolean) => {
    const newReturnItems = [...returnItems];
    newReturnItems[index].isDefective = isDefective;
    setReturnItems(newReturnItems);
  };

  const handleContinue = () => {
    // Filter out items with quantity 0
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }
    
    // Check if all items have a reason
    const missingReason = itemsToReturn.some(item => !item.reason);
    if (missingReason) {
      alert('Please provide a reason for all returned items');
      return;
    }
    
    setReturnItems(itemsToReturn);
    setStep('confirm');
  };

  const handleSubmit = () => {
    if (!selectedSale) return;
    
    // Calculate total refund amount
    const totalRefund = returnItems.reduce((sum, item) => 
      sum + (item.item.price * item.quantity), 0
    );
    
    const returnData = {
      originalSaleId: selectedSale.id,
      originalSale: selectedSale,
      returnItems: returnItems.map(item => ({
        productId: item.item.productId,
        productName: item.item.productName,
        quantity: item.quantity,
        price: item.item.price,
        total: item.item.price * item.quantity,
        reason: item.reason,
        isDefective: item.isDefective
      })),
      returnType,
      refundMethod,
      total: totalRefund,
      date: new Date(),
      status: 'completed',
      reason: returnItems.map(item => item.reason).join(', ')
    };
    
    onComplete(returnData);
  };

  const getTotalRefundAmount = () => {
    return returnItems.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  };

  const handleCodeScanned = (code: string) => {
    setShowCodeScanner(false);
    setSearchTerm(code);
    
    // Check if any sale has a product with this code
    const product = products.find(p => p.barcode === code);
    if (product) {
      const salesWithProduct = sales.filter(sale => 
        sale.items.some(item => item.productId === product.id)
      );
      
      if (salesWithProduct.length === 1) {
        // If only one sale contains this product, select it automatically
        handleSaleSelect(salesWithProduct[0]);
      } else if (salesWithProduct.length > 1) {
        // If multiple sales contain this product, show them in the search results
        // The filtered sales will already be updated due to the searchTerm update
      } else {
        alert('No sales found with this product code');
      }
    } else {
      alert('No product found with this code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'search' && 'Process Return or Refund'}
            {step === 'select' && 'Select Sale'}
            {step === 'items' && 'Select Items to Return'}
            {step === 'confirm' && 'Confirm Return'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'search' && (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter the receipt number, customer name, or product code to find the sale you want to process a return or refund for.
              </p>
              
              <div className="flex space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by receipt #, customer name, or product code"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setShowCodeScanner(true)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enter Code
                </button>
              </div>
              
              {searchTerm && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Search Results</h4>
                  {filteredSales.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSales.map((sale) => (
                        <button
                          key={sale.id}
                          onClick={() => handleSaleSelect(sale)}
                          className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">Receipt #{sale.invoiceNumber}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {new Date(sale.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {sale.customerName || 'Walk-in Customer'}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ₱{sale.total.toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No matching sales found</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          
          {step === 'items' && selectedSale && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep('search')}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back to Search</span>
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">Receipt #{selectedSale.invoiceNumber}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(selectedSale.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedSale.customerName || 'Walk-in Customer'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₱{selectedSale.total.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Items to Return</h4>
                <div className="space-y-4">
                  {returnItems.map((returnItem, index) => {
                    // Get product to check if it has a code
                    const product = products.find(p => p.id === returnItem.item.productId);
                    
                    return (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{returnItem.item.productName}</span>
                            {product?.barcode && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <span className="mr-1">Product Code:</span>
                                {product.barcode}
                              </div>
                            )}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            ₱{returnItem.item.price.toFixed(2)} × {returnItem.item.quantity}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Return Quantity
                            </label>
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(index, returnItem.quantity - 1)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={returnItem.item.quantity}
                                value={returnItem.quantity}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                className="w-16 text-center border-y border-gray-300 dark:border-gray-600 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <button
                                onClick={() => handleQuantityChange(index, returnItem.quantity + 1)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                +
                              </button>
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                of {returnItem.item.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Is Item Defective?
                            </label>
                            <div className="flex items-center space-x-4">
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  checked={returnItem.isDefective}
                                  onChange={() => handleDefectiveChange(index, true)}
                                  className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Yes</span>
                              </label>
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  checked={!returnItem.isDefective}
                                  onChange={() => handleDefectiveChange(index, false)}
                                  className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">No</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {returnItem.quantity > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Reason for Return
                            </label>
                            <select
                              value={returnItem.reason}
                              onChange={(e) => handleReasonChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select a reason</option>
                              <option value="defective">Defective Product</option>
                              <option value="wrong_item">Wrong Item</option>
                              <option value="not_as_described">Not as Described</option>
                              <option value="customer_changed_mind">Customer Changed Mind</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Return Type</h4>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={returnType === 'refund'}
                      onChange={() => setReturnType('refund')}
                      className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Refund</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={returnType === 'exchange'}
                      onChange={() => setReturnType('exchange')}
                      className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Exchange</span>
                  </label>
                </div>
              </div>
              
              {returnType === 'refund' && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Refund Method</h4>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={refundMethod === 'original'}
                        onChange={() => setRefundMethod('original')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Original Payment Method ({selectedSale.paymentType})</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={refundMethod === 'store_credit'}
                        onChange={() => setRefundMethod('store_credit')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Store Credit</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={refundMethod === 'cash'}
                        onChange={() => setRefundMethod('cash')}
                        className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Cash</span>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('search')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}
          
          {step === 'confirm' && selectedSale && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep('items')}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back to Items</span>
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Return Summary</h4>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Original Sale:</span>
                    <span className="float-right text-gray-900 dark:text-white">#{selectedSale.invoiceNumber}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Return Type:</span>
                    <span className="float-right text-gray-900 dark:text-white capitalize">{returnType}</span>
                  </div>
                  
                  {returnType === 'refund' && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Refund Method:</span>
                      <span className="float-right text-gray-900 dark:text-white capitalize">
                        {refundMethod === 'original' ? `Original (${selectedSale.paymentType})` : 
                         refundMethod === 'store_credit' ? 'Store Credit' : 'Cash'}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Items to Return:</span>
                    <span className="float-right text-gray-900 dark:text-white">
                      {returnItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Refund Amount:</span>
                    <span className="float-right text-gray-900 dark:text-white font-bold">
                      ₱{getTotalRefundAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Items Being Returned</h5>
                  <ul className="space-y-2">
                    {returnItems.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quantity} × {item.item.productName}
                          </span>
                          {item.isDefective && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded">
                              Defective
                            </span>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white">
                          ₱{(item.item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Warning for cash refunds */}
              {returnType === 'refund' && refundMethod === 'cash' && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium">Cash Refund Notice</p>
                    <p>Please ensure you have sufficient cash in your register to process this refund.</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('items')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Complete Return
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Code Scanner */}
      {showCodeScanner && (
        <BarcodeScanner
          onScan={handleCodeScanned}
          onClose={() => setShowCodeScanner(false)}
        />
      )}
    </div>
  );
}