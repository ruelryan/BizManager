import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enter Product Code</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                Enter the product code manually
              </p>
              
              {/* Manual entry form */}
              <form onSubmit={handleManualEntry} className="flex space-x-2">
                <input
                  type="text"
                  name="manualCode"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter product code"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enter
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}