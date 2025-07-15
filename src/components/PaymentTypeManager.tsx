import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface PaymentTypeManagerProps {
  onClose: () => void;
}

export function PaymentTypeManager({ onClose }: PaymentTypeManagerProps) {
  const { paymentTypes, addPaymentType, updatePaymentType, deletePaymentType } = useStore();
  const [newPaymentType, setNewPaymentType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Reset delete confirmation when payment types change
  useEffect(() => {
    setDeleteConfirm(null);
  }, [paymentTypes]);

  const handleAddPaymentType = async () => {
    if (!newPaymentType.trim()) {
      setError('Payment type name cannot be empty');
      return;
    }

    // Check for duplicates
    if (paymentTypes.some(pt => pt.name.toLowerCase() === newPaymentType.toLowerCase())) {
      setError('This payment type already exists');
      return;
    }

    try {
      await addPaymentType(newPaymentType);
      setNewPaymentType('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add payment type');
    }
  };

  const handleUpdatePaymentType = async (id: string) => {
    if (!editingName.trim()) {
      setError('Payment type name cannot be empty');
      return;
    }

    // Check for duplicates (excluding the current one being edited)
    if (paymentTypes.some(pt => pt.id !== id && pt.name.toLowerCase() === editingName.toLowerCase())) {
      setError('This payment type already exists');
      return;
    }

    try {
      await updatePaymentType(id, editingName);
      setEditingId(null);
      setEditingName('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update payment type');
    }
  };

  const handleDeletePaymentType = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await deletePaymentType(id);
        setDeleteConfirm(null);
      } catch (err: any) {
        setError(err.message || 'Failed to delete payment type');
      }
    } else {
      setDeleteConfirm(id);
    }
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  // Default payment types that cannot be modified
  const isDefaultType = (id: string) => ['cash', 'card', 'transfer', 'gcash'].includes(id);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Payment Types
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
            Customize the payment types available in your sales transactions.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Add new payment type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add New Payment Type
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPaymentType}
                onChange={(e) => setNewPaymentType(e.target.value)}
                placeholder="e.g., Venmo, Alipay, etc."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddPaymentType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>
          
          {/* Payment types list */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Types</h4>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paymentTypes.map((type) => (
                      <tr key={type.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingId === type.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {type.name}
                              </span>
                              {isDefaultType(type.id) && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Default
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {isDefaultType(type.id) ? (
                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">Cannot modify</span>
                          ) : editingId === type.id ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleUpdatePaymentType(type.id)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => startEditing(type.id, type.name)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePaymentType(type.id)}
                                className={`${
                                  deleteConfirm === type.id
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                              >
                                {deleteConfirm === type.id ? (
                                  <div className="flex items-center">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    <span>Confirm</span>
                                  </div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}