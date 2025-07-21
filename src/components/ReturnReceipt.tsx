import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Return, Sale } from '../types';
import { useStore } from '../store/useStore';
import { CurrencyDisplay } from './CurrencyDisplay';
import { AlertTriangle } from 'lucide-react';

interface ReturnReceiptProps {
  returnData: Return;
  originalSale?: Sale;
  businessInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export const ReturnReceipt = forwardRef<HTMLDivElement, ReturnReceiptProps>(
  ({ returnData, originalSale, businessInfo }, ref) => {
    const { user } = useStore();

    const defaultBusinessInfo = {
      name: user?.businessName || 'Your Business Name',
      address: user?.businessAddress || '',
      phone: user?.businessPhone || '',
      email: user?.businessEmail || user?.email || ''
    };

    const business = { ...defaultBusinessInfo, ...businessInfo };

    const getRefundMethodLabel = (method: string) => {
      switch (method) {
        case 'original': return 'Original Payment Method';
        case 'store_credit': return 'Store Credit';
        case 'cash': return 'Cash';
        default: return method;
      }
    };

    const defectiveItems = returnData.items.filter(item => item.isDefective);

    return (
      <div ref={ref} className="bg-white p-8 max-w-2xl mx-auto text-black">
        {/* Header */}
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold mb-2">{business.name}</h1>
          {business.address && (
            <p className="text-sm text-gray-600">{business.address}</p>
          )}
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            {business.phone && <span>Tel: {business.phone}</span>}
            {business.email && <span>Email: {business.email}</span>}
          </div>
        </div>

        {/* Return Information */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-red-600">RETURN RECEIPT</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Return ID:</strong> {returnData.id}
            </div>
            <div>
              <strong>Return Date:</strong> {format(returnData.date, 'MMM dd, yyyy HH:mm')}
            </div>
            <div>
              <strong>Original Sale:</strong> {returnData.originalSaleId}
            </div>
            <div>
              <strong>Customer:</strong> {originalSale?.customerName || 'Walk-in Customer'}
            </div>
            <div>
              <strong>Refund Method:</strong> {getRefundMethodLabel(returnData.refundMethod)}
            </div>
            <div>
              <strong>Status:</strong> <span className="uppercase">{returnData.status}</span>
            </div>
          </div>
        </div>

        {/* Returned Items */}
        <div className="mb-6">
          <h3 className="font-bold mb-3 text-lg border-b pb-2">Returned Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {returnData.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-gray-600">Reason: {item.reason}</div>
                    </div>
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">
                    <CurrencyDisplay amount={item.price} />
                  </td>
                  <td className="text-right py-2 font-medium">
                    <CurrencyDisplay amount={item.total} />
                  </td>
                  <td className="text-center py-2">
                    {item.isDefective ? (
                      <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Defective
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Good Condition
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-6 bg-gray-50 p-4 rounded">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Refund Amount:</span>
            <span className="text-xl font-bold">
              <CurrencyDisplay amount={returnData.total} />
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mt-2">
            Items returned: {returnData.items.reduce((sum, item) => sum + item.quantity, 0)} units
          </div>
        </div>

        {/* Defective Items Notice */}
        {defectiveItems.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Defective Items Notice</h4>
                <p className="text-sm text-red-700 mt-1">
                  {defectiveItems.length} item(s) were returned as defective and have been set aside for inspection. 
                  These items are not available for resale.
                </p>
                <div className="mt-2">
                  {defectiveItems.map((item, index) => (
                    <div key={index} className="text-xs text-red-600">
                      • {item.quantity}x {item.productName} - {item.reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Policy */}
        <div className="mb-6 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Return Policy:</h4>
          <ul className="space-y-1">
            <li>• This return receipt serves as proof of your refund transaction</li>
            <li>• Refunds will be processed within 3-5 business days for original payment methods</li>
            <li>• Store credit is available immediately for future purchases</li>
            <li>• Items returned as defective are subject to manufacturer warranty terms</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            Questions about this return? Contact us at {business.email || business.phone}
          </p>
          <p className="mt-2 text-xs">
            Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      </div>
    );
  }
);

ReturnReceipt.displayName = 'ReturnReceipt';