const router = require('express').Router();
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Patient routes
router.post('/', authenticate, createAppointment);
router.get('/my', authenticate, getMyAppointments);

// Doctor routes
router.get('/doctor', authenticate, authorize('DOCTOR'), getDoctorAppointments);
router.put('/doctor/:id', authenticate, authorize('DOCTOR'), updateAppointmentStatus);

module.exports = router;
