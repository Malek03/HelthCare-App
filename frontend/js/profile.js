/**
 * Profile Logic (Health Tracking + Weekly Progress + Consultations)
 */

// State variables
let waterTarget = 8;
let currentWater = 0;
let isWalkDone = false;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await window.ApiService.getMe();
    const user = res.data;
    if(user) {
      document.getElementById('userName').textContent = user.name || 'مستخدم';
      document.getElementById('userEmail').textContent = user.email || '';
    }
  } catch(err) {
    if(!localStorage.getItem('token')) {
       window.location.href = 'login.html';
    }
  }

  // Load daily summary for health stats
  try {
      const today = new Date().toISOString().split('T')[0];
      const summaryRes = await window.ApiService.getDailySummary(today);
      if(summaryRes && summaryRes.data) {
          // FIX: Extract glasses integer from the water object
          const waterData = summaryRes.data.water;
          currentWater = (waterData && typeof waterData === 'object') ? (waterData.glasses || 0) : (waterData || 0);

          const sleepLog = summaryRes.data.sleep;
          if(sleepLog && sleepLog.hours > 0) {
             const sleepStatus = document.getElementById('sleepStatus');
             sleepStatus.textContent = `مسجل مسبقاً: ${sleepLog.hours} ساعات`;
          }
          const walkLog = summaryRes.data.walk;
          if(walkLog && walkLog.completed) {
             isWalkDone = true;
             const btn = document.getElementById('btnWalk');
             const txt = document.getElementById('walkStatus');
             btn.className = "btn btn-outline w-100 mt-4";
             btn.innerHTML = `<i class="ph ph-x-circle mr-2"></i> تراجع عن التأكيد`;
             txt.textContent = 'تم إنجاز هدف المشي اليوم!';
             txt.style.color = '#2E7D32';
          }
      }
  } catch(e) { console.error('Health summary err:', e); }

  initWaterCups();
  loadAppointments();
  loadWeeklyProgress();
  loadConsultations();
});

// ==========================================
// 1. Water Tracking Logic
// ==========================================
function initWaterCups() {
  const container = document.getElementById('waterCups');
  const countLabel = document.getElementById('waterCount');
  
  let html = '';
  for(let i=0; i<waterTarget; i++) {
    html += `<div class="cup ${i < currentWater ? 'filled' : ''}"></div>`;
  }
  container.innerHTML = html;
  countLabel.textContent = `${currentWater} / ${waterTarget} أكواب`;
}

async function addWater() {
  if (currentWater < waterTarget) {
    try {
      await window.ApiService.logWater();
      currentWater++;
      initWaterCups();
    } catch(err) {
      console.error(err);
      if(window.showToast) window.showToast('حدث خطأ أثناء تسجيل الماء', 'error');
    }
  }
}

// ==========================================
// 2. Sleep Tracking Logic
// ==========================================
async function logSleep() {
  const hours = parseFloat(document.getElementById('sleepInput').value);
  if (!hours) return;
  
  try {
    await window.ApiService.logSleep(hours);
    const status = document.getElementById('sleepStatus');
    status.textContent = `تم تسجيل ${hours} ساعات نوم`;
    status.className = "body-md mt-2";
    
    if (hours < 6) status.classList.add('text-danger');
    else if (hours >= 7 && hours <= 9) status.style.color = '#2E7D32';
    
    document.getElementById('sleepInput').value = '';
  } catch(err) {
    console.error(err);
    if(window.showToast) window.showToast('حدث خطأ أثناء تسجيل ساعات النوم', 'error');
  }
}

// ==========================================
// 3. Walk Tracking Logic
// ==========================================
async function toggleWalk() {
  const btn = document.getElementById('btnWalk');
  const txt = document.getElementById('walkStatus');
  
  try {
    if(!isWalkDone) {
        await window.ApiService.logWalk(3000);
    }
    
    isWalkDone = !isWalkDone;
    
    if (isWalkDone) {
      btn.className = "btn btn-outline w-100 mt-4";
      btn.innerHTML = `<i class="ph ph-x-circle mr-2"></i> تراجع عن التأكيد`;
      txt.textContent = 'تم إنجاز هدف المشي اليوم!';
      txt.style.color = '#2E7D32';
    } else {
      btn.className = "btn btn-primary w-100 mt-4";
      btn.innerHTML = `<i class="ph ph-check-circle mr-2"></i> تأكيد المشي`;
      txt.textContent = 'الهدف: 30 دقيقة يومياً';
      txt.style.color = 'var(--sys-color-on-surface-variant)';
    }
  } catch(err) {
    console.error(err);
    if(window.showToast) window.showToast('حدث خطأ أثناء التأكيد', 'error');
  }
}

// ==========================================
// 4. Load Appointments
// ==========================================
async function loadAppointments() {
  const tbody = document.getElementById('appointmentsTable');
  
  try {
    const res = await window.ApiService.getMyAppointments();
    const mockAppointments = res.data?.appointments || res.data || [];
    
    if(mockAppointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد مواعيد سابقة</td></tr>';
      return;
    }

    let html = '';
    mockAppointments.forEach(app => {
      
      let badgeCls = 'status-pending';
      let badgeTxt = 'قيد الانتظار';
      
      const st = app.status ? app.status.toUpperCase() : 'PENDING';
      if (st === 'ACCEPTED' || st === 'APPROVED') { badgeCls = 'status-approved'; badgeTxt = 'مؤكد'; }
      if (st === 'COMPLETED') { badgeCls = 'status-approved'; badgeTxt = 'مكتمل'; }
      if (st === 'CANCELLED' || st === 'REJECTED') { badgeCls = 'status-cancelled'; badgeTxt = 'ملغي'; }
      
      const dateObj = new Date(app.date_time);
      const formattedDate = dateObj.toLocaleDateString('ar-EG');
      const formattedTime = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const doctorName = app.doctor?.user?.name || app.doctor?.name || 'طبيب';

      html += `
        <tr>
          <td>
            <strong>دكتور ${doctorName}</strong><br>
            <span class="text-muted" style="font-size:0.75rem;">${app.doctor?.specialty || ''}</span>
          </td>
          <td>${formattedDate}</td>
          <td>${formattedTime}</td>
          <td><span class="status-badge ${badgeCls}">${badgeTxt}</span></td>
          <td>
            <a href="doctor-profile.html?id=${app.doctor_id}" class="btn btn-outline" style="height:32px; padding:0 12px; font-size:0.8rem; text-decoration:none; display:inline-flex; align-items:center;">تواصل</a>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch(err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">حدث خطأ أثناء جلب المواعيد</td></tr>';
  }
}

// ==========================================
// 5. Weekly Health Progress
// ==========================================
async function loadWeeklyProgress() {
  const container = document.getElementById('weeklyProgressGrid');
  if (!container) return;

  try {
    const res = await window.ApiService.getWeeklySummary();
    const data = res.data;
    if (!data) return;

    const waterLogs = data.waterLogs || [];
    const sleepLogs = data.sleepLogs || [];
    const walkLogs = data.walkLogs || [];

    // Build a map of last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      days.push(d);
    }

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    let html = '';
    days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      const dayName = dayNames[day.getDay()];
      const dayNum = day.getDate();
      const isToday = new Date().toDateString() === day.toDateString();

      // Find matching logs
      const waterLog = waterLogs.find(w => new Date(w.log_date).toDateString() === day.toDateString());
      const sleepLog = sleepLogs.find(s => new Date(s.log_date).toDateString() === day.toDateString());
      const walkLog = walkLogs.find(w => new Date(w.log_date).toDateString() === day.toDateString());

      const glasses = waterLog ? waterLog.glasses : 0;
      const sleepHours = sleepLog ? sleepLog.hours : 0;
      const walkDone = walkLog ? walkLog.completed : false;

      const waterPercent = Math.min((glasses / 8) * 100, 100);
      const sleepPercent = Math.min((sleepHours / 8) * 100, 100);

      html += `
        <div class="weekly-day-card ${isToday ? 'today' : ''}">
          <div class="day-header">
            <span class="day-name">${dayName}</span>
            <span class="day-num">${dayNum}</span>
          </div>
          <div class="day-metrics">
            <div class="metric-row">
              <i class="ph ph-drop" style="color:#0288D1"></i>
              <div class="metric-bar-track">
                <div class="metric-bar-fill water-fill" style="width:${waterPercent}%"></div>
              </div>
              <span class="metric-value">${glasses}/8</span>
            </div>
            <div class="metric-row">
              <i class="ph ph-moon" style="color:#512DA8"></i>
              <div class="metric-bar-track">
                <div class="metric-bar-fill sleep-fill" style="width:${sleepPercent}%"></div>
              </div>
              <span class="metric-value">${sleepHours}h</span>
            </div>
            <div class="metric-row">
              <i class="ph ph-sneaker" style="color:#388E3C"></i>
              <span class="walk-badge ${walkDone ? 'done' : 'missed'}">${walkDone ? 'تم ✓' : 'لم يتم'}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch(err) {
    console.error('Weekly progress error:', err);
    container.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;">لا تتوفر بيانات أسبوعية بعد</p>';
  }
}

// ==========================================
// 6. Load Consultations
// ==========================================
async function loadConsultations() {
  const tbody = document.getElementById('consultationsTable');
  if (!tbody) return;

  try {
    const res = await window.ApiService.getMyConsultations();
    const consultations = res.data?.consultations || res.data || [];

    if (consultations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا توجد استشارات سابقة. <a href="consultation.html" style="color:var(--sys-color-primary);">أرسل استشارتك الأولى</a></td></tr>';
      return;
    }

    let html = '';
    consultations.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
      const doctorName = c.doctor?.user?.name || 'طبيب';
      const specialty = c.doctor?.specialty || '';

      let badgeCls = 'status-pending';
      let badgeTxt = 'قيد الانتظار';
      if (c.status === 'ANSWERED') { badgeCls = 'status-approved'; badgeTxt = 'تم الرد'; }
      if (c.status === 'CLOSED')   { badgeCls = 'status-cancelled'; badgeTxt = 'مغلقة'; }

      const questionPreview = c.question.length > 80 ? c.question.substring(0, 80) + '...' : c.question;

      html += `
        <tr class="consultation-row" onclick="toggleAnswer(this)">
          <td>
            <strong>د. ${doctorName}</strong><br>
            <span class="text-muted" style="font-size:0.75rem;">${specialty}</span>
          </td>
          <td>
            <span class="question-preview">${questionPreview}</span>
          </td>
          <td>${date}</td>
          <td><span class="status-badge ${badgeCls}">${badgeTxt}</span></td>
        </tr>
        ${c.answer ? `
        <tr class="answer-row" style="display:none;">
          <td colspan="4">
            <div class="answer-box">
              <div class="answer-header"><i class="ph ph-chat-circle-text"></i> رد الطبيب:</div>
              <p>${c.answer}</p>
            </div>
          </td>
        </tr>
        ` : ''}
      `;
    });

    tbody.innerHTML = html;
  } catch(err) {
    console.error('Consultations error:', err);
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">حدث خطأ أثناء جلب الاستشارات</td></tr>';
  }
}

// Toggle answer visibility
function toggleAnswer(row) {
  const answerRow = row.nextElementSibling;
  if (answerRow && answerRow.classList.contains('answer-row')) {
    answerRow.style.display = answerRow.style.display === 'none' ? 'table-row' : 'none';
  }
}
