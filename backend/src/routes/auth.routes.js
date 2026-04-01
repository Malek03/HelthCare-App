const router = require('express').Router();
const { register, login, getMe, updateFcmToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/update-fcm', authenticate, updateFcmToken);

module.exports = router;
