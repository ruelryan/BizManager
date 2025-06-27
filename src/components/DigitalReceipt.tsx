import React from 'react';
import { format } from 'date-fns';
import { Download, Mail, Share, Printer } from 'lucide-react';
import { Sale } from '../types';
import { useStore } from '../store/useStore';
import QRCode from 'react-qr-code';

interface DigitalReceiptProps {
  sale: Sale;
  onClose: () => void;
  onSendEmail?: () => void;
}

export function DigitalReceipt({ sale, onClose, onSendEmail }: DigitalReceiptProps) {
  const { userSettings } = useStore();
  
  const businessName = userSettings?.businessName || 'BizManager Store';
  const businessAddress = userSettings?.businessAddress || 'Business Address';
  const businessPhone = userSettings?.businessPhone || '';
  const businessEmail = userSettings?.businessEmail || '';
  
  const currency = userSettings?.currency || 'PHP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '₱';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    alert('Receipt downloaded');
  };

  const handleShare = () => {
    // In a real implementation, this would use the Web Share API
    if (navigator.share) {
      navigator.share({
        title: `Receipt #${sale.invoiceNumber}`,
        text: `Your receipt from ${businessName}`,
        url: window.location.href,
      });
    } else {
      alert('Sharing is not supported on this browser');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Digital Receipt</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Receipt Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{businessName}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{businessAddress}</p>
            {businessPhone && <p className="text-gray-600 dark:text-gray-400 text-sm">{businessPhone}</p>}
            {businessEmail && <p className="text-gray-600 dark:text-gray-400 text-sm">{businessEmail}</p>}
          </div>
          
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Receipt #:</span>
              <span className="text-gray-900 dark:text-white font-medium">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="text-gray-900 dark:text-white">{format(sale.date, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="text-gray-900 dark:text-white">{format(sale.date, 'hh:mm a')}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items</h4>
            <table className="w-full text-sm">
              <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 text-gray-900 dark:text-white">{item.productName}</td>
                    <td className="py-2 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{currencySymbol}{item.price.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{currencySymbol}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="text-gray-900 dark:text-white">{currencySymbol}{sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="text-gray-900 dark:text-white">{currencySymbol}0.00</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">{currencySymbol}{sale.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
              <span className="text-gray-900 dark:text-white capitalize">{sale.paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="text-gray-900 dark:text-white">{sale.customerName || 'Walk-in Customer'}</span>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <div className="mx-auto w-32 h-32 mb-2">
              <QRCode
                value={`RECEIPT:${sale.invoiceNumber}|DATE:${format(sale.date, 'yyyy-MM-dd')}|TOTAL:${sale.total}`}
                size={128}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
                bgColor={`#ffffff`}
                fgColor={`#000000`}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scan to verify receipt
            </p>
          </div>
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Thank you for your business!</p>
            <p>This is a digital receipt. No signature required.</p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 flex justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            <Printer className="h-4 w-4 mr-1" />
            <span className="text-sm">Print</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="text-sm">Download</span>
          </button>
          
          <button
            onClick={onSendEmail}
            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            <Mail className="h-4 w-4 mr-1" />
            <span className="text-sm">Email</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            <Share className="h-4 w-4 mr-1" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}