import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Download, Mail, Share, Printer, Tag, Check } from 'lucide-react';
import { Sale } from '../types';
import { useStore } from '../store/useStore';
import QRCode from 'react-qr-code';
import { useReactToPrint } from 'react-to-print';

interface DigitalReceiptProps {
  sale: Sale;
  onClose: () => void;
  onSendEmail?: () => void;
}

export function DigitalReceipt({ sale, onClose, onSendEmail }: DigitalReceiptProps) {
  const { userSettings } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const businessName = userSettings?.businessName || 'BizManager Store';
  const businessAddress = userSettings?.businessAddress || 'Business Address';
  const businessPhone = userSettings?.businessPhone || '';
  const businessEmail = userSettings?.businessEmail || '';
  
  const currency = userSettings?.currency || 'PHP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '₱';

  // Generate a QR code value that encodes receipt information
  const qrCodeValue = `REC:${sale.invoiceNumber}|DATE:${format(sale.date, 'yyyyMMdd')}|AMT:${sale.total.toFixed(2)}`;

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${sale.invoiceNumber}`,
    removeAfterPrint: true,
  });

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    handlePrint();
  };

  const handleShare = () => {
    // In a real implementation, this would use the Web Share API
    if (navigator.share) {
      navigator.share({
        title: `Receipt #${sale.invoiceNumber}`,
        text: `Your receipt from ${businessName}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
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
        
        {/* Receipt Content - This will be printed */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div ref={receiptRef} className="bg-white text-black p-4 rounded-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{businessName}</h2>
              <p className="text-gray-600 text-sm">{businessAddress}</p>
              {businessPhone && <p className="text-gray-600 text-sm">{businessPhone}</p>}
              {businessEmail && <p className="text-gray-600 text-sm">{businessEmail}</p>}
            </div>
            
            {/* Receipt Title */}
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-1 bg-gray-100 rounded-full text-gray-800 font-medium text-sm mb-2">
                RECEIPT
              </div>
            </div>
            
            {/* Receipt Info */}
            <div className="border-t border-b border-gray-200 py-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 font-medium">Receipt #:</span>
                <span className="text-gray-900 font-medium">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">{format(sale.date, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="text-gray-900">{format(sale.date, 'hh:mm a')}</span>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Customer:</span>
                <span className="text-gray-900">{sale.customerName || 'Walk-in Customer'}</span>
              </div>
              {sale.customerEmail && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-gray-900">{sale.customerEmail}</span>
                </div>
              )}
            </div>
            
            {/* Items */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2 pb-2 border-b border-gray-200">Items</h4>
              <table className="w-full text-sm">
                <thead className="text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 text-gray-900">{item.productName}</td>
                      <td className="py-2 text-center text-gray-900">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-900">{currencySymbol}{item.price.toFixed(2)}</td>
                      <td className="py-2 text-right text-gray-900 font-medium">{currencySymbol}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{currencySymbol}{sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-900">{currencySymbol}0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{currencySymbol}{sale.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Info */}
            <div className="mb-6 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 font-medium">Payment Method:</span>
                <span className="text-gray-900 capitalize">{sale.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  PAID
                </span>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="text-center mb-4">
              <div className="mx-auto w-32 h-32 mb-2 p-1 border border-gray-200 rounded-lg">
                <QRCode
                  value={qrCodeValue}
                  size={128}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  bgColor={`#ffffff`}
                  fgColor={`#000000`}
                />
              </div>
              <p className="text-xs text-gray-500">
                Scan to verify receipt
              </p>
            </div>
            
            {/* Receipt ID */}
            <div className="text-center mb-4">
              <div className="flex flex-col items-center">
                <Tag className="h-5 w-5 text-gray-900 mb-1" />
                <div className="font-mono text-sm text-gray-900">
                  {sale.invoiceNumber}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
              <p>Thank you for your business!</p>
              <p className="text-xs mt-1">This is a digital receipt. No signature required.</p>
              <p className="text-xs mt-3">{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
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