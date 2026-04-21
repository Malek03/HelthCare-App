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
        <a href="login.html" class="btn btn-outline">تسجيل الدخول</a>
        <a href="register.html" class="btn btn-primary" style="height: 40px; border-radius: 8px;">حساب جديد</a>
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
          <div class="notification-container" style="position: relative; display: flex; align-items: center;">
            <button onclick="toggleNotifications(event)" class="btn btn-icon" style="background: transparent; border: none; color: var(--sys-color-on-surface); font-size: 1.5rem; cursor: pointer; position: relative;">
              <i class="ph ph-bell"></i>
              <span id="unreadBadge" class="badge hidden" style="position: absolute; top: -5px; right: -5px; background: var(--sys-color-error); color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; font-weight: bold;">0</span>
            </button>
            <div id="notificationDropdown" class="notification-dropdown hidden" style="position: absolute; top: 100%; left: 0; background: #ffffff; border: 1px solid var(--sys-color-outline-variant); border-radius: 16px; width: 350px; max-height: 450px; overflow-y: auto; box-shadow: var(--sys-elevation-2); z-index: 1000; padding: 0; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--sys-color-outline-variant); position: sticky; top: 0; background: #ffffff; z-index: 10;">
                <h4 style="margin: 0; font-size: 1.1rem; color: var(--sys-color-on-surface); font-weight: 700;">الإشعارات</h4>
                <button onclick="markAllNotificationsAsRead()" style="background:none; border:none; color:var(--sys-color-primary); cursor:pointer; font-size:0.85rem; font-weight: 600;">تحديد الكل كمقروء</button>
              </div>
              <div id="notificationList" style="padding: 4px 0;">
                <div style="text-align: center; color: var(--sys-color-on-surface-variant); padding: 30px;">
                  <i class="ph ph-spinner ph-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
                  <p style="margin: 0;">جاري التحميل...</p>
                </div>
              </div>
            </div>
          </div>
          <a href="${dashboardLink}" class="btn btn-outline">
            <i class="ph ${userIcon}"></i> ${userName}
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
          padding: 0 var(--sys-spacing-24);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
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
          white-space: nowrap;
          z-index: 1001;
        }
        
        .nav-content {
          display: flex;
          align-items: center;
          gap: var(--sys-spacing-24);
          flex: 1;
          justify-content: flex-end;
        }

        .nav-links {
          display: flex;
          gap: var(--sys-spacing-16);
          margin: 0 var(--sys-spacing-8);
          list-style: none;
          padding: 0;
          align-items: center;
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
          white-space: nowrap;
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
          white-space: nowrap;
        }

        .nav-controls {
          gap: 16px;
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--sys-color-primary);
          font-size: 2rem;
          cursor: pointer;
          z-index: 1001;
        }
  
        @media (max-width: 992px) {
          .mobile-menu-btn {
            display: block;
          }
          
          .nav-content {
            position: fixed;
            top: 0;
            right: -100%;
            bottom: 0;
            width: 280px;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 100px var(--sys-spacing-24) var(--sys-spacing-24);
            gap: var(--sys-spacing-24);
            transition: right 0.3s ease-in-out;
            z-index: 1000;
            overflow-y: auto;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
          }
          
          .nav-content.active {
            right: 0;
          }

          .nav-links {
            flex-direction: column;
            width: 100%;
            align-items: flex-start;
          }

          .nav-links li {
            width: 100%;
          }

          .nav-link {
            display: block;
            width: 100%;
            padding: 12px 0;
            border-bottom: 1px solid var(--sys-color-surface-variant);
          }

          .nav-controls {
            flex-direction: column;
            width: 100%;
            align-items: flex-start;
            gap: 12px;
          }

          .nav-controls .btn {
            width: 100%;
            text-align: center;
            justify-content: center;
            margin-bottom: 12px;
          }
          
          .notification-container {
             width: 100%;
          }
          .notification-dropdown {
             position: static !important;
             width: 100% !important;
             margin-top: 10px !important;
             box-shadow: none !important;
             border: 1px solid var(--sys-color-outline-variant) !important;
          }
        }

        .hidden { display: none !important; }
        
        /* Mobile Overlay */
        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .mobile-overlay.active {
          display: block;
          opacity: 1;
        }
      </style>
  
      <nav class="glass-nav">
        <div class="custom-navbar container">
          <a href="index.html" class="nav-logo">
            <i class="ph-fill ph-heartbeat"></i> المنصة الطبية
          </a>
          
          <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
            <i class="ph ph-list"></i>
          </button>
          
          <div class="mobile-overlay" id="mobileOverlay" onclick="toggleMobileMenu()"></div>

          <div class="nav-content" id="navContent">
            <ul class="nav-links">
              <li><a href="index.html" class="nav-link ${currentPath === 'index.html' ? 'active' : ''}">الرئيسية</a></li>
              <li><a href="doctors.html" class="nav-link ${currentPath === 'doctors.html' ? 'active' : ''}">الأطباء</a></li>
              <li><a href="bmi.html" class="nav-link ${currentPath === 'bmi.html' ? 'active' : ''}">حاسبة BMI</a></li>
              <li><a href="videos.html" class="nav-link ${currentPath === 'videos.html' ? 'active' : ''}">المكتبة المرئية</a></li>
              <li><a href="consultation.html" class="nav-link ${currentPath === 'consultation.html' ? 'active' : ''}">الاستشارة الطبية</a></li>
              <li>
                <a href="join-doctor.html" class="doctor-join-btn">
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
    const menuBtn = document.querySelector('.mobile-menu-btn i');
    
    if (navContent.classList.contains('active')) {
      navContent.classList.remove('active');
      mobileOverlay.classList.remove('active');
      menuBtn.classList.replace('ph-x', 'ph-list');
      document.body.style.overflow = '';
    } else {
      navContent.classList.add('active');
      mobileOverlay.classList.add('active');
      menuBtn.classList.replace('ph-list', 'ph-x');
      document.body.style.overflow = 'hidden';
    }
  };
  
  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }

  // --- Notifications Logic ---
  window.toggleNotifications = function(event) {
    if (event) event.stopPropagation(); // منع انتشار الحدث لغلق القائمة فوراً
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
      if (!dropdown.classList.contains('hidden')) {
        loadNotifications();
      }
    }
  };

  // إغلاق القائمة عند النقر في أي مكان خارجها
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

  // Load badge on initial load if logged in
  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
      setTimeout(loadNotifications, 1000);
    }
  });
