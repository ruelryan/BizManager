import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, Send, Eye, Search } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { useStore } from '../store/useStore';
import { FeatureGate } from '../components/FeatureGate';

// Register custom fonts - moved outside component to prevent multiple registrations
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },
  businessInfo: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  invoiceInfo: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 3,
  },
  invoiceInfoBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  customerInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
    marginBottom: 30,
  },
  billingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  billingText: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 3,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    padding: 10,
  },
  tableRowLast: {
    flexDirection: 'row',
    padding: 10,
  },
  tableCol1: { width: '40%' },
  tableCol2: { width: '20%', textAlign: 'center' },
  tableCol3: { width: '20%', textAlign: 'right' },
  tableCol4: { width: '20%', textAlign: 'right' },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  tableRowText: {
    fontSize: 10,
    color: '#4b5563',
  },
  tableRowTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
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
  totalRowLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    width: 200,
  },
  totalText: {
    fontSize: 10,
    color: '#4b5563',
  },
  totalTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  totalAmountLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  paymentInfo: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
    width: 100,
  },
  paymentValue: {
    fontSize: 10,
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
    marginBottom: 3,
  },
  footerTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  statusBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    padding: 10,
    transform: 'rotate(45deg)',
    transformOrigin: 'right top',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  paidBadge: {
    backgroundColor: '#10b981',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
  },
  overdueBadge: {
    backgroundColor: '#ef4444',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    fontWeight: 'bold',
    color: 'rgba(229, 231, 235, 0.5)',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  qrCodeContainer: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    alignItems: 'center',
  },
  qrCodeText: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 5,
  },
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  currencySymbol: {
    marginRight: 4,
  }
});

// Invoice PDF Component
const InvoicePDF = ({ sale, userSettings }: { sale: any; userSettings: any }) => {
  const currency = userSettings?.currency || 'PHP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '₱';
  const businessName = userSettings?.businessName || 'BizManager';
  const businessAddress = userSettings?.businessAddress;
  const businessPhone = userSettings?.businessPhone;
  const businessEmail = userSettings?.businessEmail;
  
  const invoiceNumber = sale.receipt_number || sale.invoiceNumber || 'N/A';
  const invoiceDate = format(new Date(sale.date || sale.created_at), 'MMMM dd, yyyy');
  const dueDate = sale.dueDate ? format(new Date(sale.dueDate), 'MMMM dd, yyyy') : null;
  const customerName = sale.customer_name || sale.customerName || 'Walk-in Customer';
  const customerEmail = sale.customerEmail || '';
  const status = sale.status || 'completed';
  
  // Generate QR code URL for verification
  const qrCodeData = `INV:${invoiceNumber}|DATE:${format(new Date(sale.date || sale.created_at), 'yyyyMMdd')}|AMT:${sale.total || 0}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrCodeData)}`;

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        {status === 'paid' || status === 'completed' ? (
          <View style={[styles.statusBadge, styles.paidBadge]}>
            <Text>PAID</Text>
          </View>
        ) : status === 'pending' ? (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text>PENDING</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.overdueBadge]}>
            <Text>OVERDUE</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceInfoBold}>#{invoiceNumber}</Text>
            <Text style={styles.invoiceInfo}>Issue Date: {invoiceDate}</Text>
            {dueDate && (
              <Text style={styles.invoiceInfo}>Due Date: {dueDate}</Text>
            )}
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.customerInfo}>
          <Text style={styles.billingTitle}>BILL TO:</Text>
          <Text style={[styles.billingText, { fontWeight: 'bold' }]}>{customerName}</Text>
          {customerEmail && <Text style={styles.billingText}>{customerEmail}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableCol1}>
              <Text style={styles.tableHeaderText}>ITEM</Text>
            </View>
            <View style={styles.tableCol2}>
              <Text style={styles.tableHeaderText}>QTY</Text>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.tableHeaderText}>PRICE</Text>
            </View>
            <View style={styles.tableCol4}>
              <Text style={styles.tableHeaderText}>TOTAL</Text>
            </View>
          </View>
          
          {(sale.items || []).map((item: any, index: number, array: any[]) => (
            <View key={index} style={index === array.length - 1 ? styles.tableRowLast : styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text style={styles.tableRowText}>{item.productName || item.name || 'Unknown Item'}</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.tableRowText}>{Number(item.quantity || 0)}</Text>
              </View>
              <View style={styles.tableCol3}>
                <Text style={styles.tableRowText}>
                  {currencySymbol} {formatNumber(Number(item.price || 0))}
                </Text>
              </View>
              <View style={styles.tableCol4}>
                <Text style={styles.tableRowTextBold}>
                  {currencySymbol} {formatNumber(Number(item.total || (item.price || 0) * (item.quantity || 0)))}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.total}>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Subtotal:</Text>
            <Text style={styles.totalText}>
              {currencySymbol} {formatNumber(Number(sale.subtotal || sale.total || 0))}
            </Text>
          </View>
          {sale.tax && Number(sale.tax) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Tax:</Text>
              <Text style={styles.totalText}>
                {currencySymbol} {formatNumber(Number(sale.tax || 0))}
              </Text>
            </View>
          )}
          {sale.discount && Number(sale.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Discount:</Text>
              <Text style={styles.totalText}>
                -{currencySymbol} {formatNumber(Number(sale.discount || 0))}
              </Text>
            </View>
          )}
          <View style={styles.totalRowLarge}>
            <Text style={styles.totalTextBold}>Total:</Text>
            <Text style={styles.totalAmountLarge}>
              {currencySymbol} {formatNumber(Number(sale.total || 0))}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method:</Text>
            <Text style={styles.paymentValue}>{(sale.paymentType || sale.payments?.[0]?.method || 'Cash').toUpperCase()}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status:</Text>
            <Text style={styles.paymentValue}>{(sale.status || 'completed').toUpperCase()}</Text>
          </View>
          {dueDate && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Due Date:</Text>
              <Text style={styles.paymentValue}>{dueDate}</Text>
            </View>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrCodeContainer}>
          <Image src={qrCodeUrl} style={styles.qrCode} />
          <Text style={styles.qrCodeText}>Scan to verify</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>This is an electronically generated invoice and does not require a signature.</Text>
          <Text style={styles.footerTextBold}>{businessName} © {new Date().getFullYear()}</Text>
        </View>

        {/* Watermark for pending/overdue */}
        {(status === 'pending' || status === 'overdue') && (
          <View style={styles.watermark}>
            <Text>{status.toUpperCase()}</Text>
          </View>
        )}
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
                      {currencySymbol} {Number(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {currencySymbol} {Number(item.total || (item.price || 0) * (item.quantity || 0)).toLocaleString()}
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
                  <span className="text-gray-900 dark:text-white">{currencySymbol} {Number(sale.subtotal || sale.total || 0).toLocaleString()}</span>
                </div>
                {sale.tax && Number(sale.tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="text-gray-900 dark:text-white">{currencySymbol} {Number(sale.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                {sale.discount && Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-white">-{currencySymbol} {Number(sale.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">{currencySymbol} {Number(sale.total || 0).toLocaleString()}</span>
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
                    {currencySymbol} {Number(invoice.total || 0).toLocaleString()}
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
                          {({ loading }) => (
                            loading ? 
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div> : 
                            <Download className="h-4 w-4" />
                          )}
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