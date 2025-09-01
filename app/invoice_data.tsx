import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { invoiceService } from './api';

export default function InvoiceDataScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Start with true since we'll load immediately
  const [error, setError] = useState('');

  // Memoized data loading function
  const { id, extractedData, company, invoiceNumber, issueDate, dueDate, amount } = params;

  const loadInvoiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (id) {
        const response = await invoiceService.getInvoiceById(id as string);
        setInvoice(response.invoice);
      } else if (extractedData) {
        setInvoice(JSON.parse(extractedData as string));
      } else {
        setInvoice({
          company: company || '',
          invoice_number: invoiceNumber || '',
          invoice_date: issueDate || '',
          due_date: dueDate || '',
          total_amount: amount || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice data');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [id, extractedData, company, invoiceNumber, issueDate, dueDate, amount]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      await loadInvoiceData();
    };

    if (isMounted) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [loadInvoiceData]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Render address information
  const renderAddress = (title: string, addressData: any) => {
    if (!addressData) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {addressData.name && <Text style={styles.text}>{addressData.name}</Text>}
        {addressData.address && (
          <Text style={styles.text}>
            {addressData.address.split('\n').map((line: string, i: number) => (
              <Text key={i}>
                {line}
                {i < addressData.address.split('\n').length - 1 ? '\n' : ''}
              </Text>
            ))}
          </Text>
        )}
        {addressData.contact_info && (
          typeof addressData.contact_info === 'object'
            ? Object.entries(addressData.contact_info).map(([key, value]) => {
                const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
                return (
                  <Text key={key} style={styles.text}>
                    {key}: {val}
                  </Text>
                );
              })
            : <Text style={styles.text}>{addressData.contact_info}</Text>
        )}
      </View>
    );
  };

  // Render line items table
  const renderLineItems = () => {
    if (!invoice?.line_items || invoice.line_items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, styles.tableCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeader, styles.tableCell]}>Qty</Text>
            <Text style={[styles.tableHeader, styles.tableCell]}>Unit Price</Text>
            <Text style={[styles.tableHeader, styles.tableCell]}>Amount</Text>
          </View>
          {invoice.line_items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTaxes = () => {
    if (!invoice?.taxes || !Array.isArray(invoice.taxes)) return null;
  
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taxes</Text>
        {invoice.taxes.map((tax: any, index: number) => (
          <View key={index} style={styles.taxRow}>
            <Text style={styles.text}>{tax.description}</Text>
            <Text style={styles.text}>{formatCurrency(tax.amount)}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render totals section
  const renderTotals = () => {
    if (!invoice) return null;
  
    const totalTax = Array.isArray(invoice.taxes) 
      ? invoice.taxes.reduce((sum: number, tax: any) => sum + tax.amount, 0)
      : 0;
  
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totals</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal || 0)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Tax:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalTax)}</Text>
        </View>
        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 8 }]}>
          <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Total Amount:</Text>
          <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>
            {formatCurrency(invoice.total_amount || 0)}
          </Text>
        </View>
      </View>
    );
  };
  // Render other invoice information
  const renderInvoiceInfo = () => {
    if (!invoice) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invoice Number:</Text>
          <Text style={styles.infoValue}>{invoice.invoice_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invoice Date:</Text>
          <Text style={styles.infoValue}>{formatDate(invoice.invoice_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Due Date:</Text>
          <Text style={styles.infoValue}>{formatDate(invoice.due_date)}</Text>
        </View>
        {invoice.purchase_order_number && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PO Number:</Text>
            <Text style={styles.infoValue}>{invoice.purchase_order_number}</Text>
          </View>
        )}
        {invoice.payment_terms && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Terms:</Text>
            <Text style={styles.infoValue}>{invoice.payment_terms}</Text>
          </View>
        )}
        {invoice.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.infoValue}>{invoice.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSave = async () => {
    try {
      if (!invoice?._id) {
        Alert.alert('Error', 'Invoice ID is missing');
        return;
      }
      setLoading(true);
      const updatePayload = { ...invoice };
      delete updatePayload._id;
      const response = await invoiceService.updateInvoice(invoice._id, updatePayload);
      if (response.success) {
        Alert.alert('Success', 'Invoice saved successfully');
        setInvoice(response.invoice);
      } else {
        Alert.alert('Error', response.error || 'Failed to save invoice');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!invoice?._id) {
        Alert.alert('Error', 'Invoice ID is missing');
        return;
      }
      setLoading(true);
      const response = await invoiceService.deleteInvoice(invoice._id);
      if (response.success) {
        Alert.alert('Success', 'Invoice deleted successfully');
        router.back();
      } else {
        Alert.alert('Error', response.error || 'Failed to delete invoice');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading invoice data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text>No invoice data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.left}>
          <Ionicons name="document-text-outline" size={30} color="#007bff" />
          <Text style={styles.title}>Invoice Data</Text>
        </View>
        <View style={styles.right}>
          <Ionicons name="search" size={24} color="#28a745" style={styles.icon} />
          <Ionicons name="notifications-outline" size={24} color="#ffc107" style={styles.icon} />
          <MaterialIcons name="settings" size={24} color="#dc3545" style={styles.icon} />
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadInvoiceData}
          />}
          style={styles.content}>
        <Text style={styles.pageTitle}>Invoice Detail</Text>
        <Text style={styles.description}>Invoice #{invoice.invoice_number}</Text>

        {/* Invoice Information */}
        {renderInvoiceInfo()}

        {/* Address Sections */}
        {renderAddress('Vendor Details', invoice.vendor_details)}
        {renderAddress('Customer Details', invoice.customer_details)}
        {renderAddress('Shipping Address', invoice.shipping_address)}

        {/* Line Items */}
        {renderLineItems()}

        {/* Taxes */}
        {renderTaxes()}

        {/* Totals */}
        {renderTotals()}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 8,
  },
  icon: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b2169',
    marginBottom: 12,
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b2169',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 5,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: '#555',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
});
