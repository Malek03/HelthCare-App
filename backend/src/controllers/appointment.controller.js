const prisma = require('../config/database');
const { sendPushNotification } = require('../services/notification.service');

/**
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, date_time, notes, reason } = req.body;

    if (!doctor_id || !date_time) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد الطبيب وموعد الحجز',
      });
    }

    // Verify doctor exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctor_id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!doctor || !doctor.is_active) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود أو غير متاح' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patient_id: req.user.id,
        doctor_id,
        date_time: new Date(date_time),
        notes,
        reason,
      },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    // Notify doctor
    await sendPushNotification(
      doctor.user.id,
      'حجز موعد جديد',
      `${req.user.name} قام بحجز موعد - ${new Date(date_time).toLocaleDateString('ar')}`,
      { type: 'NEW_APPOINTMENT', appointmentId: appointment.id }
    );

    return res.status(201).json({
      success: true,
      message: 'تم حجز الموعد بنجاح - بانتظار موافقة الطبيب',
      data: appointment,
    });
  } catch (error) {
    console.error('CreateAppointment error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في حجز الموعد' });
  }
};

/**
 * GET /api/appointments/my
 */
const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { patient_id: req.user.id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          doctor: {
            include: { user: { select: { name: true, avatar: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { appointments, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetMyAppointments error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المواعيد' });
  }
};

/**
 * GET /api/doctor/appointments (Doctor)
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const { status, page = 1, limit = 10 } = req.query;
    const where = { doctor_id: doctorProfile.id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, avatar: true, email: true } },
        },
        orderBy: { date_time: 'asc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { appointments, pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('GetDoctorAppointments error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المواعيد' });
  }
};

/**
 * PUT /api/doctor/appointments/:id (Accept/Reject)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    if (!['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { user_id: req.user.id },
    });

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctor_id: doctorProfile.id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(reject_reason && { reject_reason }),
      },
    });

    // Notify patient
    const notifType = status === 'ACCEPTED' ? 'APPOINTMENT_ACCEPTED' : 'APPOINTMENT_REJECTED';
    const notifTitle = status === 'ACCEPTED' ? 'تم قبول موعدك' : 'تم رفض موعدك';
    const notifBody = status === 'ACCEPTED'
      ? `تم قبول موعدك مع د. ${req.user.name}`
      : `تم رفض موعدك مع د. ${req.user.name}${reject_reason ? ' - السبب: ' + reject_reason : ''}`;

    await sendPushNotification(appointment.patient_id, notifTitle, notifBody, { type: notifType, appointmentId: id });

    return res.status(200).json({
      success: true,
      message: status === 'ACCEPTED' ? 'تم قبول الموعد' : 'تم تحديث حالة الموعد',
      data: updated,
    });
  } catch (error) {
    console.error('UpdateAppointmentStatus error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تحديث الموعد' });
  }
};

module.exports = { createAppointment, getMyAppointments, getDoctorAppointments, updateAppointmentStatus };
