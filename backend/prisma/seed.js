require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcryptjs');

// 1. إعداد المحول الخاص بـ Prisma 7 (متوافق مع MySQL في XAMPP)
const adapter = new PrismaMariaDb({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'healthcare_db',
  port: 3306
});

// 2. تمرير المحول للكلاينت
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create an Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medicalplatform.com' },
    update: {},
    create: {
      email: 'admin@medicalplatform.com',
      name: 'مدير المنصة',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  // 2. Seed Videos
  const videos = [
    { title: 'أهمية شرب الماء لصحة الكلى', url: 'https://youtube.com', description: 'فيديو توعوي مدته 03:45', thumbnail: '../backend/src/media/vid1.avif', admin_id: admin.id },
    { title: 'كيف تحسن جودة نومك بسهولة', url: 'https://youtube.com', description: 'فيديو توعوي مدته 05:20', thumbnail: '../backend/src/media/vid1.avif', admin_id: admin.id },
    { title: 'الرياضة والضغط: ماذا يجب أن تعرف', url: 'https://youtube.com', description: 'فيديو توعوي مدته 08:15', thumbnail: '../backend/src/media/vid1.avif', admin_id: admin.id },
    { title: 'الغذاء السليم لتقوية المناعة', url: 'https://youtube.com', description: 'فيديو توعوي مدته 04:30', thumbnail: '../backend/src/media/vid1.avif', admin_id: admin.id },
  ];

  for (const v of videos) {
    await prisma.video.create({ data: v });
  }
  console.log('✅ Videos seeded');

  // 3. Seed Articles
  const articles = [
    { title: 'أعراض نقص فيتامين د وطرق علاجه', content: 'نقص فيتامين د هو مشكلة شائعة تؤثر على العظام والمناعة... (هذا محتوى تجريبي للمقال)', image: '../backend/src/media/article1.avif', admin_id: admin.id },
    { title: 'العلاقة بين التوتر وأمراض القلب التاجية', content: 'يسهم التوتر المزمن في رفع ضغط الدم وزيادة ضغط العمل على عضلة القلب...', image: '../backend/src/media/article2.avif', admin_id: admin.id },
    { title: 'الطريقة الصحيحة لاستخدام أجهزة قياس الضغط', content: 'يجب الجلوس باسترخاء لمدة 5 دقائق قبل القياس وضع الذراع بمستوى القلب...', image: '../backend/src/media/article3.avif', admin_id: admin.id },
  ];

  for (const a of articles) {
    await prisma.article.create({ data: a });
  }
  console.log('✅ Articles seeded');

  // 4. Seed Doctors
  const doctorImages = [
    '../backend/src/media/doc1.avif',
    '../backend/src/media/doc2.avif',
    '../backend/src/media/doc3.avif',
    '../backend/src/media/doc4.avif'
  ];
  
  const doctorNames = ['أحمد خالد', 'سارة محمد', 'محمود علي', 'فاطمة صالح', 'حسن عبدالرحمن', 'نورة السعيد', 'فيصل عبدالله'];
  const specialties = ['طب عام', 'قلب وأوعية دموية', 'أطفال', 'جلدية', 'باطنة', 'أسنان', 'نساء وتوليد'];
  const locations = ['الرياض, مستشفى المملكة', 'جدة, عيادات النخبة', 'الدمام, مجمع الشفاء', 'مكة, المستشفى العام'];

  const doctorPassword = await bcrypt.hash('doctor123', 10);

  for (let i = 0; i < 10; i++) {
    const name = doctorNames[i % doctorNames.length];
    const email = `doctor${i}@medicalplatform.com`;
    const image = doctorImages[i % doctorImages.length];
    const specialty = specialties[i % specialties.length];
    const location = locations[i % locations.length];
    const experience = Math.floor(Math.random() * 15) + 3;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `دكتور ${name}`,
        password: doctorPassword,
        role: 'DOCTOR',
        avatar: image,
      },
    });

    await prisma.doctorProfile.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        specialty: specialty,
        qualifications: 'بورد عربي في ' + specialty,
        experience_years: experience,
        phone: '05' + Math.floor(10000000 + Math.random() * 90000000),
        location: location,
        bio: `أنا الدكتور ${name} متخصص في ${specialty}. لدي خبرة تمتد لـ ${experience} سنوات.`,
      },
    });
  }
  console.log(' 10 Doctors seeded with profiles');

  // 5. Seed A Basic User
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'محمد المريض',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log(' Basic test user seeded');

  console.log(' Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });