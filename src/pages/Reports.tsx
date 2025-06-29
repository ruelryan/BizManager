import React from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { useCurrency } from '../hooks/useCurrency';

export function Reports() {
  const { sales, products, expenses, exportReportData, userSettings } = useStore();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const { formatAmount, convertAmount, symbol, currency } = useCurrency();

  // Export function
  const handleExport = () => {
    try {
      const csvData = exportReportData();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales-report-${format(selectedMonth, 'yyyy-MM')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Calculate monthly data
  const getMonthlyData = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthSales = sales.filter(sale => 
      sale.date >= monthStart && sale.date <= monthEnd && (sale.status === 'paid' || sale.status === 'completed')
    );
    
    const monthExpenses = expenses.filter(expense =>
      expense.date >= monthStart && expense.date <= monthEnd
    );
    
    const totalRevenue = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalCostOfSales = monthSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => {
        const product = products.find(p => p.id === item.productId);
        return itemSum + ((product?.cost || 0) * item.quantity);
      }, 0), 0
    );
    
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCashOutflow = totalCostOfSales + totalExpenses;
    
    return {
      totalRevenue,
      totalCostOfSales,
      totalExpenses,
      totalCashOutflow,
      netIncome: totalRevenue - totalCashOutflow,
      salesCount: monthSales.length,
      sales: monthSales,
      expenses: monthExpenses,
    };
  };

  const currentMonthData = getMonthlyData(selectedMonth);
  const previousMonthData = getMonthlyData(subMonths(selectedMonth, 1));

  // Calculate percentage changes
  const revenueChange = previousMonthData.totalRevenue > 0 
    ? ((currentMonthData.totalRevenue - previousMonthData.totalRevenue) / previousMonthData.totalRevenue) * 100 
    : 0;

  const profitChange = previousMonthData.netIncome > 0 
    ? ((currentMonthData.netIncome - previousMonthData.netIncome) / previousMonthData.netIncome) * 100 
    : 0;

  // Daily sales chart data for current month
  const dailySalesData = React.useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = [];
    
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const dayStr = format(date, 'dd');
      const daySales = sales.filter(sale => 
        format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (sale.status === 'paid' || sale.status === 'completed')
      );
      const revenue = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      days.push({
        day: dayStr,
        revenue,
        sales: daySales.length,
      });
    }
    
    return days;
  }, [sales, selectedMonth]);

  // Product performance data
  const productPerformance = React.useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const productSales = new Map();
    
    sales
      .filter(sale => sale.date >= monthStart && sale.date <= monthEnd && (sale.status === 'paid' || sale.status === 'completed'))
      .forEach(sale => {
        sale.items.forEach(item => {
          const existing = productSales.get(item.productId) || { 
            name: item.productName, 
            quantity: 0, 
            revenue: 0 
          };
          existing.quantity += item.quantity;
          existing.revenue += item.total;
          productSales.set(item.productId, existing);
        });
      });
    
    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales, selectedMonth]);

  // Payment method distribution
  const paymentMethodData = React.useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const methodCounts = new Map();
    
    sales
      .filter(sale => sale.date >= monthStart && sale.date <= monthEnd && (sale.status === 'paid' || sale.status === 'completed'))
      .forEach(sale => {
        const count = methodCounts.get(sale.paymentType) || 0;
        methodCounts.set(sale.paymentType, count + 1);
      });
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    
    return Array.from(methodCounts.entries()).map(([method, count], index) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: count,
      color: colors[index % colors.length],
    }));
  }, [sales, selectedMonth]);

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: any) => (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="mt-1 flex items-center text-sm">
              {change > 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500 dark:text-green-400" />
              ) : change < 0 ? (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500 dark:text-red-400" />
              ) : null}
              <span className={change > 0 ? 'text-green-600 dark:text-green-400' : change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg p-3 ${
          color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
          color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
          color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
          color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
          'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Icon className={`h-6 w-6 ${
            color === 'green' ? 'text-green-600 dark:text-green-400' :
            color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
            color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
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
              {entry.name === 'Revenue' ? (
                <CurrencyDisplay amount={entry.value} />
              ) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom pie chart tooltip
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <FeatureGate feature="hasReports">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your business performance and insights</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={format(selectedMonth, 'yyyy-MM')}
                onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = subMonths(new Date(), i);
                  return (
                    <option key={i} value={format(date, 'yyyy-MM')}>
                      {format(date, 'MMMM yyyy')}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button 
              onClick={handleExport}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={<CurrencyDisplay amount={currentMonthData.totalRevenue} />}
            change={revenueChange}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Sales"
            value={currentMonthData.salesCount}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Net Income"
            value={<CurrencyDisplay amount={currentMonthData.netIncome} />}
            change={profitChange}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Profit Margin"
            value={`${((currentMonthData.netIncome / currentMonthData.totalRevenue) * 100 || 0).toFixed(1)}%`}
            icon={FileText}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Revenue Chart */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Daily Revenue - {format(selectedMonth, 'MMMM yyyy')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  stroke="currentColor" 
                  className="text-gray-600 dark:text-gray-400"
                  fontSize={12}
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-gray-600 dark:text-gray-400"
                  fontSize={12}
                  tickFormatter={(value) => {
                    // Format Y-axis ticks with currency symbol
                    return `${symbol}${Math.round(convertAmount(value, 'PHP')).toLocaleString()}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Payment Methods Distribution
            </h2>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-gray-500 dark:text-gray-400">
                No payment data for this month
              </div>
            )}
          </div>
        </div>

        {/* Product Performance */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Products - {format(selectedMonth, 'MMMM yyyy')}
            </h2>
          </div>
          
          {productPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {productPerformance.map((product, index) => {
                    const maxRevenue = Math.max(...productPerformance.map(p => p.revenue));
                    const percentage = (product.revenue / maxRevenue) * 100;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <CurrencyDisplay amount={product.revenue} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sales data</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No sales recorded for {format(selectedMonth, 'MMMM yyyy')}.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Cash Flow Report (Pro Feature) */}
        <FeatureGate feature="hasCashFlowReport">
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cash Flow Analysis - {format(selectedMonth, 'MMMM yyyy')}
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  <CurrencyDisplay amount={currentMonthData.totalRevenue} />
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 font-medium">Cash Inflow (Revenue)</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  <CurrencyDisplay amount={currentMonthData.totalCostOfSales} />
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">Cost of Sales</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  <CurrencyDisplay amount={currentMonthData.totalExpenses} />
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 font-medium">Operating Expenses</div>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${
                currentMonthData.netIncome >= 0 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className={`text-3xl font-bold ${
                  currentMonthData.netIncome >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <CurrencyDisplay amount={currentMonthData.netIncome} />
                </div>
                <div className={`text-sm font-medium ${
                  currentMonthData.netIncome >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  Net Cash Flow
                </div>
              </div>
            </div>

            {/* Cash Flow Breakdown */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Cash Flow Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    +<CurrencyDisplay amount={currentMonthData.totalRevenue} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cost of Sales:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    -<CurrencyDisplay amount={currentMonthData.totalCostOfSales} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Expenses:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -<CurrencyDisplay amount={currentMonthData.totalExpenses} />
                  </span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Net Cash Flow:</span>
                    <span className={`font-bold ${
                      currentMonthData.netIncome >= 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {currentMonthData.netIncome >= 0 ? '+' : ''}
                      <CurrencyDisplay amount={currentMonthData.netIncome} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FeatureGate>
      </div>
    </FeatureGate>
  );
}