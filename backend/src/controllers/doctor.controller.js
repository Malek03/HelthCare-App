const prisma = require('../config/database');
const { sendPushNotification } = require('../services/notification.service');

/**
 * GET /api/doctors
 * List all active doctors with optional specialty filter
 */
const listDoctors = async (req, res) => {
  try {
    const { specialty, search, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { is_active: true };
    if (specialty) where.specialty = specialty;
    if (search) {
      where.OR = [
        { specialty: { contains: search } },
        { user: { name: { contains: search } } },
        { location: { contains: search } },
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('ListDoctors error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب قائمة الأطباء' });
  }
};

/**
 * GET /api/doctors/:id
 * Get doctor profile with articles
 */
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        work_schedule: { where: { is_active: true }, orderBy: { day: 'asc' } },
        articles: {
          where: { is_published: true },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error('GetDoctorProfile error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب بيانات الطبيب' });
  }
};

/**
 * POST /api/doctors/apply
 * Apply to become a doctor
 */
const applyAsDoctor = async (req, res) => {
  try {
    // Check existing application
    const existingApp = await prisma.doctorApplication.findUnique({
      where: { user_id: req.user.id },
    });

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: existingApp.status === 'PENDING'
          ? 'لديك طلب قيد المراجعة'
          : 'تم معالجة طلبك مسبقاً',
        data: { status: existingApp.status },
      });
    }

    if (req.user.role === 'DOCTOR') {
      return res.status(400).json({ success: false, message: 'أنت طبيب بالفعل' });
    }

    const { full_name, specialty, qualifications, experience_years, phone, location, bio } = req.body;

    if (!full_name || !specialty || !qualifications || !experience_years || !phone) {
      return res.status(400).json({
        success: false,
        message: 'الحقول المطلوبة: الاسم الكامل، التخصص، المؤهلات، سنوات الخبرة، الهاتف',
      });
    }

    let personal_photo_url = null;
    let documents_url = null;

    if (req.files) {
      if (req.files.personal_photo && req.files.personal_photo[0]) {
        const file = req.files.personal_photo[0];
        personal_photo_url = file.path.startsWith('http') ? file.path : '/uploads/personal_photo/' + file.filename;
      }
      if (req.files.documents && req.files.documents[0]) {
        const file = req.files.documents[0];
        documents_url = file.path.startsWith('http') ? file.path : '/uploads/documents/' + file.filename;
      }
    }

    const application = await prisma.doctorApplication.create({
      data: {
        user_id: req.user.id,
        full_name,
        specialty,
        qualifications,
        experience_years: parseInt(experience_years),
        phone,
        location,
        bio,
        personal_photo: personal_photo_url,
        documents_url: documents_url,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await sendPushNotification(
        admin.id,
        'طلب انضمام طبيب جديد',
        `${full_name} يطلب الانضمام كطبيب - تخصص: ${specialty}`,
        { type: 'SYSTEM' }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'تم إرسال طلب الانضمام بنجاح - سيتم مراجعته من الإدارة',
      data: application,
    });
  } catch (error) {
    console.error('ApplyAsDoctor error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إرسال الطلب' });
  }
};

/**
 * GET /api/doctors/application-status
 */
const getApplicationStatus = async (req, res) => {
  try {
    const application = await prisma.doctorApplication.findUnique({
      where: { user_id: req.user.id },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'لم يتم تقديم طلب انضمام' });
    }

    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error('GetApplicationStatus error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب حالة الطلب' });
  }
};

// ==========================================
// Doctor Dashboard endpoints
// ==========================================

/**
 * GET /api/doctor/dashboard
 */
const getDoctorDashboard = async (req, res) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'ملف الطبيب غير موجود' });
    }

    const [
      totalAppointments,
      pendingAppointments,
      totalConsultations,
      pendingConsultations,
      totalArticles,
      blockedArticles
    ] = await Promise.all([
      prisma.appointment.count({ where: { doctor_id: doctorProfile.id } }),
      prisma.appointment.count({ where: { doctor_id: doctorProfile.id, status: 'PENDING' } }),
      prisma.consultation.count({ where: { doctor_id: doctorProfile.id } }),
      prisma.consultation.count({ where: { doctor_id: doctorProfile.id, status: 'PENDING' } }),
      prisma.article.count({ where: { doctor_id: doctorProfile.id } }),
      prisma.article.count({ where: { doctor_id: doctorProfile.id, is_published: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        profile: doctorProfile,
        stats: {
          totalAppointments,
          pendingAppointments,
          totalConsultations,
          pendingConsultations,
          totalArticles,
          blockedArticles,
        },
      },
    });
  } catch (error) {
    console.error('GetDoctorDashboard error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب لوحة التحكم' });
  }
};

/**
 * PUT /api/doctor/profile
 */
const updateDoctorProfile = async (req, res) => {
  try {
    const { specialty, bio, phone, location, qualifications, experience_years, profile_image } = req.body;

    const doctorProfile = await prisma.doctorProfile.update({
      where: { user_id: req.user.id },
      data: {
        ...(specialty && { specialty }),
        ...(bio !== undefined && { bio }),
        ...(phone && { phone }),
        ...(location && { location }),
        ...(qualifications && { qualifications }),
        ...(experience_years && { experience_years: parseInt(experience_years) }),
        ...(profile_image && { profile_image }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'تم تحديث معلومات الطبيب',
      data: doctorProfile,
    });
  } catch (error) {
    console.error('UpdateDoctorProfile error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في التحديث' });
  }
};

/**
 * GET /api/doctor/schedule
 */
const getSchedule = async (req, res) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const schedules = await prisma.workSchedule.findMany({
      where: { doctor_id: doctorProfile.id },
      orderBy: { day: 'asc' },
    });

    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error('GetSchedule error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب مواعيد العمل' });
  }
};

/**
 * POST /api/doctor/schedule
 */
const updateSchedule = async (req, res) => {
  try {
    const { schedules } = req.body; // Array of { day, start_time, end_time, is_active }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'ملف الطبيب غير موجود' });
    }

    // Upsert each schedule
    const results = [];
    for (const schedule of schedules) {
      const result = await prisma.workSchedule.upsert({
        where: {
          doctor_id_day: { doctor_id: doctorProfile.id, day: schedule.day },
        },
        update: {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_active: schedule.is_active !== undefined ? schedule.is_active : true,
        },
        create: {
          doctor_id: doctorProfile.id,
          day: schedule.day,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_active: schedule.is_active !== undefined ? schedule.is_active : true,
        },
      });
      results.push(result);
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث مواعيد العمل',
      data: results,
    });
  } catch (error) {
    console.error('UpdateSchedule error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث مواعيد العمل' });
  }
};

module.exports = {
  listDoctors,
  getDoctorProfile,
  applyAsDoctor,
  getApplicationStatus,
  getDoctorDashboard,
  updateDoctorProfile,
  getSchedule,
  updateSchedule,
};
