const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

// 1. إعداد المحول للاتصال بقاعدة البيانات محلياً
const adapter = new PrismaMariaDb({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'healthcare_db',
  port: 3306
});

// 2. إنشاء الكلاينت مع تمرير المحول وإعدادات الـ log الخاصة بك
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;