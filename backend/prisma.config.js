require('dotenv').config(); // أضفنا هذا السطر لقراءة محتويات ملف .env
const { defineConfig } = require('@prisma/config');

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});