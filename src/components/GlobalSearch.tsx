import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'customer' | 'sale' | 'action';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  subtitle?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { products, customers, sales } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick actions that are always available
  const quickActions: SearchResult[] = [
    {
      id: 'new-sale',
      title: 'New Sale',
      type: 'action',
      icon: ShoppingCart,
      action: () => navigate('/sales?action=new'),
      subtitle: 'Create a new sale'
    },
    {
      id: 'new-product',
      title: 'Add Product',
      type: 'action',
      icon: Package,
      action: () => navigate('/products?action=new'),
      subtitle: 'Add a new product'
    },
    {
      id: 'new-customer',
      title: 'Add Customer',
      type: 'action',
      icon: Users,
      action: () => navigate('/customers?action=new'),
      subtitle: 'Add a new customer'
    },
    {
      id: 'reports',
      title: 'View Reports',
      type: 'action',
      icon: TrendingUp,
      action: () => navigate('/reports'),
      subtitle: 'Business analytics'
    }
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults(quickActions);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowercaseQuery = query.toLowerCase();

    // Search products
    products
      .filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery) ||
        product.barcode?.toLowerCase().includes(lowercaseQuery)
      )
      .slice(0, 3)
      .forEach(product => {
        searchResults.push({
          id: product.id,
          title: product.name,
          type: 'product',
          icon: Package,
          action: () => navigate(`/products?highlight=${product.id}`),
          subtitle: `${product.category} - Stock: ${product.currentStock}`
        });
      });

    // Search customers
    customers
      .filter(customer => 
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        customer.email?.toLowerCase().includes(lowercaseQuery) ||
        customer.phone?.toLowerCase().includes(lowercaseQuery)
      )
      .slice(0, 3)
      .forEach(customer => {
        searchResults.push({
          id: customer.id,
          title: customer.name,
          type: 'customer',
          icon: Users,
          action: () => navigate(`/customers?highlight=${customer.id}`),
          subtitle: customer.email || customer.phone || 'Customer'
        });
      });

    // Search sales
    sales
      .filter(sale => 
        sale.customerName?.toLowerCase().includes(lowercaseQuery) ||
        sale.invoiceNumber?.toLowerCase().includes(lowercaseQuery) ||
        sale.items.some(item => item.productName.toLowerCase().includes(lowercaseQuery))
      )
      .slice(0, 3)
      .forEach(sale => {
        searchResults.push({
          id: sale.id,
          title: `Sale #${sale.invoiceNumber || sale.id.slice(-6)}`,
          type: 'sale',
          icon: ShoppingCart,
          action: () => navigate(`/sales?highlight=${sale.id}`),
          subtitle: `${sale.customerName || 'Anonymous'} - $${sale.total.toFixed(2)}`
        });
      });

    // Add quick actions if they match
    quickActions
      .filter(action => 
        action.title.toLowerCase().includes(lowercaseQuery) ||
        action.subtitle?.toLowerCase().includes(lowercaseQuery)
      )
      .forEach(action => {
        searchResults.push(action);
      });

    setResults(searchResults.slice(0, 8));
    setSelectedIndex(0);
  }, [query, products, customers, sales, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    result.action();
    setIsOpen(false);
    setQuery('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'text-green-600 dark:text-green-400';
      case 'customer': return 'text-blue-600 dark:text-blue-400';
      case 'sale': return 'text-purple-600 dark:text-purple-400';
      case 'action': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-mono text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-start justify-center p-4 pt-16">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, customers, sales..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="w-full bg-transparent px-4 py-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Results */}
              <div ref={dropdownRef} className="max-h-96 overflow-y-auto p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <result.icon className={`h-5 w-5 ${getTypeColor(result.type)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                          {result.type}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
                    <span>to select</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}