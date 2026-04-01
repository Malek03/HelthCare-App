const prisma = require('../config/database');
const { sendPushNotification } = require('../services/notification.service');

/**
 * POST /api/consultations
 */
const createConsultation = async (req, res) => {
  try {
    const { doctor_id, question } = req.body;

    if (!doctor_id || !question) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد الطبيب وكتابة السؤال',
      });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctor_id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    const consultation = await prisma.consultation.create({
      data: {
        patient_id: req.user.id,
        doctor_id,
        question,
      },
    });

    // Notify doctor
    await sendPushNotification(
      doctor.user.id,
      'استفسار جديد',
      `${req.user.name} أرسل لك استفساراً طبياً`,
      { type: 'NEW_CONSULTATION', consultationId: consultation.id }
    );

    return res.status(201).json({
      success: true,
      message: 'تم إرسال الاستفسار بنجاح',
      data: consultation,
    });
  } catch (error) {
    console.error('CreateConsultation error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إرسال الاستفسار' });
  }
};

/**
 * GET /api/consultations/my
 */
const getMyConsultations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where: { patient_id: req.user.id },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          doctor: {
            include: { user: { select: { name: true, avatar: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.consultation.count({ where: { patient_id: req.user.id } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { consultations, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetMyConsultations error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الاستشارات' });
  }
};

/**
 * GET /api/doctor/consultations
 */
const getDoctorConsultations = async (req, res) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const { status, page = 1, limit = 10 } = req.query;
    const where = { doctor_id: doctorProfile.id };
    if (status) where.status = status;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.consultation.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { consultations, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetDoctorConsultations error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب الاستشارات' });
  }
};

/**
 * PUT /api/doctor/consultations/:id
 * Doctor answers a consultation
 */
const answerConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ success: false, message: 'يرجى كتابة الرد' });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const consultation = await prisma.consultation.findFirst({
      where: { id, doctor_id: doctorProfile.id },
    });

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'الاستشارة غير موجودة' });
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: { answer, status: 'ANSWERED' },
    });

    // Notify patient
    await sendPushNotification(
      consultation.patient_id,
      'تم الرد على استفسارك',
      `د. ${req.user.name} أجاب على استفسارك`,
      { type: 'CONSULTATION_ANSWERED', consultationId: id }
    );

    return res.status(200).json({
      success: true,
      message: 'تم إرسال الرد بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('AnswerConsultation error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إرسال الرد' });
  }
};

module.exports = { createConsultation, getMyConsultations, getDoctorConsultations, answerConsultation };
