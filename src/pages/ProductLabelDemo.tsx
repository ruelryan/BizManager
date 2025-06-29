import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ProductLabel } from '../components/ProductLabel';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function ProductLabelDemo() {
  const { products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customProductCode, setCustomProductCode] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [customDescription, setCustomDescription] = useState('');
  const [customBrandName, setCustomBrandName] = useState('BizManager');
  
  const labelRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
    documentTitle: 'Product Label',
    removeAfterPrint: true,
  });
  
  // When a product is selected, fill in the form with its details
  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setCustomProductName(product.name);
        setCustomProductCode(product.barcode || '');
        setCustomCategory(product.category);
        setCustomPrice(product.price);
        setCustomDescription('');
      }
    } else {
      // Clear form if "Custom" is selected
      setCustomProductName('');
      setCustomProductCode('');
      setCustomCategory('');
      setCustomPrice(undefined);
      setCustomDescription('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header with back button */}
        <div className="mb-8">
          <Link to="/products" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Label Generator</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and print professional product labels with SKU/product codes</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Label Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Custom Label</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Code / SKU
                </label>
                <input
                  type="text"
                  value={customProductCode}
                  onChange={(e) => setCustomProductCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter product code or SKU"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter category"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={customPrice === undefined ? '' : customPrice}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter price"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter short product description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={customBrandName}
                  onChange={(e) => setCustomBrandName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>
          
          {/* Label Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Label Preview</h2>
            
            <div ref={labelRef}>
              <ProductLabel
                productName={customProductName}
                productCode={customProductCode}
                category={customCategory}
                price={customPrice}
                description={customDescription}
                brandName={customBrandName}
                onPrint={handlePrint}
              />
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Printing Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click the "Print Label" button to open your browser's print dialog</li>
            <li>For best results, use label paper (Avery 5160 or similar)</li>
            <li>In print settings, set margins to "None" or "Minimum"</li>
            <li>Disable headers and footers in your browser's print settings</li>
            <li>For multiple labels, adjust the number of copies in print settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}