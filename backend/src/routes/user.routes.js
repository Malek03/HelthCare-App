const router = require('express').Router();
const { getProfile, updateProfile, getProgress } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/progress', authenticate, getProgress);

module.exports = router;
