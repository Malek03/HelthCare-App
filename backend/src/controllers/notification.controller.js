const prisma = require('../config/database');

/**
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const where = { user_id: req.user.id };
    if (unread_only === 'true') where.is_read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { user_id: req.user.id, is_read: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    console.error('GetNotifications error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الإشعارات' });
  }
};

/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true },
    });

    return res.status(200).json({ success: true, message: 'تم تعليم الإشعار كمقروء' });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    return res.status(500).json({ success: false, message: 'خطأ' });
  }
};

/**
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true },
    });

    return res.status(200).json({ success: true, message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (error) {
    console.error('MarkAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'خطأ' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
