const prisma = require('../config/database');
const { sendPushNotification, sendBroadcastNotification } = require('../services/notification.service');

// ==========================================
// Statistics
// ==========================================

/**
 * GET /api/admin/stats
 */
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalDoctors,
      totalAppointments,
      completedConsultations,
      pendingApplications,
      totalArticles,
      totalVideos,
      blockedArticles,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true, is_banned: false } }),
      prisma.user.count({ where: { is_banned: true } }),
      prisma.doctorProfile.count(),
      prisma.appointment.count(),
      prisma.consultation.count({ where: { status: 'ANSWERED' } }),
      prisma.doctorApplication.count({ where: { status: 'PENDING' } }),
      prisma.article.count(),
      prisma.video.count(),
      prisma.article.count({ where: { is_published: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalDoctors,
        totalAppointments,
        completedConsultations,
        pendingApplications,
        totalArticles,
        totalVideos,
        blockedArticles,
      },
    });
  } catch (error) {
    console.error('GetStats error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الإحصائيات' });
  }
};

// ==========================================
// User Management
// ==========================================

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        select: {
          id: true, name: true, email: true, role: true,
          avatar: true, is_banned: true, is_active: true, created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { users, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetUsers error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المستخدمين' });
  }
};

/**
 * PUT /api/admin/users/:id/ban
 */
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { is_banned: is_banned !== undefined ? is_banned : true },
      select: { id: true, name: true, is_banned: true },
    });

    return res.status(200).json({
      success: true,
      message: user.is_banned ? 'تم حظر المستخدم' : 'تم رفع الحظر',
      data: user,
    });
  } catch (error) {
    console.error('BanUser error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث حالة المستخدم' });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.status(200).json({ success: true, message: 'تم حذف المستخدم' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حذف المستخدم' });
  }
};

/**
 * PUT /api/admin/users/:id/promote
 * Directly promote a user to doctor (without application)
 */
const promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialty, qualifications, experience_years, phone, location, bio } = req.body;

    if (!specialty) {
      return res.status(400).json({ success: false, message: 'التخصص مطلوب' });
    }

    // Update role
    await prisma.user.update({
      where: { id },
      data: { role: 'DOCTOR' },
    });

    // Create doctor profile
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        user_id: id,
        specialty,
        qualifications,
        experience_years: experience_years ? parseInt(experience_years) : null,
        phone,
        location,
        bio,
      },
    });

    // Notify user
    await sendPushNotification(
      id,
      'تمت ترقية حسابك',
      'مبروك! تم ترقية حسابك إلى طبيب. يمكنك الآن الوصول للوحة التحكم الخاصة بك.',
      { type: 'DOCTOR_APPLICATION_APPROVED' }
    );

    return res.status(200).json({
      success: true,
      message: 'تمت ترقية المستخدم إلى طبيب',
      data: doctorProfile,
    });
  } catch (error) {
    console.error('PromoteUser error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في ترقية المستخدم' });
  }
};

// ==========================================
// Doctor Applications
// ==========================================

/**
 * GET /api/admin/applications
 */
const getApplications = async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;
    const where = {};
    if (status !== 'ALL') where.status = status;

    const [applications, total] = await Promise.all([
      prisma.doctorApplication.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.doctorApplication.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { applications, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetApplications error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الطلبات' });
  }
};

/**
 * PUT /api/admin/applications/:id
 * Approve or reject a doctor application
 */
const handleApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'الحالة يجب أن تكون APPROVED أو REJECTED' });
    }

    const application = await prisma.doctorApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    // Update application status
    await prisma.doctorApplication.update({
      where: { id },
      data: { status, admin_notes },
    });

    if (status === 'APPROVED') {
      // Promote user to doctor
      await prisma.user.update({
        where: { id: application.user_id },
        data: { role: 'DOCTOR' },
      });

      // Create doctor profile from application data
      await prisma.doctorProfile.create({
        data: {
          user_id: application.user_id,
          specialty: application.specialty,
          qualifications: application.qualifications,
          experience_years: application.experience_years,
          phone: application.phone,
          location: application.location,
          bio: application.bio,
        },
      });

      // Notify user
      await sendPushNotification(
        application.user_id,
        'تمت الموافقة على طلبك',
        'مبروك! تمت الموافقة على طلب انضمامك كطبيب. يمكنك الآن الوصول للوحة التحكم.',
        { type: 'DOCTOR_APPLICATION_APPROVED' }
      );
    } else {
      // Rejected
      await sendPushNotification(
        application.user_id,
        'تم رفض طلبك',
        admin_notes ? `تم رفض طلب الانضمام. السبب: ${admin_notes}` : 'تم رفض طلب الانضمام كطبيب.',
        { type: 'DOCTOR_APPLICATION_REJECTED' }
      );
    }

    return res.status(200).json({
      success: true,
      message: status === 'APPROVED' ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب',
    });
  } catch (error) {
    console.error('HandleApplication error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في معالجة الطلب' });
  }
};

// ==========================================
// Doctor Management
// ==========================================

/**
 * GET /api/admin/doctors
 */
const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true, is_banned: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.doctorProfile.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { doctors, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetDoctors error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الأطباء' });
  }
};

/**
 * DELETE /api/admin/doctors/:id
 * Remove doctor role (demote back to user)
 */
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id },
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    // Delete doctor profile
    await prisma.doctorProfile.delete({ where: { id } });

    // Demote user back to USER
    await prisma.user.update({
      where: { id: doctorProfile.user_id },
      data: { role: 'USER' },
    });

    return res.status(200).json({ success: true, message: 'تم حذف الطبيب وإعادته كمستخدم عادي' });
  } catch (error) {
    console.error('DeleteDoctor error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حذف الطبيب' });
  }
};

// ==========================================
// Content Management
// ==========================================

/**
 * GET /api/admin/articles
 */
const getAdminArticles = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const where = {};

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
    console.error('GetAdminArticles error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المقالات' });
  }
};

/**
 * POST /api/admin/articles
 */
const createArticle = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'العنوان والمحتوى مطلوبان' });
    }

    const article = await prisma.article.create({
      data: { title, content, image, admin_id: req.user.id },
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة المقال',
      data: article,
    });
  } catch (error) {
    console.error('CreateArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إضافة المقال' });
  }
};

/**
 * POST /api/admin/videos
 */
const createVideo = async (req, res) => {
  try {
    const { title, url, description, thumbnail } = req.body;
    
    let finalUrl = url;
    if (req.file) {
      // If a file was uploaded, construct its URL
      finalUrl = `/uploads/${req.file.fieldname}/${req.file.filename}`;
    }

    if (!title || !finalUrl) {
      return res.status(400).json({ success: false, message: 'العنوان ورابط/ملف الفيديو مطلوبان' });
    }

    const video = await prisma.video.create({
      data: { title, url: finalUrl, description, thumbnail, admin_id: req.user.id },
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة الفيديو',
      data: video,
    });
  } catch (error) {
    console.error('CreateVideo error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إضافة الفيديو' });
  }
};

/**
 * POST /api/admin/health-tips
 */
const createHealthTip = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'محتوى النصيحة مطلوب' });
    }

    const tip = await prisma.healthTip.create({
      data: { content, admin_id: req.user.id },
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة النصيحة',
      data: tip,
    });
  } catch (error) {
    console.error('CreateHealthTip error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إضافة النصيحة' });
  }
};

/**
 * POST /api/admin/health-tips/:id/send
 * Send health tip as push notification to all users
 */
const sendHealthTip = async (req, res) => {
  try {
    const { id } = req.params;

    const tip = await prisma.healthTip.findUnique({ where: { id } });
    if (!tip) {
      return res.status(404).json({ success: false, message: 'النصيحة غير موجودة' });
    }

    // Send broadcast notification
    await sendBroadcastNotification('💡 نصيحة صحية', tip.content, 'HEALTH_TIP');

    // Mark as sent
    await prisma.healthTip.update({
      where: { id },
      data: { is_sent: true, sent_at: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'تم إرسال النصيحة كإشعار لجميع المستخدمين',
    });
  } catch (error) {
    console.error('SendHealthTip error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إرسال النصيحة' });
  }
};

/**
 * GET /api/admin/health-tips
 */
const getHealthTips = async (req, res) => {
  try {
    const tips = await prisma.healthTip.findMany({
      orderBy: { created_at: 'desc' },
      include: { admin: { select: { name: true } } },
    });

    return res.status(200).json({ success: true, data: tips });
  } catch (error) {
    console.error('GetHealthTips error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب النصائح' });
  }
};

/**
 * PUT /api/admin/articles/:id
 */
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (req.file) {
      updateData.image = `/uploads/${req.file.fieldname}/${req.file.filename}`;
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ success: true, message: 'تم تحديث المقال', data: article });
  } catch (error) {
    console.error('UpdateArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث المقال' });
  }
};

/**
 * DELETE /api/admin/articles/:id
 */
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.article.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'تم حذف المقال' });
  } catch (error) {
    console.error('DeleteArticle error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حذف المقال' });
  }
};

/**
 * PUT /api/admin/videos/:id
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description, thumbnail } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

    let finalUrl = url;
    if (req.file) {
      finalUrl = `/uploads/${req.file.fieldname}/${req.file.filename}`;
    }
    if (finalUrl) updateData.url = finalUrl;

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ success: true, message: 'تم تحديث الفيديو', data: video });
  } catch (error) {
    console.error('UpdateVideo error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث الفيديو' });
  }
};

/**
 * DELETE /api/admin/videos/:id
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.video.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'تم حذف الفيديو' });
  } catch (error) {
    console.error('DeleteVideo error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حذف الفيديو' });
  }
};

/**
 * PUT /api/admin/articles/:id/toggle-publish
 */
const toggleArticlePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    
    const article = await prisma.article.update({
      where: { id },
      data: { is_published: is_published !== undefined ? is_published : false },
    });

    return res.status(200).json({ success: true, message: article.is_published ? 'تم إظهار المقال' : 'تم حظر (إخفاء) المقال' });
  } catch (error) {
    console.error('ToggleArticlePublish error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تغيير حالة المقال' });
  }
};

module.exports = {
  getStats,
  getUsers, banUser, deleteUser, promoteUser,
  getApplications, handleApplication,
  getDoctors, deleteDoctor,
  getAdminArticles, createArticle, updateArticle, deleteArticle, toggleArticlePublish,
  createVideo, updateVideo, deleteVideo,
  createHealthTip, sendHealthTip, getHealthTips,
};
