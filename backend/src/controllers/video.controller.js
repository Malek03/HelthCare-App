const prisma = require('../config/database');

/**
 * GET /api/videos
 */
const listVideos = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { is_published: true },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.video.count({ where: { is_published: true } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    console.error('ListVideos error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الفيديوهات' });
  }
};

module.exports = { listVideos };
