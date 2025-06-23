import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  FileText, 
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Wifi,
  WifiOff,
  RefreshCw,
  Receipt,
  User
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ThemeToggle } from './ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: BarChart3 },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: TrendingUp },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const location = useLocation();
  const { user, signOut, isOnline, pendingSyncItems, syncData } = useStore();
  const [isSyncing, setIsSyncing] = React.useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'starter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'pro': return 'Pro';
      case 'starter': return 'Starter';
      default: return 'Free';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">BizManager</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
            {/* Online/Offline Status */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Sync Status */}
              {pendingSyncItems.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={!isOnline || isSyncing}
                  className={`flex items-center space-x-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    isOnline && !isSyncing
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingSyncItems.length} pending</span>
                </button>
              )}
            </div>

            {/* User Info with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ml-2 ${getPlanBadgeColor(user.plan)}`}>
                  {user.plan === 'pro' && <Crown className="mr-1 h-3 w-3" />}
                  {getPlanDisplayName(user.plan)}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowUserMenu(false);
                      setSidebarOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                  
                  {user.plan !== 'pro' && (
                    <Link
                      to="/pricing"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        setShowUserMenu(false);
                        setSidebarOpen(false);
                      }}
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">BizManager</h1>
          <div className="flex items-center space-x-2">
            {/* Mobile sync indicator */}
            {pendingSyncItems.length > 0 && (
              <button
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className={`rounded-md p-1 ${
                  isOnline && !isSyncing
                    ? 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop header with theme toggle */}
        <div className="hidden lg:flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
          <div className="flex items-center space-x-4">
            {/* Desktop sync status */}
            {pendingSyncItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSync}
                  disabled={!isOnline || isSyncing}
                  className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isOnline && !isSyncing
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingSyncItems.length} items pending sync</span>
                </button>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-yellow-800 dark:text-yellow-300">
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Changes will sync when connection is restored.</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}