require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware
// ==========================================

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Files (Uploads & Media)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/media', express.static(path.join(__dirname, 'media')));

// ==========================================
// Initialize Firebase
// ==========================================

initializeFirebase();

// ==========================================
// Routes
// ==========================================

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/consultations', require('./routes/consultation.routes'));
app.use('/api/articles', require('./routes/article.routes'));
app.use('/api/videos', require('./routes/video.routes'));
app.use('/api/health', require('./routes/health.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ==========================================
// Health Check
// ==========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 404 Handler
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.originalUrl} غير موجود`,
  });
});

// ==========================================
// Global Error Handler
// ==========================================

app.use((err, req, res, next) => {
  console.error(' Server Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم الملف يتجاوز الحد المسموح',
    });
  }

  if (err.message && err.message.includes('نوع الملف غير مدعوم')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'خطأ داخلي في الخادم',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// ==========================================
// Start Server
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   Healthcare Platform API Server      ║
  ║   Running on: http://localhost:${PORT}      ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
