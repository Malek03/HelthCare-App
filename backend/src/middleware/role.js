/**
 * Role-based Authorization Middleware
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'DOCTOR')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - يرجى تسجيل الدخول',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول لهذا المورد',
      });
    }

    next();
  };
};

module.exports = { authorize };
