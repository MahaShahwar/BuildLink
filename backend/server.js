const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:36121'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many attempts, please try again after 15 minutes' } });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, message: 'Too many requests, please slow down' } });
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/engineers', require('./routes/engineers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/engineer', require('./routes/engineerDashboard'));
app.use('/api/floorplan', require('./routes/floorplan'));
app.use('/api/admin', require('./routes/admin'));

// Seed admin (public, only works if no admin exists)
app.post('/api/seed-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.status(400).json({ success: false, message: 'Admin already exists' });
    const admin = await User.create({
      firstName: 'Admin', lastName: 'BuildLink',
      email: req.body.email || 'admin@buildlink.com',
      password: req.body.password || 'Admin@12345',
      phone: req.body.phone || '+923000000000',
      role: 'admin', isVerified: true, isActive: true,
    });
    const token = admin.getSignedJwtToken();
    res.status(201).json({ success: true, message: 'Admin created', token, user: { id: admin._id, email: admin.email, role: 'admin', firstName: admin.firstName, lastName: admin.lastName } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BuildLink API running on port ${PORT}`);
});
