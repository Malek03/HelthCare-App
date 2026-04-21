const router = require('express').Router();
const {
  getStats,
  getUsers, banUser, deleteUser, promoteUser,
  getApplications, handleApplication,
  getDoctors, deleteDoctor,
  getAdminArticles, createArticle, updateArticle, deleteArticle, toggleArticlePublish,
  createVideo, updateVideo, deleteVideo,
  createHealthTip, sendHealthTip, getHealthTips,
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

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
router.get('/articles', getAdminArticles);
router.post('/articles', upload.single('image_file'), createArticle);
router.put('/articles/:id', upload.single('image_file'), updateArticle);
router.delete('/articles/:id', deleteArticle);
router.put('/articles/:id/toggle-publish', toggleArticlePublish);

router.post('/videos', upload.single('video_file'), createVideo);
router.put('/videos/:id', upload.single('video_file'), updateVideo);
router.delete('/videos/:id', deleteVideo);
router.get('/health-tips', getHealthTips);
router.post('/health-tips', createHealthTip);
router.post('/health-tips/:id/send', sendHealthTip);

module.exports = router;
