const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

let storage;

if (isProduction) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'healthcare', // The folder name in your Cloudinary account
      resource_type: 'auto', // Allows uploading both images and videos
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        return file.fieldname + '-' + uniqueSuffix;
      }
    },
  });
} else {
  // Ensure upload directory exists
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const subDir = path.join(uploadDir, file.fieldname);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
      cb(null, subDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/webm', 'video/ogg'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. الأنواع المسموحة: الصور (JPEG, PNG)، الملفات (PDF, DOC)، والفيديوهات (MP4, WEBM)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

module.exports = upload;
