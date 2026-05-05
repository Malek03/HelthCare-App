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
      <div class="nav-controls d-flex align-center">
        <a href="login.html" class="nav-btn nav-btn-outline">تسجيل الدخول</a>
        <a href="register.html" class="nav-btn nav-btn-primary">حساب جديد</a>
      </div>
    `;
  
    if (token) {
      let dashboardLink = 'profile.html';
      let userIcon = 'ph-user';
      if (role === 'ADMIN') {
        dashboardLink = 'admin-dashboard.html';
        userIcon = 'ph-shield-star';
      } else if (role === 'DOCTOR') {
        dashboardLink = 'doctor-dashboard.html';
        userIcon = 'ph-stethoscope';
      }

      userControls = `
        <div class="nav-controls d-flex align-center">
          <div class="notification-container">
            <button onclick="toggleNotifications(event)" class="nav-icon-btn">
              <i class="ph ph-bell"></i>
              <span id="unreadBadge" class="notification-badge hidden">0</span>
            </button>
            <div id="notificationDropdown" class="notification-dropdown hidden">
              <div class="notification-dropdown-header">
                <h4>الإشعارات</h4>
                <button onclick="markAllNotificationsAsRead()" class="mark-read-btn">تحديد الكل كمقروء</button>
              </div>
              <div id="notificationList" class="notification-list">
                <div class="notification-loading">
                  <i class="ph ph-spinner ph-spin"></i>
                  <p>جاري التحميل...</p>
                </div>
              </div>
            </div>
          </div>
          <a href="${dashboardLink}" class="nav-btn nav-btn-outline">
            <i class="ph ${userIcon}"></i> <span class="user-name-text">${userName}</span>
          </a>
          <button onclick="logout()" class="nav-btn nav-btn-secondary">تسجيل الخروج</button>
        </div>
      `;
    }
  
    const navbarHTML = `
      <style>
        .glass-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }

        .glass-nav::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: -1;
        }

        .custom-navbar {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sys-spacing-24);
          max-width: 1280px;
          margin: 0 auto;
        }
        
        .nav-logo {
          font-family: var(--sys-font-headline);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--sys-color-primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          z-index: 1001;
          transition: transform 0.2s ease;
        }

        .nav-logo:hover {
          transform: scale(1.02);
        }
        
        .nav-content {
          display: flex;
          align-items: center;
          gap: var(--sys-spacing-32);
          flex: 1;
          justify-content: flex-end;
        }

        .nav-links {
          display: flex;
          gap: var(--sys-spacing-24);
          list-style: none;
          padding: 0;
          margin: 0;
          align-items: center;
        }
        
        .nav-link {
          text-decoration: none;
          color: var(--sys-color-on-surface-variant);
          font-weight: 600;
          font-family: var(--sys-font-headline);
          font-size: 1.05rem;
          transition: all 0.3s ease;
          padding: 8px 0;
          position: relative;
          display: block;
        }
        
        .nav-link:hover, .nav-link.active {
          color: var(--sys-color-primary);
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; 
          left: 50%; 
          width: 0;
          height: 3px;
          background: var(--sys-gradient-primary);
          border-radius: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
        }

        .nav-link:hover::after, .nav-link.active::after {
          width: 100%;
        }
        
        .doctor-join-btn {
          color: var(--sys-color-tertiary) !important;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .doctor-join-btn:hover {
          color: var(--sys-color-tertiary-container) !important;
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Buttons Styling */
        .nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 700;
          font-family: var(--sys-font-headline);
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: none;
        }

        .nav-btn-primary {
          background: var(--sys-color-primary);
          color: var(--sys-color-on-primary);
          box-shadow: 0 4px 12px rgba(0, 91, 191, 0.2);
        }

        .nav-btn-primary:hover {
          background: var(--sys-color-primary-container);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 91, 191, 0.3);
          color: white;
        }

        .nav-btn-secondary {
          background: var(--sys-color-surface-variant);
          color: var(--sys-color-on-surface);
        }

        .nav-btn-secondary:hover {
          background: var(--sys-color-outline-variant);
          transform: translateY(-2px);
        }

        .nav-btn-outline {
          background: transparent;
          color: var(--sys-color-primary);
          border: 1.5px solid var(--sys-color-primary);
        }

        .nav-btn-outline:hover {
          background: rgba(0, 91, 191, 0.05);
          transform: translateY(-2px);
        }

        /* Notifications */
        .notification-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .nav-icon-btn {
          background: var(--sys-color-surface-container);
          border: none;
          color: var(--sys-color-on-surface);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .nav-icon-btn:hover {
          background: var(--sys-color-surface-variant);
          color: var(--sys-color-primary);
          transform: scale(1.05);
        }

        .notification-badge {
          position: absolute;
          top: 0px;
          right: 0px;
          background: var(--sys-color-error);
          color: white;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 800;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(186, 26, 26, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(186, 26, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(186, 26, 26, 0); }
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          background: #ffffff;
          border: 1px solid var(--sys-color-outline-variant);
          border-radius: 16px;
          width: 360px;
          max-height: 450px;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: dropIn 0.2s ease-out;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notification-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(5px);
          z-index: 10;
        }

        .notification-dropdown-header h4 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--sys-color-on-surface);
          font-weight: 800;
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: var(--sys-color-primary);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          transition: opacity 0.2s;
        }

        .mark-read-btn:hover { opacity: 0.7; }
        
        .notification-list { padding: 4px 0; }
        
        .notification-loading {
          text-align: center;
          color: var(--sys-color-on-surface-variant);
          padding: 40px 20px;
        }
        .notification-loading i { font-size: 1.8rem; margin-bottom: 12px; color: var(--sys-color-primary); }

        .mobile-menu-btn {
          display: none;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--sys-color-on-surface);
          font-size: 2rem;
          cursor: pointer;
          z-index: 100;
          transition: color 0.2s;
          padding: 0;
        }

        .mobile-menu-btn:hover {
          color: var(--sys-color-primary);
        }
        
        .drawer-header {
          display: none;
        }
  
        /* Mobile Responsive */
        @media (max-width: 992px) {
          .mobile-menu-btn { display: block; }
          
          .custom-navbar {
            padding: 0 16px;
          }

          .nav-content {
            position: fixed;
            top: 0;
            left: -100%;
            height: 100vh;
            width: 320px;
            max-width: 85vw;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 0;
            gap: 16px;
            transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1002;
            overflow-y: auto;
            box-shadow: 10px 0 30px rgba(0,0,0,0.1);
          }
          
          .nav-content.active {
            left: 0;
          }
          
          .drawer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 24px 24px 16px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            background: #ffffff;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .drawer-title {
            font-family: var(--sys-font-headline);
            font-size: 1.3rem;
            font-weight: 800;
            color: var(--sys-color-primary);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .close-drawer-btn {
            background: var(--sys-color-surface-container-low);
            border: none;
            color: var(--sys-color-on-surface);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .close-drawer-btn:hover {
            background: var(--sys-color-error-container);
            color: var(--sys-color-error);
          }

          .nav-links {
            flex-direction: column;
            width: 100%;
            align-items: flex-start;
            gap: 4px;
            padding: 0 16px;
          }

          .nav-links li { width: 100%; }

          .nav-link {
            font-size: 1.1rem;
            padding: 12px 16px;
            border-radius: 12px;
            background: transparent;
            margin-bottom: 4px;
          }

          .nav-link:hover, .nav-link.active {
            background: var(--sys-color-surface-container-low);
            color: var(--sys-color-primary);
          }
          
          .nav-link::after { display: none; }

          .nav-controls {
            flex-direction: column;
            width: 100%;
            gap: 12px;
            padding: 20px 16px;
            border-top: 1px solid rgba(0,0,0,0.05);
            margin-top: auto;
          }

          .nav-controls .nav-btn {
            width: 100%;
          }
          
          .notification-container {
             width: 100%;
          }
          
          .nav-icon-btn {
             width: 100%;
             border-radius: 12px;
             justify-content: flex-start;
             padding: 0 16px;
             gap: 12px;
             background: transparent;
             border: 1px solid var(--sys-color-outline-variant);
          }
          
          .nav-icon-btn::after {
            content: 'الإشعارات';
            font-family: var(--sys-font-headline);
            font-size: 1.05rem;
            font-weight: 700;
          }

          .notification-badge {
            position: static;
            margin-right: auto;
          }

          .notification-dropdown {
             position: static !important;
             width: 100% !important;
             margin-top: 12px !important;
             box-shadow: none !important;
             border: 1px solid var(--sys-color-outline-variant) !important;
             max-height: 300px;
             animation: none;
          }
        }

        .hidden { display: none !important; }
        
        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 100vh;
          background: rgba(17, 28, 45, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1001;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .mobile-overlay.active {
          display: block;
          opacity: 1;
        }
      </style>
  
      <nav class="glass-nav">
        <div class="custom-navbar">
          <a href="index.html" class="nav-logo">
            <i class="ph-fill ph-heartbeat"></i> المنصة الطبية
          </a>
          
          <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
            <i class="ph ph-list"></i>
          </button>
          
          <div class="mobile-overlay" id="mobileOverlay" onclick="toggleMobileMenu()"></div>

          <div class="nav-content" id="navContent">
            <div class="drawer-header">
              <div class="drawer-title">
                <i class="ph-fill ph-heartbeat"></i> القائمة
              </div>
              <button class="close-drawer-btn" onclick="toggleMobileMenu()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <ul class="nav-links">
              <li><a href="index.html" class="nav-link ${currentPath === 'index.html' ? 'active' : ''}">الرئيسية</a></li>
              <li><a href="doctors.html" class="nav-link ${currentPath === 'doctors.html' ? 'active' : ''}">الأطباء</a></li>
              <li><a href="bmi.html" class="nav-link ${currentPath === 'bmi.html' ? 'active' : ''}">حاسبة BMI</a></li>
              <li><a href="videos.html" class="nav-link ${currentPath === 'videos.html' ? 'active' : ''}">المكتبة المرئية</a></li>
              <li><a href="consultation.html" class="nav-link ${currentPath === 'consultation.html' ? 'active' : ''}">الاستشارة</a></li>
              <li>
                <a href="join-doctor.html" class="doctor-join-btn nav-link ${currentPath === 'join-doctor.html' ? 'active' : ''}">
                  <i class="ph ph-stethoscope"></i> انضم كطبيب
                </a>
              </li>
            </ul>
    
            ${userControls}
          </div>
        </div>
      </nav>
    `;
  
    container.innerHTML = navbarHTML;
  });
  
  window.toggleMobileMenu = function() {
    const navContent = document.getElementById('navContent');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (navContent.classList.contains('active')) {
      navContent.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      navContent.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  
  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }

  // --- Notifications Logic ---
  window.toggleNotifications = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
      if (!dropdown.classList.contains('hidden')) {
        loadNotifications();
      }
    }
  };

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const container = document.querySelector('.notification-container');
    if (dropdown && !dropdown.classList.contains('hidden') && container && !container.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  window.loadNotifications = async function() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('unreadBadge');
    
    if (!window.ApiService) return;
    
    try {
      const res = await window.ApiService.getNotifications(1, 10);
      if (res.success) {
        const notifications = res.data.notifications;
        const unreadCount = res.data.unreadCount;
        
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }

        if (notifications.length === 0) {
          list.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">لا توجد إشعارات</div>';
          return;
        }

        list.innerHTML = notifications.map(n => `
          <div class="notification-item ${n.is_read ? 'read' : 'unread'}" style="padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer; background: ${n.is_read ? 'transparent' : 'rgba(0, 91, 191, 0.05)'}" onclick="markNotificationAsRead('${n.id}')">
            <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 4px; color: ${n.is_read ? 'var(--sys-color-on-surface)' : 'var(--sys-color-primary)'}">
              <i class="ph-fill ph-dot" style="display: ${n.is_read ? 'none' : 'inline'}; color: var(--sys-color-primary); margin-left: 4px;"></i>
              ${n.title}
            </div>
            <div style="font-size: 0.85rem; color: var(--sys-color-on-surface-variant); line-height: 1.4;">${n.body}</div>
            <div style="font-size: 0.75rem; color: var(--sys-color-outline); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
              <i class="ph ph-clock"></i>
              ${new Date(n.created_at).toLocaleString('ar-EG')}
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      list.innerHTML = '<div style="text-align: center; color: var(--sys-color-error); padding: 20px;">حدث خطأ أثناء تحميل الإشعارات</div>';
    }
  };

  window.markNotificationAsRead = async function(id) {
    if (!window.ApiService) return;
    try {
      await window.ApiService.markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  window.markAllNotificationsAsRead = async function() {
    if (!window.ApiService) return;
    try {
      await window.ApiService.markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
      setTimeout(loadNotifications, 1000);
    }
  });
