require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const cors = require('cors');
const path = require('path');


const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:8081', 'exp://192.168.27.114:8081'], // Add your Expo client origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable not set');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db, invoicesCollection;

async function connectDB() {
  await client.connect();
  db = client.db('invoiceDB');
  invoicesCollection = db.collection('invoices');
}

connectDB().catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Helper function to extract invoice data using Gemini API REST callasync function extractInvoiceData(imageBuffer) {
async function extractInvoiceData(imageBuffer) {
  const prompt = `Analyze this invoice document thoroughly and extract all relevant information in JSON format.
  The JSON should include common invoice fields like:
  - vendor_details (name, address, contact info)
  - customer_details (name, address, contact info)
  - invoice_number
  - invoice_date
  - due_date
  - line_items (description, quantity, unit_price, amount)
  - subtotal
  - taxes
  - total_amount
  - payment_terms
  - any other relevant fields present in the document
  
For fields that aren't present in the document, either omit them or set to null.
Return ONLY the JSON data, without any additional text or markdown formatting.`;
  
  try {
    const base64Image = imageBuffer.toString('base64');
  
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    };
  
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  
    // Log full response for debugging
    console.log('Gemini API full response:', JSON.stringify(response.data, null, 2));
  
    // Extract the response text
    const responseText = response.data.candidates[0].content.parts[0].text;
  
    // Clean the response if it contains JSON markers
    let cleanResponse = responseText;
    if (responseText.startsWith('```json')) {
      cleanResponse = responseText.slice(7, -3).trim();
    } else if (responseText.startsWith('```')) {
      cleanResponse = responseText.slice(3, -3).trim();
    }
  
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Gemini API error response data:', JSON.stringify(error.response.data, null, 2));
    }
    return { 
      error: 'Failed to extract invoice data',
      details: error.response?.data || error.message 
    };
  }
}
// Enhanced invoice extraction endpoint
app.post('/api/extract-invoice', upload.single('file'), async (req, res) => {
  try {
    let imageBuffer;
    
    // Handle both file upload and base64 string
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        // Convert PDF to image using pdf-lib and sharp
        const pdfBuffer = req.file.buffer;
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        const tempDir = os.tmpdir();
        const tempPdfPath = path.join(tempDir, `upload_${Date.now()}.pdf`);
        await fs.promises.writeFile(tempPdfPath, pdfBuffer);
        
        // Remove pdf-lib usage as it is not installed and not needed
        // Alternative approach: Use sharp to convert PDF buffer to JPEG
        const sharp = require('sharp');
        // sharp does not support PDF input directly, so convert PDF to PNG using pdf-poppler or pdf-to-image library
        // Since external dependencies are not installed, fallback to sending error for now
        const pdfToImage = require('./pdfToImage');
        try {
          const imageBufferSharp = await pdfToImage(req.file.buffer);
          imageBuffer = imageBufferSharp;
        } catch (err) {
          console.error('PDF to image conversion error:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to convert PDF to image',
            details: err.message
          });
        }
      } else {
        imageBuffer = req.file.buffer;
      }
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'No image data provided. Please upload a file or send a base64 string.' 
      });
    }

    const extractedData = await extractInvoiceData(imageBuffer);
    
    if (extractedData.error) {
      return res.status(500).json({
        success: false,
        error: extractedData.error,
        details: extractedData.details
      });
    }
    
    // Add timestamp
    extractedData.createdAt = new Date();
    extractedData.updatedAt = new Date();
    
    const result = await invoicesCollection.insertOne(extractedData);
    const storedInvoice = await invoicesCollection.findOne({ _id: result.insertedId });
    
    res.json({
      success: true,
      invoice: {
        ...storedInvoice,
        _id: storedInvoice._id.toString()
      }
    });
    
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error processing invoice',
      details: err.message 
    });
  }
});
      
    

// Enhanced GET endpoints
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await invoicesCollection.find()
      .sort({ createdAt: -1 })
      .toArray();
      
    res.json({
      success: true,
      count: invoices.length,
      invoices: invoices.map(inv => ({
        ...inv,
        _id: inv._id.toString()
      }))
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid invoice ID format' 
      });
    }
    
    const invoice = await invoicesCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        error: 'Invoice not found' 
      });
    }
    
    res.json({
      success: true,
      invoice: {
        ...invoice,
        _id: invoice._id.toString()
      }
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Update invoice endpoint
app.put('/api/invoices/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invoice ID format'
      });
    }

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const result = await invoicesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const updatedInvoice = await invoicesCollection.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      invoice: {
        ...updatedInvoice,
        _id: updatedInvoice._id.toString()
      }
    });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({
      success: false,
      error: 'Server error updating invoice',
      details: err.message
    });
  }
});

// Delete invoice endpoint
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invoice ID format'
      });
    }

    const result = await invoicesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json({
      success: false,
      error: 'Server error deleting invoice',
      details: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});