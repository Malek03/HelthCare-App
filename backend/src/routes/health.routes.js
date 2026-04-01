const router = require('express').Router();
const {
  logWater, getWaterLog,
  logSleep, getSleepLog,
  logWalk, getWalkLog,
  getDailySummary, getWeeklySummary,
} = require('../controllers/health.controller');
const { authenticate } = require('../middleware/auth');

// Water tracking
router.post('/water', authenticate, logWater);
router.get('/water/:date', authenticate, getWaterLog);

// Sleep tracking
router.post('/sleep', authenticate, logSleep);
router.get('/sleep/:date', authenticate, getSleepLog);

// Walk tracking
router.post('/walk', authenticate, logWalk);
router.get('/walk/:date', authenticate, getWalkLog);

// Summaries
router.get('/daily-summary/:date', authenticate, getDailySummary);
router.get('/weekly-summary', authenticate, getWeeklySummary);

module.exports = router;
