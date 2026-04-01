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

// Public routes
router.get('/', listDoctors);
router.get('/profile/:id', getDoctorProfile);

// User routes (must be logged in)
router.post('/apply', authenticate, applyAsDoctor);
router.get('/application-status', authenticate, getApplicationStatus);

// Doctor-only routes
router.get('/dashboard', authenticate, authorize('DOCTOR'), getDoctorDashboard);
router.put('/my-profile', authenticate, authorize('DOCTOR'), updateDoctorProfile);
router.get('/schedule', authenticate, authorize('DOCTOR'), getSchedule);
router.post('/schedule', authenticate, authorize('DOCTOR'), updateSchedule);

module.exports = router;
