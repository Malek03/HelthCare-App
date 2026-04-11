const router = require('express').Router();
const {
  listArticles,
  getArticle,
  createDoctorArticle,
  updateDoctorArticle,
  deleteDoctorArticle,
  getMyArticles,
} = require('../controllers/article.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

// Wrap Multer to handle errors gracefully
const handleUpload = upload.single('image');
const multerErrorHandler = (req, res, next) => {
  handleUpload(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err.message);
      if (err.message && err.message.includes('نوع الملف غير مدعوم')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: 'خطأ في رفع الملف: ' + err.message });
    }
    next();
  });
};

// Public
router.get('/', listArticles);
router.get('/:id', getArticle);

// Doctor
router.get('/doctor/my', authenticate, authorize('DOCTOR'), getMyArticles);
router.post('/doctor', authenticate, authorize('DOCTOR'), multerErrorHandler, createDoctorArticle);
router.put('/doctor/:id', authenticate, authorize('DOCTOR'), multerErrorHandler, updateDoctorArticle);
router.delete('/doctor/:id', authenticate, authorize('DOCTOR'), deleteDoctorArticle);

module.exports = router;
