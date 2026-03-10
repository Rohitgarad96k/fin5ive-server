const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors({
  origin: '*', // Allows requests from your React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Setup Multer (File Uploads kept in memory so Vercel doesn't crash)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==========================================
// 2. MONGODB CONNECTION & SCHEMAS
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Database Connected Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Schema: Contact Form Inquiries
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: { type: String },
  service: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);

// Schema: Career Applications (Work With Us)
const ApplicationSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  education: String,
  address: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  resumeFileName: String, // We save the name of the file they uploaded
  createdAt: { type: Date, default: Date.now }
});
const Application = mongoose.model('Application', ApplicationSchema);


// ==========================================
// 3. API ROUTES
// ==========================================

// Route: Health Check
app.get('/', (req, res) => {
  res.send("FIN5IVE API is running securely.");
});

// Route: Contact Form Submission
app.post('/api/contacts', async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();

    console.log("🟢 New Lead Saved to Database:", req.body.name);
    res.status(201).json({ message: "Inquiry saved to database successfully!" });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ message: "Failed to save inquiry to database." });
  }
});

// Route: Career Application Upload
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const data = req.body;

    if (!file) return res.status(400).json({ message: "Resume file is required." });

    const newApplication = new Application({
      ...data,
      resumeFileName: file.originalname
    });
    await newApplication.save();

    console.log("🟢 New Career Application Saved:", data.firstName);
    res.status(201).json({ message: "Application saved to database successfully." });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Database/Upload Error" });
  }
});

// Route: Client Authentication (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check credentials against the .env file
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
      console.log("🟢 Admin successfully logged in.");
      return res.status(200).json({ 
        message: "Login successful", 
        token: "admin-secure-jwt-token-12345",
        user: { email: email, role: "admin" }
      });
    }

    console.log("🔴 Failed login attempt:", email);
    res.status(401).json({ message: "Invalid email credentials or password." });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ message: "Auth server error." });
  }
});

// ==========================================
// 4. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 FIN5IVE Backend Server running on http://localhost:${PORT}`);
});