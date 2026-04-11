/**
 * Doctor Profile Logic
 */

const DEFAULT_ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&w=800&q=80';

const DAYS_AR_MAP = {
  SUNDAY: 'الأحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id') || 1;
  
    loadDoctorDetails(docId);
  
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }
  
    document.querySelectorAll('.slot:not(.disabled)').forEach(el => {
      el.addEventListener('click', (e) => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById('selectedSlot').value = e.target.textContent;
      });
    });
  
    const form = document.getElementById('bookingForm');
    if (form) {
      form.addEventListener('submit', handleBooking);
    }
  });
  
  async function loadDoctorDetails(id) {
    try {
      const res = await window.ApiService.getDoctorProfile(id);
      const doc = res.data;
      if(!doc) {
        document.getElementById('docName').textContent = 'غير متوفر';
        return;
      }
      const docName = doc.user?.name || doc.name || 'طبيب';
      const docImg = doc.profile_image || doc.image || '../backend/src/media/doc1.avif';
      const docRating = doc.rating || '5.0';
      const docExp = doc.experience_years || doc.experience || 0;
      const docLoc = doc.location || 'الرياض';

      document.getElementById('docName').textContent = docName;
      document.getElementById('docSpecialty').textContent = doc.specialty || 'غير محدد';
      document.getElementById('docExp').textContent = docExp;
      document.getElementById('docRating').textContent = docRating;
      document.getElementById('docLocation').textContent = docLoc;
      document.getElementById('docBio').textContent = doc.bio || 'لا توجد نبذة.';
      
      const imgEl = document.getElementById('docImg');
      if(imgEl) imgEl.src = docImg;

      // Render work schedule
      renderDoctorSchedule(doc.work_schedule || []);

      // Render articles
      renderDoctorArticles(doc.articles || []);

    } catch(err) {
      console.error(err);
      if(document.getElementById('docName')) {
        document.getElementById('docName').textContent = 'طبيب تجريبي';
      }
    }
  }

  function renderDoctorSchedule(schedule) {
    const container = document.getElementById('docSchedule');
    if (!container) return;

    if (!schedule || schedule.length === 0) {
      container.innerHTML = '<p class="body-md text-center text-muted py-4">لم يتم تحديد مواعيد العمل بعد.</p>';
      return;
    }

    container.innerHTML = schedule.map(s => {
      const dayName = DAYS_AR_MAP[s.day] || s.day;
      const startTime = s.start_time || '--:--';
      const endTime = s.end_time || '--:--';

      return `
        <div class="schedule-row">
          <span class="schedule-day"><i class="ph ph-calendar-blank"></i> ${dayName}</span>
          <span class="schedule-time" dir="ltr">${startTime} - ${endTime}</span>
        </div>
      `;
    }).join('');
  }

  function renderDoctorArticles(articles) {
    const container = document.getElementById('docArticles');
    if (!container) return;

    if (!articles || articles.length === 0) {
      container.innerHTML = '<div class="body-md text-center py-4 text-muted w-100" style="grid-column: span 2;">لا توجد مقالات منشورة حالياً</div>';
      return;
    }

    container.innerHTML = articles.map(art => {
      const dateStr = new Date(art.created_at).toLocaleDateString('ar-SA');
      const imageUrl = art.image ? window.ApiService.getImageUrl(art.image) : DEFAULT_ARTICLE_IMAGE;
      const detailURL = `article-detail.html?id=${art.id}`;

      return `
        <a href="${detailURL}" class="card p-0" style="display:flex; flex-direction:column; overflow:hidden; text-decoration:none; color:inherit; transition: transform 0.2s, box-shadow 0.2s;">
          <img src="${imageUrl}" style="width:100%; height:160px; object-fit:cover;" alt="${art.title}" onerror="this.src='${DEFAULT_ARTICLE_IMAGE}'">
          <div style="padding:16px;">
            <h4 class="headline-sm" style="font-size:0.95rem; margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${art.title}</h4>
            <span class="text-muted" style="font-size:0.8rem;">${dateStr}</span>
          </div>
        </a>
      `;
    }).join('');
  }
  
  async function handleBooking(e) {
    e.preventDefault();
  
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('selectedSlot').value;
    const notes = document.getElementById('bookReason').value;
    
    const btn = document.getElementById('btnBook');
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري إرسال الطلب...';
    btn.disabled = true;
  
    const fullNotes = `الزمن: ${time} | ` + notes;
    const dateTime = new Date(date).toISOString();
    
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    if (!localStorage.getItem('token')) {
      alert("الرجاء تسجيل الدخول أولاً لحجز الموعد");
      window.location.href = "login.html";
      return;
    }

    try {
      await window.ApiService.createAppointment(docId, dateTime, fullNotes, 'حجز عبر المنصة');
      document.getElementById('bookingForm').style.display = 'none';
      document.getElementById('bookingSuccess').style.display = 'block';
    } catch(err) {
      console.error(err);
      alert('تعذر إكمال الحجز: ' + err.message);
      btn.innerHTML = 'تأكيد الحجز';
      btn.disabled = false;
    }
  }

