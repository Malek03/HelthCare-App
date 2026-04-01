const prisma = require('../config/database');
const { getSleepQuality, getTodayDate, parseDate } = require('../utils/helpers');

/**
 * POST /api/health/water
 * Log a glass of water
 */
const logWater = async (req, res) => {
  try {
    const today = getTodayDate();

    const waterLog = await prisma.waterLog.upsert({
      where: { user_id_log_date: { user_id: req.user.id, log_date: today } },
      update: { glasses: { increment: 1 } },
      create: { user_id: req.user.id, log_date: today, glasses: 1 },
    });

    // Cap at 5 glasses
    if (waterLog.glasses > 5) {
      await prisma.waterLog.update({
        where: { id: waterLog.id },
        data: { glasses: 5 },
      });
      waterLog.glasses = 5;
    }

    return res.status(200).json({
      success: true,
      message: waterLog.glasses >= 5 ? '🎉 أحسنت! أكملت شرب الماء اليوم' : `💧 شربت ${waterLog.glasses} من 5 أكواب`,
      data: waterLog,
    });
  } catch (error) {
    console.error('LogWater error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل شرب الماء' });
  }
};

/**
 * GET /api/health/water/:date
 */
const getWaterLog = async (req, res) => {
  try {
    const date = parseDate(req.params.date);
    const waterLog = await prisma.waterLog.findUnique({
      where: { user_id_log_date: { user_id: req.user.id, log_date: date } },
    });

    return res.status(200).json({
      success: true,
      data: waterLog || { glasses: 0, log_date: date },
    });
  } catch (error) {
    console.error('GetWaterLog error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب سجل الماء' });
  }
};

/**
 * POST /api/health/sleep
 */
const logSleep = async (req, res) => {
  try {
    const { hours } = req.body;

    if (hours === undefined || hours < 0 || hours > 24) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال عدد ساعات صحيح (0-24)' });
    }

    const today = getTodayDate();
    const quality = getSleepQuality(hours);

    const sleepLog = await prisma.sleepLog.upsert({
      where: { user_id_log_date: { user_id: req.user.id, log_date: today } },
      update: { hours: parseFloat(hours), quality },
      create: { user_id: req.user.id, log_date: today, hours: parseFloat(hours), quality },
    });

    const qualityMessages = {
      POOR: '🔴 نومك أقل من الطبيعي - حاول النوم مبكراً الليلة',
      MODERATE: '🟡 نومك متوسط - حاول الحصول على 7+ ساعات',
      GOOD: '🔵 ممتاز! نومك صحي اليوم',
    };

    return res.status(200).json({
      success: true,
      message: qualityMessages[quality],
      data: sleepLog,
    });
  } catch (error) {
    console.error('LogSleep error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل النوم' });
  }
};

/**
 * GET /api/health/sleep/:date
 */
const getSleepLog = async (req, res) => {
  try {
    const date = parseDate(req.params.date);
    const sleepLog = await prisma.sleepLog.findUnique({
      where: { user_id_log_date: { user_id: req.user.id, log_date: date } },
    });

    return res.status(200).json({
      success: true,
      data: sleepLog || { hours: 0, quality: null, log_date: date },
    });
  } catch (error) {
    console.error('GetSleepLog error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب سجل النوم' });
  }
};

/**
 * POST /api/health/walk
 */
const logWalk = async (req, res) => {
  try {
    const today = getTodayDate();
    const { steps } = req.body;

    const walkLog = await prisma.walkLog.upsert({
      where: { user_id_log_date: { user_id: req.user.id, log_date: today } },
      update: { completed: true, ...(steps && { steps: parseInt(steps) }) },
      create: { user_id: req.user.id, log_date: today, completed: true, steps: steps ? parseInt(steps) : null },
    });

    return res.status(200).json({
      success: true,
      message: '🚶 أحسنت! تم تسجيل المشي لهذا اليوم',
      data: walkLog,
    });
  } catch (error) {
    console.error('LogWalk error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل المشي' });
  }
};

/**
 * GET /api/health/walk/:date
 */
const getWalkLog = async (req, res) => {
  try {
    const date = parseDate(req.params.date);
    const walkLog = await prisma.walkLog.findUnique({
      where: { user_id_log_date: { user_id: req.user.id, log_date: date } },
    });

    return res.status(200).json({
      success: true,
      data: walkLog || { completed: false, log_date: date },
    });
  } catch (error) {
    console.error('GetWalkLog error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب سجل المشي' });
  }
};

/**
 * GET /api/health/daily-summary/:date
 */
const getDailySummary = async (req, res) => {
  try {
    const date = parseDate(req.params.date);

    const [water, sleep, walk] = await Promise.all([
      prisma.waterLog.findUnique({ where: { user_id_log_date: { user_id: req.user.id, log_date: date } } }),
      prisma.sleepLog.findUnique({ where: { user_id_log_date: { user_id: req.user.id, log_date: date } } }),
      prisma.walkLog.findUnique({ where: { user_id_log_date: { user_id: req.user.id, log_date: date } } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        date,
        water: water || { glasses: 0 },
        sleep: sleep || { hours: 0, quality: null },
        walk: walk || { completed: false },
      },
    });
  } catch (error) {
    console.error('GetDailySummary error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الملخص اليومي' });
  }
};

/**
 * GET /api/health/weekly-summary
 */
const getWeeklySummary = async (req, res) => {
  try {
    const today = getTodayDate();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [waterLogs, sleepLogs, walkLogs] = await Promise.all([
      prisma.waterLog.findMany({
        where: { user_id: req.user.id, log_date: { gte: weekAgo, lte: today } },
        orderBy: { log_date: 'asc' },
      }),
      prisma.sleepLog.findMany({
        where: { user_id: req.user.id, log_date: { gte: weekAgo, lte: today } },
        orderBy: { log_date: 'asc' },
      }),
      prisma.walkLog.findMany({
        where: { user_id: req.user.id, log_date: { gte: weekAgo, lte: today } },
        orderBy: { log_date: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { waterLogs, sleepLogs, walkLogs },
    });
  } catch (error) {
    console.error('GetWeeklySummary error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الملخص الأسبوعي' });
  }
};

module.exports = {
  logWater, getWaterLog,
  logSleep, getSleepLog,
  logWalk, getWalkLog,
  getDailySummary, getWeeklySummary,
};
