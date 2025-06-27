import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useStore } from '../store/useStore';

interface CustomerPricingProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSave: () => void;
}

interface SpecialPrice {
  productId: string;
  productName: string;
  regularPrice: number;
  specialPrice: number;
}

export function CustomerPricing({ customerId, customerName, onClose, onSave }: CustomerPricingProps) {
  const { products, updateCustomerSpecialPricing, getCustomerSpecialPricing } = useStore();
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing special prices for this customer
    const loadSpecialPrices = async () => {
      try {
        const existingPrices = await getCustomerSpecialPricing(customerId);
        setSpecialPrices(existingPrices);
        
        // Filter out products that already have special pricing
        const productIds = existingPrices.map(p => p.productId);
        setAvailableProducts(products.filter(p => !productIds.includes(p.id)));
      } catch (error) {
        console.error('Failed to load special prices:', error);
      }
    };
    
    loadSpecialPrices();
  }, [customerId, getCustomerSpecialPricing, products]);

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const newSpecialPrice: SpecialPrice = {
      productId: product.id,
      productName: product.name,
      regularPrice: product.price,
      specialPrice: product.price * 0.9 // Default to 10% discount
    };
    
    setSpecialPrices([...specialPrices, newSpecialPrice]);
    setAvailableProducts(availableProducts.filter(p => p.id !== selectedProductId));
    setSelectedProductId('');
  };

  const handleRemoveProduct = (productId: string) => {
    const removedProduct = products.find(p => p.id === productId);
    if (removedProduct) {
      setAvailableProducts([...availableProducts, removedProduct]);
    }
    
    setSpecialPrices(specialPrices.filter(p => p.productId !== productId));
  };

  const handlePriceChange = (productId: string, price: number) => {
    setSpecialPrices(specialPrices.map(p => 
      p.productId === productId ? { ...p, specialPrice: price } : p
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCustomerSpecialPricing(customerId, specialPrices);
      onSave();
    } catch (error) {
      console.error('Failed to save special prices:', error);
      alert('Failed to save special prices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Special Pricing for {customerName}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Set special pricing for this customer. These prices will be applied automatically when creating sales for this customer.
          </p>
          
          {/* Add Product Form */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Special Pricing</h4>
            <div className="flex space-x-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a product</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (₱{product.price.toFixed(2)})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddProduct}
                disabled={!selectedProductId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>
          
          {/* Special Prices List */}
          {specialPrices.length > 0 ? (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Special Prices</h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Regular Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Special Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {specialPrices.map((price) => {
                      const discountPercent = ((price.regularPrice - price.specialPrice) / price.regularPrice) * 100;
                      
                      return (
                        <tr key={price.productId}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {price.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₱{price.regularPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={price.specialPrice}
                              onChange={(e) => handlePriceChange(price.productId, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`${
                              discountPercent > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : discountPercent < 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {discountPercent > 0 ? '-' : discountPercent < 0 ? '+' : ''}
                              {Math.abs(discountPercent).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            <button
                              onClick={() => handleRemoveProduct(price.productId)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No special prices set for this customer</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Add products above to set special pricing
              </p>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Special Prices
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}