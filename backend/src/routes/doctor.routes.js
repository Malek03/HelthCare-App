const router = require('express').Router();
const {
  listDoctors,
  getDoctorProfile,
  applyAsDoctor,
  getApplicationStatus,
  getDoctorDashboard,
  updateDoctorProfile,
  getSchedule,
  updateSchedule,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

// Public routes
router.get('/', listDoctors);
router.get('/profile/:id', getDoctorProfile);

// User routes (must be logged in)
// Wrap Multer to handle errors gracefully and prevent connection drops
const handleUpload = upload.fields([
  { name: 'personal_photo', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]);

const multerErrorHandler = (req, res, next) => {
  handleUpload(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err.code, err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'حجم الملف يتجاوز الحد المسموح (10MB)',
        });
      }
      if (err.message && err.message.includes('نوع الملف غير مدعوم')) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'خطأ في رفع الملف: ' + err.message,
      });
    }
    next();
  });
};

router.post('/apply', authenticate, multerErrorHandler, applyAsDoctor);
router.get('/application-status', authenticate, getApplicationStatus);

// Doctor-only routes
router.get('/dashboard', authenticate, authorize('DOCTOR'), getDoctorDashboard);
router.put('/my-profile', authenticate, authorize('DOCTOR'), updateDoctorProfile);
router.get('/schedule', authenticate, authorize('DOCTOR'), getSchedule);
router.post('/schedule', authenticate, authorize('DOCTOR'), updateSchedule);

module.exports = router;
