import React from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  FileText,
  Target,
  Settings,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';
import { useCurrency } from '../hooks/useCurrency';
import { CurrencyDisplay } from '../components/CurrencyDisplay';

export function Dashboard() {
  const { sales, products, monthlyGoal, setMonthlyGoal, userSettings, updateUserSettings } = useStore();
  const [showGoalSetting, setShowGoalSetting] = React.useState(false);
  const [newGoal, setNewGoal] = React.useState(monthlyGoal);
  const { formatAmount, convertAmount, symbol } = useCurrency();

  // Calculate current month stats
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const currentMonthSales = sales.filter(sale => 
    sale.date >= monthStart && sale.date <= monthEnd && sale.status === 'paid'
  );
  
  const currentRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(sale => 
    format(sale.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && sale.status === 'paid'
  );
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
    const daySales = sales.filter(sale => 
      format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && sale.status === 'paid'
    );
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

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: any) => (
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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{`Day ${label}`}</p>
          {payload.map((entry: any, index: number) => (
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

  return (
    <FeatureGate feature="hasGoalTracking">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            title="Total Products"
            value={products.length}
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockProducts.length}
            icon={AlertTriangle}
            color="red"
          />
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
      </div>
    </FeatureGate>
  );
}