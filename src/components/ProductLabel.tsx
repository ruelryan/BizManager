import React from 'react';

interface ProductLabelProps {
  productName: string;
  productCode?: string;
  category?: string;
  price?: number;
  description?: string;
  brandName?: string;
  onPrint?: () => void;
}

export const ProductLabel: React.FC<ProductLabelProps> = ({
  productName,
  productCode = '',
  category = '',
  price,
  description = '',
  brandName = 'BizManager',
  onPrint
}) => {
  return (
    <div className="max-w-md mx-auto">
      {/* Print button */}
      <div className="mb-4 flex justify-end">
        <button 
          onClick={onPrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Print Label
        </button>
      </div>
      
      {/* Label preview */}
      <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white text-black p-1">
        <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
          {/* Brand header */}
          <div className="text-center mb-3 pb-2 border-b border-gray-200">
            <div className="text-sm text-gray-500">{brandName}</div>
          </div>
          
          {/* Product name */}
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold">{productName}</h2>
            {category && <div className="text-sm text-gray-600">{category}</div>}
          </div>
          
          {/* Product code section */}
          <div className="bg-gray-100 p-3 rounded-md text-center mb-3">
            <div className="text-xs text-gray-500 mb-1">Product Code</div>
            <div className="text-lg font-mono font-bold tracking-wider">{productCode || 'SKU00000'}</div>
          </div>
          
          {/* Description */}
          {description && (
            <div className="text-sm text-center mb-3 px-2">
              {description}
            </div>
          )}
          
          {/* Price */}
          {price !== undefined && (
            <div className="text-center mt-auto">
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-xl font-bold">₱{price.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};