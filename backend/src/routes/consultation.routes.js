const router = require('express').Router();
const {
  createConsultation,
  getMyConsultations,
  getDoctorConsultations,
  answerConsultation,
} = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Patient routes
router.post('/', authenticate, createConsultation);
router.get('/my', authenticate, getMyConsultations);

// Doctor routes
router.get('/doctor', authenticate, authorize('DOCTOR'), getDoctorConsultations);
router.put('/doctor/:id', authenticate, authorize('DOCTOR'), answerConsultation);

module.exports = router;
