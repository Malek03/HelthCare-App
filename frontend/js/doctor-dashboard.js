/**
 * Doctor Dashboard Logic
 * Handles: Auth guard, Dashboard stats, Profile editing, Schedule management
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Auth Guard
  // ==========================================
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== 'DOCTOR') {
    window.location.href = 'login.html';
    return;
  }

  // Set header info from localStorage immediately
  const nameEl = document.getElementById('doctorName');
  const storedName = localStorage.getItem('name');
  if (storedName && nameEl) {
    nameEl.textContent = 'د. ' + storedName;
  }

  // ==========================================
  // Sidebar Navigation
  // ==========================================
  const sidebarLinks = document.querySelectorAll('#sidebarMenu a[data-section]');
  const sections = document.querySelectorAll('.dashboard-section');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active from all
      sidebarLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Activate clicked
      link.classList.add('active');
      const targetId = link.getAttribute('data-section');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // ==========================================
  // Load Dashboard Data
  // ==========================================
  loadDashboard();
  loadSchedule();

  // ==========================================
  // Profile Form Submit
  // ==========================================
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProfile();
    });
  }

  // ==========================================
  // Schedule Save Button
  // ==========================================
  const btnSaveSchedule = document.getElementById('btnSaveSchedule');
  if (btnSaveSchedule) {
    btnSaveSchedule.addEventListener('click', async () => {
      await saveSchedule();
    });
  }
});

// ==========================================
// Load Dashboard Stats + Profile Data
// ==========================================
async function loadDashboard() {
  const statsGrid = document.getElementById('statsGrid');
  const specialtyEl = document.getElementById('doctorSpecialty');

  try {
    const res = await window.ApiService.getDoctorDashboard();

    if (res.success && res.data) {
      const { profile, stats } = res.data;

      // Update header specialty
      if (specialtyEl && profile.specialty) {
        specialtyEl.textContent = profile.specialty;
      }

      // Populate profile form
      populateProfileForm(profile);

      // Render stats
      renderStats(stats);
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    statsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="ph ph-warning-circle"></i>
        <p>تعذر تحميل البيانات. تأكد من اتصالك بالإنترنت.</p>
      </div>
    `;
  }
}

// ==========================================
// Render Stats Cards
// ==========================================
function renderStats(stats) {
  const statsGrid = document.getElementById('statsGrid');

  const statItems = [
    {
      key: 'totalAppointments',
      label: 'إجمالي المواعيد',
      icon: 'ph-calendar-check',
      colorClass: 'blue',
      cardClass: 'appointments',
    },
    {
      key: 'pendingAppointments',
      label: 'مواعيد معلقة',
      icon: 'ph-hourglass-medium',
      colorClass: 'orange',
      cardClass: 'pending-appointments',
    },
    {
      key: 'totalConsultations',
      label: 'إجمالي الاستشارات',
      icon: 'ph-chats',
      colorClass: 'purple',
      cardClass: 'consultations',
    },
    {
      key: 'pendingConsultations',
      label: 'استشارات معلقة',
      icon: 'ph-chat-dots',
      colorClass: 'teal',
      cardClass: 'pending-consultations',
    },
    {
      key: 'totalArticles',
      label: 'إجمالي المقالات',
      icon: 'ph-article',
      colorClass: 'green',
      cardClass: 'articles',
    },
  ];

  statsGrid.innerHTML = statItems.map(item => `
    <div class="stat-card ${item.cardClass}">
      <div class="stat-icon ${item.colorClass}">
        <i class="ph ${item.icon}"></i>
      </div>
      <div class="stat-number">${stats[item.key] ?? 0}</div>
      <div class="stat-label">${item.label}</div>
    </div>
  `).join('');
}

// ==========================================
// Populate Profile Form
// ==========================================
function populateProfileForm(profile) {
  const fields = {
    editSpecialty: profile.specialty || '',
    editPhone: profile.phone || '',
    editLocation: profile.location || '',
    editExperience: profile.experience_years || '',
    editQualifications: profile.qualifications || '',
    editBio: profile.bio || '',
  };

  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
}

// ==========================================
// Save Profile
// ==========================================
async function saveProfile() {
  const btn = document.getElementById('btnSaveProfile');
  const originalText = btn.innerHTML;

  try {
    btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="margin-left:8px;"></i> جاري الحفظ...';
    btn.disabled = true;

    const data = {
      specialty: document.getElementById('editSpecialty').value,
      phone: document.getElementById('editPhone').value,
      location: document.getElementById('editLocation').value,
      experience_years: document.getElementById('editExperience').value,
      qualifications: document.getElementById('editQualifications').value,
      bio: document.getElementById('editBio').value,
    };

    const res = await window.ApiService.updateDoctorProfile(data);

    if (res.success) {
      if (window.Toast) {
        window.Toast.show('تم بنجاح', 'تم تحديث بيانات الملف الشخصي', 'success');
      }

      // Update header
      const specialtyEl = document.getElementById('doctorSpecialty');
      if (specialtyEl && data.specialty) {
        specialtyEl.textContent = data.specialty;
      }
    }
  } catch (error) {
    console.error('Save profile error:', error);
    if (window.Toast) {
      window.Toast.show('خطأ', error.message || 'فشل في حفظ البيانات', 'error');
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ==========================================
// Load Schedule
// ==========================================
const DAYS_AR = [
  { key: 'SUNDAY', label: 'الأحد' },
  { key: 'MONDAY', label: 'الاثنين' },
  { key: 'TUESDAY', label: 'الثلاثاء' },
  { key: 'WEDNESDAY', label: 'الأربعاء' },
  { key: 'THURSDAY', label: 'الخميس' },
  { key: 'FRIDAY', label: 'الجمعة' },
  { key: 'SATURDAY', label: 'السبت' },
];

async function loadSchedule() {
  const grid = document.getElementById('scheduleGrid');

  try {
    const res = await window.ApiService.getDoctorSchedule();

    const existingSchedules = {};
    if (res.success && res.data) {
      res.data.forEach(s => {
        existingSchedules[s.day] = s;
      });
    }

    renderSchedule(existingSchedules);
  } catch (error) {
    console.error('Load schedule error:', error);
    renderSchedule({});
  }
}

function renderSchedule(existingSchedules) {
  const grid = document.getElementById('scheduleGrid');

  grid.innerHTML = DAYS_AR.map(day => {
    const existing = existingSchedules[day.key];
    const startTime = existing ? existing.start_time : '09:00';
    const endTime = existing ? existing.end_time : '17:00';
    const isActive = existing ? existing.is_active : false;
    const inactiveClass = isActive ? '' : 'inactive';

    return `
      <div class="schedule-day-row ${inactiveClass}" data-day="${day.key}" id="row-${day.key}">
        <div class="day-label">
          <i class="ph ph-calendar-blank"></i>
          ${day.label}
        </div>
        <input type="time" class="time-input" value="${startTime}" data-field="start_time" id="start-${day.key}">
        <input type="time" class="time-input" value="${endTime}" data-field="end_time" id="end-${day.key}">
        <label class="toggle-switch">
          <input type="checkbox" ${isActive ? 'checked' : ''} data-field="is_active" id="active-${day.key}"
                 onchange="toggleDayRow('${day.key}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }).join('');
}

// Toggle inactive style
function toggleDayRow(dayKey, isActive) {
  const row = document.getElementById('row-' + dayKey);
  if (row) {
    if (isActive) {
      row.classList.remove('inactive');
    } else {
      row.classList.add('inactive');
    }
  }
}

// ==========================================
// Save Schedule
// ==========================================
async function saveSchedule() {
  const btn = document.getElementById('btnSaveSchedule');
  const originalText = btn.innerHTML;

  try {
    btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="margin-left:8px;"></i> جاري الحفظ...';
    btn.disabled = true;

    const schedules = DAYS_AR.map(day => ({
      day: day.key,
      start_time: document.getElementById('start-' + day.key).value,
      end_time: document.getElementById('end-' + day.key).value,
      is_active: document.getElementById('active-' + day.key).checked,
    }));

    const res = await window.ApiService.updateDoctorSchedule(schedules);

    if (res.success) {
      if (window.Toast) {
        window.Toast.show('تم بنجاح', 'تم تحديث جدول مواعيد العمل', 'success');
      }
    }
  } catch (error) {
    console.error('Save schedule error:', error);
    if (window.Toast) {
      window.Toast.show('خطأ', error.message || 'فشل في حفظ جدول العمل', 'error');
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
