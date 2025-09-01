import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Configure your backend URL
const API_BASE_URL = 'http://192.168.27.114:3000/api'; // Replace with your actual IP

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to convert image to base64
const imageToBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    // On web, fetch the file and convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return `data:image/jpeg;base64,${base64}`;
  }
};

export const invoiceService = {
  extractFromImage: async (imageUri: string) => {
    try {
      const imageBase64 = await imageToBase64(imageUri);
      const response = await api.post('/extract-invoice', { imageBase64 });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to extract invoice');
      }
      throw error;
    }
  },

  extractFromFile: async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/extract-invoice`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error extracting from file:', error);
      return { success: false, error: error.message };
    }
  },

  getAllInvoices: async () => {
    try {
      const response = await api.get('/invoices');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch invoices');
      }
      throw error;
    }
  },

  getInvoiceById: async (id: string) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch invoice');
      }
      throw error;
    }
  },

  updateInvoice: async (id: string, updateData: any) => {
    try {
      const response = await api.put(`/invoices/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to update invoice');
      }
      throw error;
    }
  },

  deleteInvoice: async (id: string) => {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete invoice');
      }
      throw error;
    }
  },

  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Backend is not responding');
      }
      throw error;
    }
  },
};

export default api;