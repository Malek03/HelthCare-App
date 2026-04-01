/**
 * Navbar Component
 * Injects a Glassmorphic RTL Navigation Bar into #navbar-container
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('navbar-container');
    if (!container) return;
  
    // Determine active path for highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
    // Check if user is logged in (mock logic for now, using localStorage)
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('name') || 'حسابي';
  
    let userControls = `
      <div class="nav-controls d-flex align-center" style="gap: 16px;">
        <a href="login.html" class="btn btn-outline">تسجيل الدخول</a>
        <a href="register.html" class="btn btn-primary" style="height: 40px; border-radius: 8px;">حساب جديد</a>
      </div>
    `;
  
    if (token) {
      userControls = `
        <div class="nav-controls d-flex align-center" style="gap: 16px;">
          <a href="${role === 'DOCTOR' ? 'doctor-dashboard.html' : 'profile.html'}" class="btn btn-outline">
            <i class="ph ph-user"></i> ${userName}
          </a>
          <button onclick="logout()" class="btn btn-secondary" style="height: 40px; border-radius: 8px;">تسجيل الخروج</button>
        </div>
      `;
    }
  
    const navbarHTML = `
      <style>
        .custom-navbar {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sys-spacing-32);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .nav-logo {
          font-family: var(--sys-font-headline);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--sys-color-primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .nav-links {
          display: flex;
          gap: var(--sys-spacing-32);
          list-style: none;
        }
        
        .nav-link {
          text-decoration: none;
          color: var(--sys-color-on-surface);
          font-weight: 600;
          font-family: var(--sys-font-headline);
          font-size: 1rem;
          transition: color 0.2s;
          padding: 8px 0;
          position: relative;
        }
        
        .nav-link:hover, .nav-link.active {
          color: var(--sys-color-primary);
        }
        
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--sys-gradient-primary);
          border-radius: 2px;
        }
        
        .doctor-join-btn {
          color: var(--sys-color-primary);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
  
        @media (max-width: 992px) {
          .nav-links { display: none; }
          .doctor-join-btn { display: none; }
        }
      </style>
  
      <nav class="glass-nav">
        <div class="custom-navbar container">
          <a href="index.html" class="nav-logo">
            <i class="ph-fill ph-heartbeat"></i> المنصة الطبية
          </a>
          
          <ul class="nav-links">
            <li><a href="index.html" class="nav-link ${currentPath === 'index.html' ? 'active' : ''}">الرئيسية</a></li>
            <li><a href="doctors.html" class="nav-link ${currentPath === 'doctors.html' ? 'active' : ''}">الأطباء</a></li>
            <li><a href="bmi.html" class="nav-link ${currentPath === 'bmi.html' ? 'active' : ''}">حاسبة BMI</a></li>
            <li><a href="articles.html" class="nav-link ${currentPath === 'articles.html' ? 'active' : ''}">المقالات الموثوقة</a></li>
            <li>
              <a href="apply-doctor.html" class="doctor-join-btn">
                <i class="ph ph-stethoscope"></i> انضم كطبيب
              </a>
            </li>
          </ul>
  
          ${userControls}
        </div>
      </nav>
    `;
  
    container.innerHTML = navbarHTML;
  });
  
  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }
