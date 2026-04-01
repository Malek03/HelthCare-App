const prisma = require('../config/database');

/**
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        created_at: true,
        doctor_profile: {
          select: { id: true, specialty: true, bio: true, profile_image: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('GetProfile error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الملف الشخصي' });
  }
};

/**
 * PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: { id: true, name: true, email: true, avatar: true, role: true },
    });

    return res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي',
      data: user,
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث الملف الشخصي' });
  }
};

/**
 * GET /api/user/progress
 * Daily health progress summary
 */
const getProgress = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [waterLog, sleepLog, walkLog] = await Promise.all([
      prisma.waterLog.findUnique({
        where: { user_id_log_date: { user_id: req.user.id, log_date: targetDate } },
      }),
      prisma.sleepLog.findUnique({
        where: { user_id_log_date: { user_id: req.user.id, log_date: targetDate } },
      }),
      prisma.walkLog.findUnique({
        where: { user_id_log_date: { user_id: req.user.id, log_date: targetDate } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        water: waterLog || { glasses: 0 },
        sleep: sleepLog || { hours: 0, quality: null },
        walk: walkLog || { completed: false },
      },
    });
  } catch (error) {
    console.error('GetProgress error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب التقدم' });
  }
};

module.exports = { getProfile, updateProfile, getProgress };
