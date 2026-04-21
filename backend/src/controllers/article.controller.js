const prisma = require('../config/database');

/**
 * GET /api/articles
 */
const listArticles = async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const where = { is_published: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          doctor: { include: { user: { select: { name: true, avatar: true } } } },
          admin: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.article.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        articles,
        pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    console.error('ListArticles error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المقالات' });
  }
};

/**
 * GET /api/articles/:id
 */
const getArticle = async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { include: { user: { select: { name: true, avatar: true } } } },
        admin: { select: { name: true } },
      },
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    return res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('GetArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المقال' });
  }
};

/**
 * POST /api/doctor/articles (Doctor creates article)
 */
const createDoctorArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = req.file.path.startsWith('http') ? req.file.path : '/uploads/image/' + req.file.filename;
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'العنوان والمحتوى مطلوبان' });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const article = await prisma.article.create({
      data: { title, content, image, doctor_id: doctorProfile.id },
    });

    return res.status(201).json({
      success: true,
      message: 'تم نشر المقال بنجاح',
      data: article,
    });
  } catch (error) {
    console.error('CreateDoctorArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في نشر المقال' });
  }
};

/**
 * PUT /api/doctor/articles/:id
 */
const updateDoctorArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_published } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = req.file.path.startsWith('http') ? req.file.path : '/uploads/image/' + req.file.filename;
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const article = await prisma.article.findFirst({
      where: { id, doctor_id: doctorProfile.id },
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(image !== undefined && { image }),
        ...(is_published !== undefined && { is_published }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'تم تحديث المقال',
      data: updated,
    });
  } catch (error) {
    console.error('UpdateDoctorArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث المقال' });
  }
};

/**
 * DELETE /api/doctor/articles/:id
 */
const deleteDoctorArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const article = await prisma.article.findFirst({
      where: { id, doctor_id: doctorProfile.id },
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    await prisma.article.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'تم حذف المقال' });
  } catch (error) {
    console.error('DeleteDoctorArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حذف المقال' });
  }
};

/**
 * GET /api/doctor/articles (Doctor's own articles)
 */
const getMyArticles = async (req, res) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const articles = await prisma.article.findMany({
      where: { doctor_id: doctorProfile.id },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('GetMyArticles error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المقالات' });
  }
};

module.exports = { listArticles, getArticle, createDoctorArticle, updateDoctorArticle, deleteDoctorArticle, getMyArticles };
