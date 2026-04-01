/**
 * Profile Logic (Health Tracking + Appointments)
 */

// Mock State variables
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
          currentWater = summaryRes.data.water || 0;
          const sleepLog = summaryRes.data.sleep;
          if(sleepLog) {
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
});

// 1. Water Tracking Logic
function initWaterCups() {
  const container = document.getElementById('waterCups');
  const countLabel = document.getElementById('waterCount');
  
  // Render cups initially based on target
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
      initWaterCups(); // re-render
    } catch(err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الماء');
    }
  }
}

// 2. Sleep Tracking Logic
async function logSleep() {
  const hours = parseFloat(document.getElementById('sleepInput').value);
  if (!hours) return;
  
  try {
    await window.ApiService.logSleep(hours);
    const status = document.getElementById('sleepStatus');
    status.textContent = `تم تسجيل ${hours} ساعات نوم`;
    status.className = "body-md mt-2";
    
    // Color code based on criteria
    if (hours < 6) status.classList.add('text-danger');
    else if (hours >= 7 && hours <= 9) status.style.color = '#2E7D32';
    
    // Clean input
    document.getElementById('sleepInput').value = '';
  } catch(err) {
    console.error(err);
    alert('حدث خطأ أثناء تسجيل ساعات النوم');
  }
}

// 3. Walk Tracking Logic
async function toggleWalk() {
  const btn = document.getElementById('btnWalk');
  const txt = document.getElementById('walkStatus');
  
  try {
    if(!isWalkDone) {
        await window.ApiService.logWalk(3000); // arbitrary steps
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
    alert('حدث خطأ أثناء التأكيد');
  }
}

// 4. Load Appointments
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
      
      // Formatting date time
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
