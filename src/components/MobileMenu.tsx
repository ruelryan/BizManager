import React from 'react';
import { Link } from 'react-router-dom';
import { X, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { theme, toggleTheme } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 backdrop-blur-sm md:hidden">
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-gray-900 shadow-xl flex flex-col transition-transform duration-300 ease-in-out transform">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-4">
            <li>
              <Link
                to="/about"
                className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={onClose}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                to="/features"
                className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={onClose}
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={onClose}
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                to="/demo"
                className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={onClose}
              >
                Demo
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={onClose}
              >
                Contact
              </Link>
            </li>
          </ul>
          
          <div className="border-t border-gray-200 dark:border-gray-800 my-4 pt-4">
            <Link
              to="/login"
              className="block py-2 px-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={onClose}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="block py-2 px-4 mt-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
              onClick={onClose}
            >
              Sign Up Free
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              toggleTheme();
              // Don't close the menu when toggling theme
            }}
            className="flex items-center justify-center w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-5 w-5 mr-2" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-5 w-5 mr-2" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}