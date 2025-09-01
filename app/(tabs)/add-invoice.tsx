import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { invoiceService } from '../api';

export default function AddInvoiceScreen() {
  const [company, setCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = () => {
    if (!company || !invoiceNumber || !issueDate || !dueDate || !amount) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    router.push({
      pathname: '/invoice_data',
      params: {
        company,
        invoiceNumber,
        issueDate,
        dueDate,
        amount,
      },
    });
  };

  const handleSubmit1 = async () => {
    if (!selectedFileUri) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    try {
      setLoading(true);

      let response;
      if (fileType === 'pdf') {
        // For PDF, send as file with correct mime type
        const formData = new FormData();
        formData.append('file', {
          uri: selectedFileUri,
          name: 'invoice.pdf',
          type: 'application/pdf',
        } as any);

        response = await invoiceService.extractFromFile(formData);
      } else if (fileType === 'image') {
        response = await invoiceService.extractFromImage(selectedFileUri);
      } else {
        Alert.alert('Error', 'Unsupported file type.');
        setLoading(false);
        return;
      }

      const { success, invoice, error } = response;

      if (!success) {
        throw new Error(error || 'Failed to extract invoice data');
      }

      setLoading(false);

      router.push({
        pathname: '/invoice_data',
        params: {
          id: invoice._id, // Pass the invoice ID
          company: invoice.vendor_details?.name || '',
          invoiceNumber: invoice.invoice_number || '',
          issueDate: invoice.invoice_date || '',
          dueDate: invoice.due_date || '',
          amount: invoice.total_amount || '',
          imageUri: selectedFileUri,
          extractedData: JSON.stringify(invoice), // Pass all data as string
        },
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to process invoice');
      console.error('Invoice processing error:', error);
    }
  };

  const handleCaptureWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedFileUri(uri);
        setFileType('image');
      }
    } else {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la caméra.');
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const name = result.assets[0].name || '';
        const ext = name.split('.').pop()?.toLowerCase();

        if (ext === 'pdf') {
          setFileType('pdf');
        } else {
          setFileType('image');
        }

        setSelectedFileUri(uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* NAVBAR */}
        <View style={styles.navbar}>
          <View style={styles.left}>
            <Ionicons name="add-circle-outline" size={30} color="#007bff" />
            <Text style={styles.title}>Add Invoice</Text>
          </View>
          <View style={styles.right}>
            <TouchableOpacity onPress={() => alert('Search')}>
              <Ionicons name="search" size={24} color="#28a745" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#ffc107" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Settings')}>
              <MaterialIcons name="settings" size={24} color="#dc3545" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Company Name"
              value={company}
              onChangeText={setCompany}
            />
            <TextInput
              style={[styles.input, styles.halfInput, { marginLeft: 8 }]}
              placeholder="Invoice Number"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Issue Date"
              value={issueDate}
              onChangeText={setIssueDate}
            />
            <TextInput
              style={[styles.input, styles.halfInput, { marginLeft: 8 }]}
              placeholder="Due Date"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>

          <TextInput
            style={[styles.input, { width: '100%' }]}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity style={styles.navButton1} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit Invoice</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Invoice Upload/Scan</Text>

          {/* PREVIEW */}
          {selectedFileUri && (
            <View style={styles.previewContainer}>
              {fileType === 'image' ? (
                <Image source={{ uri: selectedFileUri }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.pdfText}>📄 PDF sélectionné : {selectedFileUri.split('/').pop()}</Text>
              )}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={handleCaptureWithCamera}>
              <Text style={styles.buttonText}>Capture Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.smallButton, { marginLeft: 8 }]} onPress={handleUploadFile}>
              <Text style={styles.buttonText}>Upload File</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.navButton1} onPress={handleSubmit1}>
            <Text style={styles.buttonText}>Send Invoice</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.navButton, styles.smallButton]}
              onPress={() => router.push('/')}
            >
              <Text style={styles.navButtonText}>Back to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.smallButton, { marginLeft: 8 }]}
              onPress={() => router.push('/invoice_data')}
            >
              <Text style={styles.navButtonText}>Go to Invoice Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Processing</Text>
              <Text style={styles.modalMessage}>Extracting invoice data...</Text>
              <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fefefe' },
  container: { flex: 1, paddingHorizontal: 16 },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212529', marginLeft: 8 },
  icon: { marginLeft: 12 },
  content: { flex: 1, alignItems: 'center', paddingTop: 10 },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#3b2169',
  },
  input: {
    padding: 12, marginVertical: 8, borderWidth: 1, borderRadius: 8, borderColor: '#000', backgroundColor: '#fff',
  },
  halfInput: { flex: 1 },
  row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#007bff', paddingVertical: 10, borderRadius: 8, width: '100%', alignItems: 'center', marginVertical: 10,
  },
  buttonText: { color: '#fff', fontSize: 18 },
  buttonRow: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-between',
  },
  smallButton: { width: '48%' },
  navButton: {
    backgroundColor: '#336699', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
    marginTop: 0, alignItems: 'center',
  },
  navButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', height: 25 },
  spacing: { marginBottom: 20 },
  previewContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: 300, height: 200, resizeMode: 'contain', borderRadius: 8 },
  pdfText: { fontSize: 16, color: '#333', marginTop: 10 },
  navButton1: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalMessage: {
    marginTop: 10,
    fontSize: 16,
  },
});
