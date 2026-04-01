const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة (الاسم، البريد، كلمة المرور)',
      });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    });

    // Generate token
    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: { user, token },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إنشاء الحساب' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد وكلمة المرور مطلوبان',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'تم حظر حسابك - تواصل مع الإدارة',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
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
        doctor_profile: req.user.role === 'DOCTOR' ? {
          select: { id: true, specialty: true, bio: true, profile_image: true },
        } : false,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
};

/**
 * PUT /api/auth/update-fcm
 */
const updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcm_token },
    });

    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الإشعارات',
    });
  } catch (error) {
    console.error('Update FCM error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في التحديث' });
  }
};

module.exports = { register, login, getMe, updateFcmToken };
