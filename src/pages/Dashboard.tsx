import React from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  FileText,
  Target,
  Settings,
  Plus,
  RefreshCw,
  Download,
  Star,
  Phone,
  ShoppingBag,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  Gift,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';
import { useCurrency } from '../hooks/useCurrency';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { ProductTour } from '../components/ProductTour';
import { Tooltip as CustomTooltip } from '../components/Tooltip';

export function Dashboard() {
  const { sales, products, monthlyGoal, setMonthlyGoal, userSettings, updateUserSettings, user, loadDemoData } = useStore();
  const [showGoalSetting, setShowGoalSetting] = React.useState(false);
  const [newGoal, setNewGoal] = React.useState(monthlyGoal);
  const { formatAmount, convertAmount, symbol } = useCurrency();

  // Ensure demo data is loaded for demo user
  React.useEffect(() => {
    console.log('Dashboard Debug:', { 
      user: user?.id, 
      productsCount: products.length, 
      salesCount: sales.length,
      userSettings: userSettings ? 'present' : 'missing'
    });
    
    if (user?.id === 'demo-user-id' && products.length === 0) {
      console.log('Loading demo data for demo user');
      loadDemoData();
    }
  }, [user, products.length, sales.length, userSettings, loadDemoData]);

  // Helper function to ensure valid date
  const isValidDate = (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Helper function to safely convert to date
  const safeDate = (dateValue: any): Date | null => {
    if (isValidDate(dateValue)) return dateValue;
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      return isValidDate(parsed) ? parsed : null;
    }
    return null;
  };

  // Calculate current month stats
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const currentMonthSales = sales.filter(sale => {
    const saleDate = safeDate(sale.date);
    return saleDate && saleDate >= monthStart && saleDate <= monthEnd && sale.status === 'paid';
  });
  
  const currentRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
  
  const todaySales = sales.filter(sale => {
    const saleDate = safeDate(sale.date);
    return saleDate && format(saleDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && sale.status === 'paid';
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  
  // Low stock products (excluding out of stock)
  const lowStockProducts = products.filter(product => 
    product.currentStock > 0 && product.currentStock <= product.minStock
  );
  
  // Out of stock products
  const outOfStockProducts = products.filter(product => product.currentStock === 0);
  
  // Unpaid invoices
  const unpaidInvoices = sales.filter(sale => sale.status === 'pending' || sale.status === 'overdue');
  
  // Revenue progress (convert goal to user currency for comparison)
  const convertedGoal = convertAmount(monthlyGoal, 'PHP');
  const convertedRevenue = convertAmount(currentRevenue, 'PHP');
  const revenueProgress = (convertedRevenue / convertedGoal) * 100;
  
  // Last 7 days data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = format(date, 'EEE');
    const daySales = sales.filter(sale => {
      const saleDate = safeDate(sale.date);
      return saleDate && format(saleDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && sale.status === 'paid';
    });
    const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
    return { day: dayName, revenue: convertAmount(revenue, 'PHP'), sales: daySales.length };
  });

  const handleGoalUpdate = async () => {
    // Convert goal back to PHP for storage
    const phpGoal = convertAmount(newGoal, userSettings?.currency || 'PHP', 'PHP');
    setMonthlyGoal(phpGoal);
    
    // Update user settings
    try {
      await updateUserSettings({ monthlyGoal: phpGoal });
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
    
    setShowGoalSetting(false);
  };

  // Enhanced Quick Actions Logic
  const getSmartQuickActions = () => {
    const actions = [];
    
    // 1. Critical Alerts (High Priority)
    if (lowStockProducts.length > 0) {
      actions.push({
        id: 'restock-urgent',
        title: 'Restock Items',
        description: `${lowStockProducts.length} items need restocking`,
        icon: RefreshCw,
        color: 'orange',
        priority: 'high',
        action: () => window.location.href = '/inventory?filter=low-stock',
        badge: lowStockProducts.length,
      });
    }
    
    if (unpaidInvoices.length > 0) {
      actions.push({
        id: 'follow-up-invoices',
        title: 'Follow Up Invoices',
        description: `${unpaidInvoices.length} unpaid invoices`,
        icon: Clock,
        color: 'red',
        priority: 'high',
        action: () => window.location.href = '/sales?filter=unpaid',
        badge: unpaidInvoices.length,
      });
    }
    
    // 2. Essential Daily Actions (Always Available)
    const coreActions = [
      {
        id: 'new-sale',
        title: 'New Sale',
        description: 'Create a new sale',
        icon: Plus,
        color: 'blue',
        priority: 'core',
        action: () => window.location.href = '/sales?action=new',
      },
      {
        id: 'add-product',
        title: 'Add Product',
        description: 'Add new product',
        icon: Package,
        color: 'green',
        priority: 'core',
        action: () => window.location.href = '/products?action=new',
      },
    ];
    
    // Sort by priority and return top 4 actions
    const priorityOrder = { high: 1, core: 2 };
    const allActions = [...actions, ...coreActions];
    
    return allActions
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 4);
  };

  const smartActions = getSmartQuickActions();

  // Quick Action Card Component
  const QuickActionCard = ({ action }: { action: {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    priority: string;
    action: () => void;
    badge?: number;
  } }) => {
    const getColorClasses = (color: string) => {
      const colorMap = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/40',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/40',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/40',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40',
        gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/40',
      };
      return colorMap[color as keyof typeof colorMap] || colorMap.blue;
    };

    const getBorderColor = (priority: string) => {
      return priority === 'high' ? 'border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/20' : 
             priority === 'medium' ? 'border-yellow-200 dark:border-yellow-800 shadow-yellow-100 dark:shadow-yellow-900/20' : 
             'border-gray-200 dark:border-gray-700';
    };

    return (
      <div className="relative">
        <button
          onClick={action.action}
          className={`w-full flex items-center space-x-3 p-4 rounded-lg border ${getBorderColor(action.priority)} hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group shadow-sm hover:shadow-md`}
        >
          <div className={`rounded-lg p-2 transition-colors ${getColorClasses(action.color)}`}>
            <action.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
          </div>
          {action.badge && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {action.badge}
            </div>
          )}
        </button>
      </div>
    );
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string;
    value: React.ReactNode;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }) => (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <div className="mt-1 flex items-center text-sm">
              {change > 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {Math.abs(change)}%
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg p-3 ${
          color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
          color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
          color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
          'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Icon className={`h-6 w-6 ${
            color === 'green' ? 'text-green-600 dark:text-green-400' :
            color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
            'text-red-600 dark:text-red-400'
          }`} />
        </div>
      </div>
    </div>
  );

  // Custom tooltip component for dark mode
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{`Day ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-300">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              {entry.name === 'Revenue' ? formatAmount(entry.value, 'PHP') : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show loading message if no data is available
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="hasGoalTracking">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Key Metrics - Simplified */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Today's Revenue"
            value={<CurrencyDisplay amount={todayRevenue} />}
            change={12}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Today's Sales"
            value={todaySales.length}
            change={8}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Alerts"
            value={lowStockProducts.length + outOfStockProducts.length + unpaidInvoices.length}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 quick-actions">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Zap className="h-3 w-3" />
              <span>Smart shortcuts</span>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {smartActions.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </div>
          
          {/* Action Categories Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Urgent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Important</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Routine</span>
                </div>
              </div>
              <span className="text-xs">Actions adapt to your business needs</span>
            </div>
          </div>
        </div>

        {/* Revenue Goal Progress */}
        <FeatureGate feature="hasGoalTracking">
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Revenue Goal</h2>
              <button
                onClick={() => setShowGoalSetting(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Settings className="h-4 w-4" />
                <span>Set Goal</span>
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <CurrencyDisplay amount={currentRevenue} /> of <CurrencyDisplay amount={monthlyGoal} />
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{revenueProgress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              />
            </div>
          </div>
        </FeatureGate>

        {/* Goal Setting Modal */}
        {showGoalSetting && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Set Monthly Revenue Goal</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Goal ({symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newGoal}
                    onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your monthly revenue goal"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleGoalUpdate}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Update Goal
                  </button>
                  <button
                    onClick={() => setShowGoalSetting(false)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value) => [formatAmount(value as number, 'PHP'), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Chart */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Sales Volume (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text)'
                  }}
                />
                <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
              <div className="mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-300">{product.name}</span>
                    <span className="rounded-full bg-yellow-100 dark:bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      {product.currentStock} left
                    </span>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    +{lowStockProducts.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Out of Stock Alert */}
          {outOfStockProducts.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
              <div className="mb-4 flex items-center">
                <Package className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Out of Stock</h3>
              </div>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700 dark:text-red-300">{product.name}</span>
                    <span className="rounded-full bg-red-100 dark:bg-red-800 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200">
                      0 stock
                    </span>
                  </div>
                ))}
                {outOfStockProducts.length > 3 && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    +{outOfStockProducts.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Unpaid Invoices */}
          {unpaidInvoices.length > 0 && (
            <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6">
              <div className="mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Unpaid Invoices</h3>
              </div>
              <div className="space-y-2">
                {unpaidInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <span className="text-orange-700 dark:text-orange-300">{invoice.customerName}</span>
                    <span className="rounded-full bg-orange-100 dark:bg-orange-800 px-2 py-1 text-xs font-medium text-orange-800 dark:text-orange-200">
                      <CurrencyDisplay amount={invoice.total} />
                    </span>
                  </div>
                ))}
                {unpaidInvoices.length > 3 && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    +{unpaidInvoices.length - 3} more invoices
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Tour */}
        <ProductTour />
      </div>
    </FeatureGate>
  );
}