/**
 * Doctor Profile Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id') || 1; // Default to 1 if testing directly
  
    // 2. Fetch mock Data
    loadDoctorDetails(docId);
  
    // 3. Set minimum date for booking
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }
  
    // 4. Time slot selection
    document.querySelectorAll('.slot:not(.disabled)').forEach(el => {
      el.addEventListener('click', (e) => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById('selectedSlot').value = e.target.textContent;
      });
    });
  
    // 5. Submit Booking
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
    } catch(err) {
      console.error(err);
      if(document.getElementById('docName')) {
        document.getElementById('docName').textContent = 'طبيب تجريبي';
      }
    }
  }
  
  async function handleBooking(e) {
    e.preventDefault();
  
    // Simulate API logic
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
