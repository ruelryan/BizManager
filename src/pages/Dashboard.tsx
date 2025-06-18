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
  Users,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';

export function Dashboard() {
  const { sales, products, monthlyGoal } = useStore();

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
  
  // Low stock products
  const lowStockProducts = products.filter(product => product.currentStock <= product.minStock);
  
  // Unpaid invoices
  const unpaidInvoices = sales.filter(sale => sale.status === 'pending' || sale.status === 'overdue');
  
  // Revenue progress
  const revenueProgress = (currentRevenue / monthlyGoal) * 100;
  
  // Last 7 days data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = format(date, 'EEE');
    const daySales = sales.filter(sale => 
      format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && sale.status === 'paid'
    );
    const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
    return { day: dayName, revenue, sales: daySales.length };
  });

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

  return (
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
          value={`₱${todayRevenue.toLocaleString()}`}
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
            <Target className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              ₱{currentRevenue.toLocaleString()} of ₱{monthlyGoal.toLocaleString()}
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
                formatter={(value) => [`₱${value}`, 'Revenue']}
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
              <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Low Stock Alert</h3>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-700 dark:text-red-300">{product.name}</span>
                  <span className="rounded-full bg-red-100 dark:bg-red-800 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200">
                    {product.currentStock} left
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  +{lowStockProducts.length - 3} more items
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
                    ₱{invoice.total.toLocaleString()}
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
  );
}