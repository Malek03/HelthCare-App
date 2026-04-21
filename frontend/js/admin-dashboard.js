/**
 * Admin Dashboard Logic
 * Handles: Auth guard, Stats, User management, Applications, Doctors,
 *          Articles, Videos, Health Tips
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Auth Guard - ADMIN only
  // ==========================================
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== 'ADMIN') {
    window.location.href = 'login.html';
    return;
  }

  // Set admin name from localStorage
  const nameEl = document.getElementById('adminName');
  const storedName = localStorage.getItem('name');
  if (storedName && nameEl) {
    nameEl.textContent = storedName;
  }

  // ==========================================
  // Sidebar Navigation
  // ==========================================
  const sidebarLinks = document.querySelectorAll('#sidebarMenu a[data-section]');
  const sections = document.querySelectorAll('.dashboard-section');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sidebarLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      const targetId = link.getAttribute('data-section');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // ==========================================
  // Initial Data Load
  // ==========================================
  loadStats();
  loadUsers();
  loadApplications('PENDING');
  loadDoctors();
  loadHealthTips();
  loadArticles();
  loadVideos();

  // ==========================================
  // Form Handlers
  // ==========================================
  document.getElementById('adminArticleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveArticle();
  });

  document.getElementById('adminVideoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveVideo();
  });

  document.getElementById('healthTipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTip();
  });

  document.getElementById('promoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitPromotion();
  });

  // Search on Enter key
  document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUsers();
  });
});

// ==========================================
// SECTION 1: Stats
// ==========================================
async function loadStats() {
  const grid = document.getElementById('statsGrid');
  try {
    const res = await ApiService.getAdminStats();
    if (res.success && res.data) {
      renderStats(res.data);
    }
  } catch (error) {
    console.error('Stats error:', error);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="ph ph-warning-circle"></i><p>تعذر تحميل الإحصائيات</p></div>`;
  }
}

function renderStats(data) {
  const grid = document.getElementById('statsGrid');
  const items = [
    { key: 'totalUsers',              label: 'إجمالي المستخدمين',  icon: 'ph-users',            color: 'blue',   card: 'users' },
    { key: 'activeUsers',             label: 'المستخدمون النشطون', icon: 'ph-user-check',       color: 'green',  card: 'active-users' },
    { key: 'bannedUsers',             label: 'المحظورون',          icon: 'ph-prohibit',         color: 'red',    card: 'banned' },
    { key: 'totalDoctors',            label: 'الأطباء',            icon: 'ph-stethoscope',      color: 'purple', card: 'doctors' },
    { key: 'totalAppointments',       label: 'المواعيد',           icon: 'ph-calendar-check',   color: 'cyan',   card: 'appointments' },
    { key: 'completedConsultations',  label: 'استشارات مكتملة',    icon: 'ph-chat-circle-check',color: 'teal',   card: 'consultations' },
    { key: 'pendingApplications',     label: 'طلبات معلقة',        icon: 'ph-hourglass-medium', color: 'orange', card: 'pending-apps' },
    { key: 'totalArticles',           label: 'المقالات',           icon: 'ph-article',          color: 'indigo', card: 'articles' },
    { key: 'totalVideos',             label: 'الفيديوهات',         icon: 'ph-video',            color: 'pink',   card: 'videos' },
  ];

  grid.innerHTML = items.map(item => `
    <div class="stat-card ${item.card}">
      <div class="stat-icon ${item.color}"><i class="ph ${item.icon}"></i></div>
      <div class="stat-number">${data[item.key] ?? 0}</div>
      <div class="stat-label">${item.label}</div>
    </div>
  `).join('');
}

// ==========================================
// SECTION 2: Users Management
// ==========================================
let usersCurrentPage = 1;

window.searchUsers = function() {
  usersCurrentPage = 1;
  loadUsers();
};

async function loadUsers(page = 1) {
  usersCurrentPage = page;
  const tbody = document.getElementById('usersTableBody');
  const search = document.getElementById('userSearchInput').value.trim();
  const role = document.getElementById('userRoleFilter').value;

  tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;"><i class="ph ph-spinner" style="animation:spin 1s linear infinite;font-size:1.5rem;color:var(--sys-color-primary);"></i></td></tr>`;

  try {
    const res = await ApiService.getAdminUsers(page, 15, search, role);
    if (res.success && res.data) {
      renderUsersTable(res.data.users);
      renderPagination('usersPagination', res.data.pagination, loadUsers);
    }
  } catch (error) {
    console.error('Users error:', error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">فشل تحميل المستخدمين</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">لا يوجد مستخدمون</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const date = new Date(u.created_at).toLocaleDateString('ar-SA');
    const roleBadge = u.role === 'ADMIN' ? '<span class="role-badge role-admin">مدير</span>'
      : u.role === 'DOCTOR' ? '<span class="role-badge role-doctor">طبيب</span>'
      : '<span class="role-badge role-user">مستخدم</span>';
    const statusBadge = u.is_banned
      ? '<span class="status-badge status-banned">محظور</span>'
      : '<span class="status-badge status-active">نشط</span>';

    let actions = '<div class="actions-cell">';
    if (u.role !== 'ADMIN') {
      if (u.is_banned) {
        actions += `<button class="btn-action unban" onclick="toggleBan('${u.id}', false)"><i class="ph ph-check"></i> رفع الحظر</button>`;
      } else {
        actions += `<button class="btn-action ban" onclick="toggleBan('${u.id}', true)"><i class="ph ph-prohibit"></i> حظر</button>`;
      }
      if (u.role === 'USER') {
        actions += `<button class="btn-action promote" onclick="openPromoteModal('${u.id}')"><i class="ph ph-arrow-fat-up"></i> ترقية</button>`;
      }
      actions += `<button class="btn-action delete" onclick="confirmDeleteUser('${u.id}', '${u.name}')"><i class="ph ph-trash"></i></button>`;
    } else {
      actions += '<span class="text-muted" style="font-size:0.8rem;">—</span>';
    }
    actions += '</div>';

    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td dir="ltr" style="text-align:right; font-size:0.85rem;">${u.email}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td style="font-size:0.85rem;">${date}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
}

window.toggleBan = async function(id, isBanned) {
  const action = isBanned ? 'حظر هذا المستخدم' : 'رفع الحظر عن هذا المستخدم';
  if (!confirm(`هل أنت متأكد من ${action}؟`)) return;
  try {
    const res = await ApiService.banUser(id, isBanned);
    if (res.success) {
      Toast.show('تم بنجاح', res.message, 'success');
      loadUsers(usersCurrentPage);
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل تحديث الحالة', 'error');
  }
};

window.confirmDeleteUser = function(id, name) {
  if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
  deleteUserAction(id);
};

async function deleteUserAction(id) {
  try {
    const res = await ApiService.deleteUser(id);
    if (res.success) {
      Toast.show('تم الحذف', res.message, 'success');
      loadUsers(usersCurrentPage);
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حذف المستخدم', 'error');
  }
}

// Promote Modal
window.openPromoteModal = function(userId) {
  document.getElementById('promoteUserId').value = userId;
  document.getElementById('promoteForm').reset();
  document.getElementById('promoteUserId').value = userId;
  document.getElementById('promoteModal').classList.remove('hidden');
};

window.closePromoteModal = function() {
  document.getElementById('promoteModal').classList.add('hidden');
};

async function submitPromotion() {
  const id = document.getElementById('promoteUserId').value;
  const data = {
    specialty: document.getElementById('promoteSpecialty').value,
    qualifications: document.getElementById('promoteQualifications').value,
    experience_years: document.getElementById('promoteExperience').value,
    phone: document.getElementById('promotePhone').value,
  };

  try {
    const res = await ApiService.promoteUser(id, data);
    if (res.success) {
      Toast.show('تمت الترقية', res.message, 'success');
      closePromoteModal();
      loadUsers(usersCurrentPage);
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل ترقية المستخدم', 'error');
  }
}

// ==========================================
// SECTION 3: Applications
// ==========================================
let currentAppFilter = 'PENDING';

window.filterApplications = function(status, btn) {
  currentAppFilter = status;
  document.querySelectorAll('#applicationFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadApplications(status);
};

async function loadApplications(status = 'PENDING') {
  const container = document.getElementById('applicationsList');
  container.innerHTML = `<div class="spinner-overlay"><i class="ph ph-spinner"></i></div>`;

  try {
    const res = await ApiService.getApplications(status, 1, 50);
    if (res.success && res.data) {
      renderApplications(res.data.applications);
    }
  } catch (error) {
    console.error('Applications error:', error);
    container.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle"></i><p>تعذر تحميل الطلبات</p></div>`;
  }
}

function renderApplications(applications) {
  const container = document.getElementById('applicationsList');

  if (!applications || applications.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="ph ph-clipboard-text"></i><p>لا توجد طلبات في هذا التصنيف</p></div>`;
    return;
  }

  container.innerHTML = applications.map(app => {
    const date = new Date(app.created_at).toLocaleDateString('ar-SA');
    const userName = app.user?.name || 'غير معروف';
    const userEmail = app.user?.email || '';

    let statusBadge = '';
    if (app.status === 'PENDING') statusBadge = '<span class="status-badge status-pending">معلق</span>';
    else if (app.status === 'APPROVED') statusBadge = '<span class="status-badge status-approved">مقبول</span>';
    else statusBadge = '<span class="status-badge status-rejected">مرفوض</span>';

    let actionsHTML = '';
    if (app.status === 'PENDING') {
      actionsHTML = `
        <div class="application-actions">
          <button class="btn-action approve" onclick="handleApp('${app.id}', 'APPROVED')"><i class="ph ph-check-circle"></i> قبول الطلب</button>
          <button class="btn-action reject" onclick="promptRejectApp('${app.id}')"><i class="ph ph-x-circle"></i> رفض الطلب</button>
        </div>
      `;
    }

    return `
      <div class="application-card">
        <div class="application-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <i class="ph-fill ph-user-circle" style="font-size:2.2rem; color:var(--sys-color-primary);"></i>
            <div>
              <strong style="font-size:1rem;">${userName}</strong>
              <span class="text-muted" style="font-size:0.8rem; display:block;" dir="ltr">${userEmail}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            ${statusBadge}
            <span class="text-muted" style="font-size:0.8rem;"><i class="ph ph-calendar-blank"></i> ${date}</span>
          </div>
        </div>

        <div class="application-info-grid">
          <div class="info-item"><span class="info-label">الاسم الكامل</span><span class="info-value">${app.full_name || '—'}</span></div>
          <div class="info-item"><span class="info-label">التخصص</span><span class="info-value">${app.specialty || '—'}</span></div>
          <div class="info-item"><span class="info-label">سنوات الخبرة</span><span class="info-value">${app.experience_years ?? '—'}</span></div>
          <div class="info-item"><span class="info-label">رقم الهاتف</span><span class="info-value" dir="ltr" style="text-align:right;">${app.phone || '—'}</span></div>
          <div class="info-item"><span class="info-label">الموقع</span><span class="info-value">${app.location || '—'}</span></div>
          <div class="info-item"><span class="info-label">المؤهلات</span><span class="info-value">${app.qualifications || '—'}</span></div>
        </div>

        ${app.bio ? `<div style="background:var(--sys-color-surface-container-low); padding:12px 16px; border-radius:var(--sys-radius-md); margin-bottom:8px;"><span class="info-label" style="display:block; margin-bottom:4px;">النبذة التعريفية</span><p style="margin:0; font-size:0.9rem; line-height:1.7;">${app.bio}</p></div>` : ''}
        ${app.admin_notes ? `<div style="background:#FFF3E0; padding:12px 16px; border-radius:var(--sys-radius-md);"><span class="info-label" style="display:block; margin-bottom:4px;">ملاحظات المدير</span><p style="margin:0; font-size:0.9rem;">${app.admin_notes}</p></div>` : ''}

        ${actionsHTML}
      </div>
    `;
  }).join('');
}

window.handleApp = async function(id, status, notes = '') {
  try {
    const res = await ApiService.handleApplication(id, status, notes);
    if (res.success) {
      Toast.show('تم بنجاح', res.message, 'success');
      loadApplications(currentAppFilter);
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل معالجة الطلب', 'error');
  }
};

window.promptRejectApp = function(id) {
  const notes = prompt('يرجى كتابة سبب الرفض (اختياري):');
  if (notes !== null) {
    handleApp(id, 'REJECTED', notes);
  }
};

// ==========================================
// SECTION 4: Doctors
// ==========================================
let doctorsCurrentPage = 1;

async function loadDoctors(page = 1) {
  doctorsCurrentPage = page;
  const tbody = document.getElementById('doctorsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;"><i class="ph ph-spinner" style="animation:spin 1s linear infinite;font-size:1.5rem;color:var(--sys-color-primary);"></i></td></tr>`;

  try {
    const res = await ApiService.getAdminDoctors(page, 15);
    if (res.success && res.data) {
      renderDoctorsTable(res.data.doctors);
      renderPagination('doctorsPagination', res.data.pagination, loadDoctors);
    }
  } catch (error) {
    console.error('Doctors error:', error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">فشل تحميل الأطباء</td></tr>`;
  }
}

function renderDoctorsTable(doctors) {
  const tbody = document.getElementById('doctorsTableBody');

  if (!doctors || doctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">لا يوجد أطباء مسجلون</td></tr>`;
    return;
  }

  tbody.innerHTML = doctors.map(doc => {
    const name = doc.user?.name || '—';
    const banned = doc.user?.is_banned;
    const statusBadge = banned
      ? '<span class="status-badge status-banned">محظور</span>'
      : '<span class="status-badge status-active">نشط</span>';

    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${doc.specialty || '—'}</td>
        <td>${doc.location || '—'}</td>
        <td>${doc.experience_years ?? '—'}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-action delete" onclick="confirmDeleteDoctor('${doc.id}', '${name}')"><i class="ph ph-trash"></i> إزالة</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.confirmDeleteDoctor = function(id, name) {
  if (!confirm(`هل أنت متأكد من إزالة الطبيب "${name}"؟ سيتم إرجاعه كمستخدم عادي.`)) return;
  deleteDoctorAction(id);
};

async function deleteDoctorAction(id) {
  try {
    const res = await ApiService.deleteDoctor(id);
    if (res.success) {
      Toast.show('تمت الإزالة', res.message, 'success');
      loadDoctors(doctorsCurrentPage);
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حذف الطبيب', 'error');
  }
}

// ==========================================
// SECTION 5: Articles
// ==========================================
let editingArticleId = null;

async function saveArticle() {
  const btn = document.getElementById('btnSaveArticle');
  const original = btn.innerHTML;

  try {
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;margin-left:8px;"></i> جاري الحفظ...';
    btn.disabled = true;

    const title = document.getElementById('articleTitle').value;
    const content = document.getElementById('articleContent').value;
    const image = document.getElementById('articleImage').value;

    let res;
    if (editingArticleId) {
      res = await ApiService.updateAdminArticle(editingArticleId, { title, content, image });
    } else {
      res = await ApiService.createAdminArticle(title, content, image);
    }

    if (res.success) {
      Toast.show(editingArticleId ? 'تم التعديل' : 'تم النشر', res.message, 'success');
      cancelEditArticle();
      loadStats();
      loadArticles();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حفظ المقال', 'error');
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

async function loadArticles() {
  const container = document.getElementById('articlesList');
  if(!container) return;
  container.innerHTML = `<div class="spinner-overlay"><i class="ph ph-spinner"></i></div>`;
  try {
    const res = await ApiService.getAdminArticles(1, 50);
    if (res.success && res.data) {
      // Store articles globally to easily access data for editing
      window._allArticles = res.data.articles || [];
      renderArticles(window._allArticles);
    }
  } catch (error) {
    console.error('Articles error:', error);
    container.innerHTML = `<div class="empty-state"><p>تعذر تحميل المقالات</p></div>`;
  }
}

function renderArticles(articles) {
  const container = document.getElementById('articlesList');
  if (!articles || articles.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>لا توجد مقالات حالياً</p></div>`;
    return;
  }

  container.innerHTML = articles.map(art => {
    const isDoctor = !!art.doctor_id;
    let publishBadge = '';
    
    // Status and Toggle Button for Doctor Articles
    let toggleBtn = '';
    if (isDoctor) {
      if (art.is_published) {
        publishBadge = '<span class="status-badge status-active" style="margin-right:10px;">ظاهر</span>';
        toggleBtn = `<button class="btn-action ban" onclick="toggleArticlePublish('${art.id}', false)"><i class="ph ph-eye-slash"></i> إخفاء</button>`;
      } else {
        publishBadge = '<span class="status-badge status-banned" style="margin-right:10px;">مخفي (محظور)</span>';
        toggleBtn = `<button class="btn-action unban" onclick="toggleArticlePublish('${art.id}', true)"><i class="ph ph-eye"></i> إظهار</button>`;
      }
    }

    // Edit Button only if it's by Admin
    let editBtn = '';
    if (!isDoctor) {
      editBtn = `<button class="btn-action edit" onclick="editArticle('${art.id}')"><i class="ph ph-pencil"></i> تعديل</button>`;
    }

    return `
      <div class="card mb-3" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
        <div>
          <h4 style="margin:0; display:flex; align-items:center;">${art.title} ${publishBadge}</h4>
          <span class="text-muted" style="font-size:0.85rem;">بواسطة: ${art.doctor?.user?.name || art.admin?.name || 'الإدارة'}</span>
        </div>
        <div class="actions-cell">
          ${toggleBtn}
          ${editBtn}
          <button class="btn-action delete" onclick="confirmDeleteArticle('${art.id}', '${art.title}')"><i class="ph ph-trash"></i> حذف</button>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleArticlePublish = async function(id, is_published) {
  const action = is_published ? 'إظهار هذا المقال للعامة' : 'إخفاء (حظر) هذا المقال';
  if (!confirm(`هل أنت متأكد من ${action}؟`)) return;
  try {
    const res = await ApiService.toggleAdminArticleStatus(id, is_published);
    if (res.success) {
      Toast.show('تم التحديث', res.message, 'success');
      loadArticles();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل تغيير حالة المقال', 'error');
  }
};

window.editArticle = function(id) {
  const article = window._allArticles.find(a => a.id === id);
  if (!article) return;
  
  editingArticleId = id;
  document.getElementById('articleTitle').value = article.title || '';
  document.getElementById('articleContent').value = article.content || '';
  document.getElementById('articleImage').value = article.image || '';
  
  const btn = document.getElementById('btnSaveArticle');
  btn.innerHTML = '<i class="ph ph-floppy-disk" style="margin-left:8px;"></i> حفظ التعديلات';
  
  // Add cancel button if not exists
  if(!document.getElementById('btnCancelEditArticle')) {
    btn.insertAdjacentHTML('afterend', `
      <button type="button" class="btn btn-secondary" id="btnCancelEditArticle" onclick="cancelEditArticle()" style="margin-right:10px;">إلغاء التعديل</button>
    `);
  }
  
  document.getElementById('adminArticleForm').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditArticle = function() {
  editingArticleId = null;
  document.getElementById('adminArticleForm').reset();
  const btn = document.getElementById('btnSaveArticle');
  btn.innerHTML = '<i class="ph ph-paper-plane-right" style="margin-left:8px;"></i> نشر المقال';
  const cancelBtn = document.getElementById('btnCancelEditArticle');
  if(cancelBtn) cancelBtn.remove();
};

window.confirmDeleteArticle = async function(id, title) {
  if (!confirm(`هل أنت متأكد من حذف المقال "${title}"؟`)) return;
  try {
    const res = await ApiService.deleteAdminArticle(id);
    if (res.success) {
      Toast.show('تم الحذف', res.message, 'success');
      loadArticles();
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حذف المقال', 'error');
  }
};

// ==========================================
// SECTION 6: Videos
// ==========================================
let editingVideoId = null;

async function saveVideo() {
  const btn = document.getElementById('btnSaveVideo');
  const original = btn.innerHTML;

  try {
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;margin-left:8px;"></i> جاري الحفظ...';
    btn.disabled = true;

    const title = document.getElementById('videoTitle').value;
    const type = document.querySelector('input[name="videoType"]:checked').value;
    const url = document.getElementById('videoUrl').value;
    const fileInput = document.getElementById('videoFile');
    const description = document.getElementById('videoDescription').value;
    const thumbnail = document.getElementById('videoThumbnail').value;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('thumbnail', thumbnail);
    
    if (type === 'file' && fileInput.files.length > 0) {
      formData.append('video_file', fileInput.files[0]);
    } else {
      // Allow saving edit even if no new file is selected, by sending the existing url/path or ignoring it
      // But we always append url if we're on 'url' mode
      formData.append('url', url);
    }

    let res;
    if (editingVideoId) {
      res = await ApiService.updateAdminVideo(editingVideoId, formData);
    } else {
      res = await ApiService.createAdminVideo(formData);
    }

    if (res.success) {
      Toast.show(editingVideoId ? 'تم التعديل' : 'تمت الإضافة', res.message, 'success');
      cancelEditVideo();
      loadStats();
      loadVideos();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حفظ الفيديو', 'error');
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

async function loadVideos() {
  const container = document.getElementById('videosList');
  if(!container) return;
  container.innerHTML = `<div class="spinner-overlay"><i class="ph ph-spinner"></i></div>`;
  try {
    const res = await ApiService.getVideos();
    if (res.success && res.data) {
      window._allVideos = res.data.videos || [];
      renderVideos(window._allVideos);
    }
  } catch (error) {
    console.error('Videos error:', error);
    container.innerHTML = `<div class="empty-state"><p>تعذر تحميل الفيديوهات</p></div>`;
  }
}

function renderVideos(videos) {
  const container = document.getElementById('videosList');
  if (!videos || videos.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>لا توجد فيديوهات حالياً</p></div>`;
    return;
  }

  container.innerHTML = videos.map(vid => {
    return `
      <div class="card mb-3" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
        <div>
          <h4 style="margin:0;">${vid.title}</h4>
          <span class="text-muted" style="font-size:0.85rem;">بواسطة: ${vid.admin?.name || 'الإدارة'}</span>
        </div>
        <div class="actions-cell">
          <button class="btn-action edit" onclick="editVideo('${vid.id}')"><i class="ph ph-pencil"></i> تعديل</button>
          <button class="btn-action delete" onclick="confirmDeleteVideo('${vid.id}', '${vid.title}')"><i class="ph ph-trash"></i> حذف</button>
        </div>
      </div>
    `;
  }).join('');
}

window.editVideo = function(id) {
  const video = window._allVideos.find(v => v.id === id);
  if (!video) return;
  
  editingVideoId = id;
  document.getElementById('videoTitle').value = video.title || '';
  document.getElementById('videoDescription').value = video.description || '';
  document.getElementById('videoThumbnail').value = video.thumbnail || '';
  
  // Set type to URL as fallback so we can show the existing string
  document.querySelector('input[name="videoType"][value="url"]').checked = true;
  toggleVideoInputType();
  document.getElementById('videoUrl').value = video.url || '';
  
  const btn = document.getElementById('btnSaveVideo');
  btn.innerHTML = '<i class="ph ph-floppy-disk" style="margin-left:8px;"></i> حفظ التعديلات';
  
  // Add cancel button if not exists
  if(!document.getElementById('btnCancelEditVideo')) {
    btn.insertAdjacentHTML('afterend', `
      <button type="button" class="btn btn-secondary" id="btnCancelEditVideo" onclick="cancelEditVideo()" style="margin-right:10px;">إلغاء التعديل</button>
    `);
  }
  
  document.getElementById('adminVideoForm').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditVideo = function() {
  editingVideoId = null;
  document.getElementById('adminVideoForm').reset();
  document.querySelector('input[name="videoType"][value="url"]').checked = true;
  toggleVideoInputType();
  
  const btn = document.getElementById('btnSaveVideo');
  btn.innerHTML = '<i class="ph ph-video" style="margin-left:8px;"></i> إضافة الفيديو';
  const cancelBtn = document.getElementById('btnCancelEditVideo');
  if(cancelBtn) cancelBtn.remove();
};

window.confirmDeleteVideo = async function(id, title) {
  if (!confirm(`هل أنت متأكد من حذف الفيديو "${title}"؟`)) return;
  try {
    const res = await ApiService.deleteAdminVideo(id);
    if (res.success) {
      Toast.show('تم الحذف', res.message, 'success');
      loadVideos();
      loadStats();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل حذف الفيديو', 'error');
  }
};

// ==========================================
// SECTION 7: Health Tips
// ==========================================
async function loadHealthTips() {
  const container = document.getElementById('tipsList');
  try {
    const res = await ApiService.getHealthTips();
    if (res.success && res.data) {
      renderTips(res.data);
    }
  } catch (error) {
    console.error('Tips error:', error);
    container.innerHTML = `<div class="empty-state"><i class="ph ph-warning-circle"></i><p>تعذر تحميل النصائح</p></div>`;
  }
}

function renderTips(tips) {
  const container = document.getElementById('tipsList');

  if (!tips || tips.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="ph ph-lightbulb"></i><p>لم تتم إضافة أي نصائح صحية بعد</p></div>`;
    return;
  }

  container.innerHTML = tips.map(tip => {
    const date = new Date(tip.created_at).toLocaleDateString('ar-SA');
    const adminName = tip.admin?.name || '';
    const sentBadge = tip.is_sent
      ? `<span class="tip-sent-badge"><i class="ph ph-check"></i> تم الإرسال${tip.sent_at ? ' - ' + new Date(tip.sent_at).toLocaleDateString('ar-SA') : ''}</span>`
      : `<button class="btn-action send" onclick="sendTip('${tip.id}')"><i class="ph ph-paper-plane-right"></i> إرسال كإشعار</button>`;

    return `
      <div class="tip-card">
        <div class="tip-icon"><i class="ph ph-lightbulb-filament"></i></div>
        <div class="tip-content">
          <p>${tip.content}</p>
          <div class="tip-meta">
            <span><i class="ph ph-calendar-blank"></i> ${date} ${adminName ? '• ' + adminName : ''}</span>
            ${sentBadge}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function saveTip() {
  const btn = document.getElementById('btnSaveTip');
  const original = btn.innerHTML;

  try {
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;margin-left:8px;"></i> جاري الإضافة...';
    btn.disabled = true;

    const content = document.getElementById('tipContent').value;
    const res = await ApiService.createHealthTip(content);
    if (res.success) {
      Toast.show('تمت الإضافة', res.message, 'success');
      document.getElementById('healthTipForm').reset();
      loadHealthTips();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل إضافة النصيحة', 'error');
  } finally {
    btn.innerHTML = original;
    btn.disabled = false;
  }
}

window.sendTip = async function(id) {
  if (!confirm('هل تريد إرسال هذه النصيحة كإشعار لجميع المستخدمين؟')) return;
  try {
    const res = await ApiService.sendHealthTip(id);
    if (res.success) {
      Toast.show('تم الإرسال', res.message, 'success');
      loadHealthTips();
    }
  } catch (e) {
    Toast.show('خطأ', e.message || 'فشل إرسال النصيحة', 'error');
  }
};

// ==========================================
// Pagination Helper
// ==========================================
function renderPagination(containerId, pagination, loadFn) {
  const container = document.getElementById(containerId);
  if (!container || !pagination) { if(container) container.innerHTML = ''; return; }

  const { page, totalPages } = pagination;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button ${page <= 1 ? 'disabled' : ''} onclick="window._paginate_${containerId}(${page - 1})"><i class="ph ph-caret-right"></i></button>`;
  html += `<span class="page-info">صفحة ${page} من ${totalPages}</span>`;
  html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="window._paginate_${containerId}(${page + 1})"><i class="ph ph-caret-left"></i></button>`;

  container.innerHTML = html;
  window[`_paginate_${containerId}`] = loadFn;
}
