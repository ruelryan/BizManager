import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, Send, Eye, Plus, Search } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  businessInfo: {
    fontSize: 10,
    color: '#374151',
    marginTop: 5,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#374151',
  },
  section: {
    marginBottom: 20,
  },
  customerInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  table: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  text: {
    fontSize: 10,
    color: '#374151',
  },
  boldText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  total: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: 200,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
});

// Invoice PDF Component
const InvoicePDF = ({ sale, userSettings }: { sale: any; userSettings: any }) => {
  const currency = userSettings?.currency || 'PHP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '₱';
  const businessName = userSettings?.businessName || 'BizManager';
  const businessAddress = userSettings?.businessAddress;
  const businessPhone = userSettings?.businessPhone;
  const businessEmail = userSettings?.businessEmail;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{businessName}</Text>
            {businessAddress && (
              <Text style={styles.businessInfo}>{businessAddress}</Text>
            )}
            {businessPhone && (
              <Text style={styles.businessInfo}>Phone: {businessPhone}</Text>
            )}
            {businessEmail && (
              <Text style={styles.businessInfo}>Email: {businessEmail}</Text>
            )}
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.boldText}>INVOICE</Text>
            <Text style={styles.text}>#{sale.receipt_number || sale.invoiceNumber || 'N/A'}</Text>
            <Text style={styles.text}>Date: {format(new Date(sale.date || sale.created_at), 'MMM dd, yyyy')}</Text>
            {sale.dueDate && (
              <Text style={styles.text}>Due: {format(new Date(sale.dueDate), 'MMM dd, yyyy')}</Text>
            )}
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.boldText}>Bill To:</Text>
          <Text style={styles.text}>{sale.customer_name || sale.customerName || 'Walk-in Customer'}</Text>
          {sale.customerEmail && <Text style={styles.text}>{sale.customerEmail}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.boldText, styles.col1]}>Item</Text>
            <Text style={[styles.boldText, styles.col2]}>Qty</Text>
            <Text style={[styles.boldText, styles.col3]}>Price</Text>
            <Text style={[styles.boldText, styles.col4]}>Total</Text>
          </View>
          
          {(sale.items || []).map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.text, styles.col1]}>{item.productName || item.name || 'Unknown Item'}</Text>
              <Text style={[styles.text, styles.col2]}>{Number(item.quantity || 0)}</Text>
              <Text style={[styles.text, styles.col3]}>{currencySymbol}{Number(item.price || 0).toLocaleString()}</Text>
              <Text style={[styles.text, styles.col4]}>{currencySymbol}{Number(item.total || (item.price || 0) * (item.quantity || 0)).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <View style={styles.totalRow}>
            <Text style={styles.text}>Subtotal:</Text>
            <Text style={styles.text}>{currencySymbol}{Number(sale.subtotal || sale.total || 0).toLocaleString()}</Text>
          </View>
          {sale.tax && Number(sale.tax) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.text}>Tax:</Text>
              <Text style={styles.text}>{currencySymbol}{Number(sale.tax || 0).toLocaleString()}</Text>
            </View>
          )}
          {sale.discount && Number(sale.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.text}>Discount:</Text>
              <Text style={styles.text}>-{currencySymbol}{Number(sale.discount || 0).toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.boldText}>Total:</Text>
            <Text style={styles.boldText}>{currencySymbol}{Number(sale.total || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.boldText}>Payment Method:</Text>
          <Text style={styles.text}>{(sale.paymentType || sale.payments?.[0]?.method || 'Cash').toUpperCase()}</Text>
          <Text style={styles.boldText}>Status:</Text>
          <Text style={styles.text}>{(sale.status || 'completed').toUpperCase()}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>Generated by {businessName}</Text>
        </View>
      </Page>
    </Document>
  );
};

export function Invoices() {
  const { sales, updateSale, userSettings } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [viewingSale, setViewingSale] = React.useState<any>(null);

  const currency = userSettings?.currency || 'PHP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '₱';

  // Filter invoices
  const filteredInvoices = sales.filter((sale) => {
    const matchesSearch = (sale.customer_name || sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.receipt_number || sale.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sale.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': 
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Send invoice reminder
  const handleSendReminder = async (sale: any) => {
    try {
      // In a real app, this would send an email or SMS
      alert(`Reminder sent to ${sale.customerName || 'customer'} for invoice ${sale.invoiceNumber || sale.receipt_number}`);
      
      // Update the sale to mark reminder sent
      await updateSale(sale.id, {
        ...sale,
        reminderSent: true,
        lastReminderDate: new Date(),
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  // Invoice View Modal
  const InvoiceViewModal = ({ sale, onClose }: { sale: any; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invoice #{sale.receipt_number || sale.invoiceNumber || 'N/A'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bill To:</h3>
              <p className="text-gray-900 dark:text-white font-medium">
                {sale.customer_name || sale.customerName || 'Walk-in Customer'}
              </p>
              {sale.customerEmail && (
                <p className="text-gray-600 dark:text-gray-400">{sale.customerEmail}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Date: {format(new Date(sale.created_at || sale.date), 'MMM dd, yyyy')}
              </p>
              {sale.dueDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due: {format(new Date(sale.dueDate), 'MMM dd, yyyy')}
                </p>
              )}
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium mt-2 ${getStatusColor(sale.status)}`}>
                {sale.status}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {(sale.items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item.productName || item.name || 'Unknown Item'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-300">
                      {Number(item.quantity || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-300">
                      {currencySymbol}{Number(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {currencySymbol}{Number(item.total || (item.price || 0) * (item.quantity || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{currencySymbol}{Number(sale.subtotal || sale.total || 0).toLocaleString()}</span>
                </div>
                {sale.tax && Number(sale.tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="text-gray-900 dark:text-white">{currencySymbol}{Number(sale.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                {sale.discount && Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-white">-{currencySymbol}{Number(sale.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">{currencySymbol}{Number(sale.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method:</span>
                <p className="text-gray-900 dark:text-white capitalize">
                  {sale.paymentType || sale.payments?.[0]?.method || 'Cash'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <p className="text-gray-900 dark:text-white capitalize">
                  {sale.status || 'completed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track your invoices</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.receipt_number || invoice.invoiceNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.customer_name || invoice.customerName || 'Walk-in Customer'}
                    </div>
                    {invoice.customerEmail && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.customerEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {format(new Date(invoice.created_at || invoice.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {currencySymbol}{Number(invoice.total || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setViewingSale(invoice)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <FeatureGate feature="hasPdfInvoices">
                        <PDFDownloadLink
                          document={<InvoicePDF sale={invoice} userSettings={userSettings} />}
                          fileName={`invoice-${invoice.receipt_number || invoice.invoiceNumber || invoice.id}.pdf`}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          <Download className="h-4 w-4" />
                        </PDFDownloadLink>
                      </FeatureGate>
                      
                      {!['paid', 'completed'].includes(invoice.status) && (
                        <button 
                          onClick={() => handleSendReminder(invoice)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          title="Send Reminder"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No invoices found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms.' : 'Invoices will appear here when you create sales.'}
          </p>
        </div>
      )}

      {/* Invoice View Modal */}
      {viewingSale && (
        <InvoiceViewModal 
          sale={viewingSale} 
          onClose={() => setViewingSale(null)} 
        />
      )}
    </div>
  );
}