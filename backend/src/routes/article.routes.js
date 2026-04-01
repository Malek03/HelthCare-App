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

// Public
router.get('/', listArticles);
router.get('/:id', getArticle);

// Doctor
router.get('/doctor/my', authenticate, authorize('DOCTOR'), getMyArticles);
router.post('/doctor', authenticate, authorize('DOCTOR'), createDoctorArticle);
router.put('/doctor/:id', authenticate, authorize('DOCTOR'), updateDoctorArticle);
router.delete('/doctor/:id', authenticate, authorize('DOCTOR'), deleteDoctorArticle);

module.exports = router;
