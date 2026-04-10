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
  loadAppointments();
  loadMyArticles();
  setupArticleForm();

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

// ==========================================
// Load Appointments
// ==========================================
async function loadAppointments() {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;

  try {
    const res = await window.ApiService.getDoctorAppointments(1, 50, ''); // Load recent 50

    if (res.success && res.data) {
      renderAppointments(res.data.appointments);
    }
  } catch (error) {
    console.error('Load appointments error:', error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">فشل تحميل المواعيد</td></tr>`;
  }
}

function renderAppointments(appointments) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;

  if (!appointments || appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">لا توجد مواعيد محجوزة</td></tr>`;
    return;
  }

  tbody.innerHTML = appointments.map(app => {
    let statusBadge = '';
    let actions = '';

    const dt = new Date(app.date_time);
    const dateStr = dt.toLocaleDateString('ar-SA');
    const timeStr = dt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    if (app.status === 'PENDING') {
      statusBadge = '<span class="status-badge status-pending">قيد الانتظار</span>';
      actions = `
        <button class="btn btn-primary" style="height:32px; padding:0 12px; font-size:0.8rem;" onclick="updateApptStatus('${app.id}', 'ACCEPTED')">قبول</button>
        <button class="btn btn-outline" style="height:32px; padding:0 12px; font-size:0.8rem; color:var(--sys-color-error); border-color:var(--sys-color-error);" onclick="promptRejectAppt('${app.id}')">رفض</button>
      `;
    } else if (app.status === 'ACCEPTED') {
      statusBadge = '<span class="status-badge status-approved">مؤكد</span>';
      actions = `
        <button class="btn btn-outline" style="height:32px; padding:0 12px; font-size:0.8rem; color:var(--sys-color-error); border-color:var(--sys-color-error);" onclick="promptRejectAppt('${app.id}', 'CANCELLED')">إلغاء</button>
      `;
    } else if (app.status === 'REJECTED') {
      statusBadge = '<span class="status-badge status-cancelled">مرفوض</span>';
      actions = '-';
    } else if (app.status === 'CANCELLED') {
      statusBadge = '<span class="status-badge status-cancelled">ملغي</span>';
      actions = '-';
    } else {
      statusBadge = `<span class="status-badge status-approved">${app.status}</span>`;
      actions = '-';
    }

    const patientName = app.patient?.name || 'غير معروف';
    const reason = app.reason || 'لا يوجد';

    return `
      <tr>
        <td><strong>${patientName}</strong></td>
        <td dir="ltr" style="text-align:right;">${timeStr} <br> <span class="text-muted" style="font-size:0.8rem">${dateStr}</span></td>
        <td>${reason}</td>
        <td>${statusBadge}</td>
        <td><div style="display:flex; gap:8px;">${actions}</div></td>
      </tr>
    `;
  }).join('');
}

window.promptRejectAppt = function(id, requestedStatus = 'REJECTED') {
  const reason = prompt(requestedStatus === 'REJECTED' ? "يرجى كتابة سبب الرفض (اختياري):" : "يرجى كتابة سبب الإلغاء (اختياري):");
  if (reason !== null) {
    updateApptStatus(id, requestedStatus, reason);
  }
}

window.updateApptStatus = async function(id, status, rejectReason = '') {
  try {
    const res = await window.ApiService.updateDoctorAppointmentStatus(id, status, rejectReason);
    if (res.success) {
      if (window.Toast) {
        window.Toast.show('تم التحديث', 'تم تحديث حالة الموعد بنجاح.', 'success');
      }
      // Reload appointments and dashboard stats
      loadAppointments();
      loadDashboard();
    }
  } catch (error) {
    console.error('Update appointment error:', error);
    if (window.Toast) {
      window.Toast.show('خطأ', error.message || 'فشل تحديث حالة الموعد', 'error');
    }
  }
};

// ==========================================
// Doctor Articles Logic
// ==========================================
function setupArticleForm() {
  const form = document.getElementById('doctorArticleForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveArticle();
    });
  }
}

async function loadMyArticles() {
  const container = document.getElementById('doctorArticlesGrid');
  if (!container) return;

  try {
    const res = await window.ApiService.getMyArticles();
    if (res.success && res.data) {
      renderMyArticles(res.data);
    }
  } catch (error) {
    console.error('Load articles error:', error);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="ph ph-warning-circle"></i>
        <p>تعذر تحميل المقالات المنشورة.</p>
      </div>`;
  }
}

function renderMyArticles(articles) {
  const container = document.getElementById('doctorArticlesGrid');
  if (!container) return;

  if (!articles || articles.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="ph ph-article"></i>
        <p>لم تقم بنشر أي مقالات بعد.</p>
      </div>`;
    return;
  }

  container.innerHTML = articles.map(art => {
    const dateStr = new Date(art.created_at).toLocaleDateString('ar-SA');
    return `
      <div class="card p-0" style="display:flex; flex-direction:column; overflow:hidden;">
        ${art.image ? `<img src="${art.image}" style="width:100%; height:160px; object-fit:cover;" alt="صورة المقال">` : `<div style="width:100%; height:160px; background:var(--sys-color-surface-container); display:flex; align-items:center; justify-content:center;"><i class="ph ph-image text-muted" style="font-size:3rem;"></i></div>`}
        <div style="padding:16px; flex-grow:1; display:flex; flex-direction:column;">
          <h3 class="headline-sm mb-2" style="font-size:1rem; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${art.title}</h3>
          <p class="text-muted" style="font-size:0.8rem; margin-bottom:12px;">نُشر في: <span dir="ltr">${dateStr}</span></p>
          <div class="mt-auto d-flex justify-between" style="border-top:1px solid var(--sys-color-surface-variant); padding-top:12px;">
            <button class="btn btn-outline" style="height:32px; padding:0 12px; font-size:0.8rem;" onclick='editArticle(${JSON.stringify(art).replace(/'/g, "&#39;")})'><i class="ph ph-pencil-simple"></i> تعديل</button>
            <button class="btn btn-outline" style="height:32px; padding:0 12px; font-size:0.8rem; color:var(--sys-color-error); border-color:var(--sys-color-error);" onclick="deleteArticle('${art.id}')"><i class="ph ph-trash"></i> حذف</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.showArticleForm = function() {
  document.getElementById('articlesListContainer').style.display = 'none';
  document.getElementById('articleFormContainer').style.display = 'block';
  document.getElementById('articleFormTitle').textContent = 'كتابة مقال جديد';
  document.getElementById('doctorArticleForm').reset();
  document.getElementById('articleId').value = '';
};

window.hideArticleForm = function() {
  document.getElementById('articleFormContainer').style.display = 'none';
  document.getElementById('articlesListContainer').style.display = 'block';
};

window.editArticle = function(article) {
  document.getElementById('articlesListContainer').style.display = 'none';
  document.getElementById('articleFormContainer').style.display = 'block';
  document.getElementById('articleFormTitle').textContent = 'تعديل المقال';
  
  document.getElementById('articleId').value = article.id;
  document.getElementById('articleTitle').value = article.title;
  document.getElementById('articleImage').value = article.image || '';
  document.getElementById('articleContent').value = article.content;
};

async function saveArticle() {
  const btn = document.getElementById('btnSaveArticle');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="margin-left:8px;"></i> جاري الحفظ...';
    btn.disabled = true;

    const id = document.getElementById('articleId').value;
    const data = {
      title: document.getElementById('articleTitle').value,
      image: document.getElementById('articleImage').value || null,
      content: document.getElementById('articleContent').value,
    };

    let res;
    if (id) {
      res = await window.ApiService.updateDoctorArticle(id, data);
    } else {
      res = await window.ApiService.createDoctorArticle(data);
    }

    if (res.success) {
      if (window.Toast) {
        window.Toast.show('تم بنجاح', id ? 'تم تحديث المقال' : 'تم نشر المقال بنجاح', 'success');
      }
      hideArticleForm();
      loadMyArticles();
      loadDashboard();
    }
  } catch (error) {
    console.error('Save article error:', error);
    if (window.Toast) {
      window.Toast.show('خطأ', error.message || 'فشل حفظ المقال', 'error');
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.deleteArticle = async function(id) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المقال بصورة نهائية؟')) return;
  
  try {
    const res = await window.ApiService.deleteDoctorArticle(id);
    if (res.success) {
      if (window.Toast) window.Toast.show('تم الحذف', 'تم حذف المقال بنجاح', 'success');
      loadMyArticles();
      loadDashboard();
    }
  } catch (error) {
    console.error('Delete article error:', error);
    if (window.Toast) {
      window.Toast.show('خطأ', error.message || 'فشل حذف المقال', 'error');
    }
  }
};
