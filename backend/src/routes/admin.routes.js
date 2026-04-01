const router = require('express').Router();
const {
  getStats,
  getUsers, banUser, deleteUser, promoteUser,
  getApplications, handleApplication,
  getDoctors, deleteDoctor,
  createArticle, createVideo,
  createHealthTip, sendHealthTip, getHealthTips,
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/promote', promoteUser);

// Doctor applications
router.get('/applications', getApplications);
router.put('/applications/:id', handleApplication);

// Doctor management
router.get('/doctors', getDoctors);
router.delete('/doctors/:id', deleteDoctor);

// Content management
router.post('/articles', createArticle);
router.post('/videos', createVideo);
router.get('/health-tips', getHealthTips);
router.post('/health-tips', createHealthTip);
router.post('/health-tips/:id/send', sendHealthTip);

module.exports = router;
