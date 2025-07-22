import React, { useState } from 'react';
import { Plus, ShoppingCart, Package, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { POSInterface } from './POSInterface';
import { usePOS } from '../contexts/POSContext';
 
 export function FloatingActionButton() {
   const [isOpen, setIsOpen] = useState(false);
   const { isPOSActive, setPOSActive } = usePOS();
   const navigate = useNavigate();
 
   const actions = [
     {
       icon: ShoppingCart,
       label: 'Quick Sale',
       color: 'bg-blue-600 hover:bg-blue-700',
       action: () => setPOSActive(true),
     },
     {
      icon: Package,
      label: 'Add Product',
      color: 'bg-green-600 hover:bg-green-700',
      action: () => navigate('/products?action=new'),
    },
    {
      icon: Users,
      label: 'Add Customer',
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => navigate('/customers?action=new'),
    },
  ];

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40 lg:bottom-4">
        {/* Action Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-2 mb-2">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-end space-x-2 animate-[slideUp_0.2s_ease-out]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium opacity-90">
                  {action.label}
                </div>
                <button
                  onClick={() => handleActionClick(action.action)}
                  className={`${action.color} text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl`}
                >
                  <action.icon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      {/* POS Interface Modal */}
      {isPOSActive && (
        <POSInterface onClose={() => setPOSActive(false)} />
      )}

      {/* Animation Styles can be moved to a CSS file if needed */}
    </>
  );
}