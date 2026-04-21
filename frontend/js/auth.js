/**
 * Authentication and Doctor Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
  // 1. Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btnLogin');
        
        try {
          btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري التسجيل...';
          btn.disabled = true;
          
          // إرسال الطلب للباك إند
          const res = await window.ApiService.login(email, password);
          
          // التحقق من نجاح العملية ووجود التوكن بناءً على كود الباك إند الخاص بك
          if (res.success && res.data && res.data.token) {
            
            // 1. حفظ التوكن
            localStorage.setItem('token', res.data.token);
            
            // 2. استخراج بيانات المستخدم المرفقة وتخزينها مباشرة
            const user = res.data.user;
            localStorage.setItem('name', user.name);
            localStorage.setItem('role', user.role);
            localStorage.setItem('userId', user.id);
            if (user.avatar) localStorage.setItem('avatar', user.avatar); // حفظ الصورة إن وجدت
            
            // 3. التوجيه السريع بناءً على الصلاحية
            if (user.role === 'DOCTOR') {
                window.location.href = 'doctor-dashboard.html';
            } else if (user.role === 'ADMIN') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
            
          } else {
             // في حالة وجود خطأ في البيانات (مثل كلمة مرور خاطئة)
             if(window.showToast) window.showToast(res.message || 'بيانات الدخول غير صحيحة.', 'error');
             btn.innerHTML = 'تسجيل الدخول';
             btn.disabled = false;
          }
        } catch (err) {
          // في حالة انقطاع الاتصال بالسيرفر
          if(window.showToast) window.showToast('فشل تسجيل الدخول: ' + err.message, 'error');
          btn.innerHTML = 'تسجيل الدخول';
          btn.disabled = false;
        }
      });
    }
    // 2. Register Logic
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btnRegister');
        
        try {
          btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري الإنشاء...';
          btn.disabled = true;
          
          await window.ApiService.register(name, email, password);
          if(window.showToast) window.showToast('تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول', 'success');
          setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } catch (err) {
          if(window.showToast) window.showToast('فشل التسجيل: ' + err.message, 'error');
          btn.innerHTML = 'إنشاء الحساب';
          btn.disabled = false;
        }
      });
    }
  
    // 3. Join Doctor App Logic
    const joinForm = document.getElementById('joinDoctorForm');
    
    // Page load auth guard execution
    const authGuard = document.getElementById('auth-guard-container');
    const formContainer = document.getElementById('join-form-container');
    const token = localStorage.getItem('token');
    
    if (authGuard && formContainer) {
        if (!token) {
            authGuard.classList.remove('hidden');
        } else {
            formContainer.classList.remove('hidden');
        }
    }

    if (joinForm) {
      joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!token) {
            if(window.Toast) window.Toast.show('تنبيه هام', 'الرجاء تسجيل الدخول كمستخدم للتمكن من تقديم طلب الانضمام.', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 2500);
            return;
        }
        
        const btn = document.getElementById('btnJoinDoc');
        const errBox = document.getElementById('joinError');
        errBox.style.display = 'none';
        
        const formData = new FormData();
        formData.append('full_name', document.getElementById('full_name').value);
        formData.append('specialty', document.getElementById('specialty').value);
        formData.append('qualifications', document.getElementById('qualifications').value);
        formData.append('experience_years', document.getElementById('experience_years').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('location', document.getElementById('location').value);
        formData.append('bio', document.getElementById('bio').value);

        const personalPhotoInput = document.getElementById('personal_photo');
        if (personalPhotoInput.files[0]) {
            if (personalPhotoInput.files[0].size > 10 * 1024 * 1024) {
                if(window.Toast) window.Toast.show('تنبيه هام', 'الصورة الشخصية تتجاوز الحجم المسموح (10MB)', 'error');
                return;
            }
            formData.append('personal_photo', personalPhotoInput.files[0]);
        }

        const documentsInput = document.getElementById('documents');
        if (documentsInput.files[0]) {
            if (documentsInput.files[0].size > 10 * 1024 * 1024) {
                if(window.Toast) window.Toast.show('تنبيه هام', 'ملف السيرة الذاتية يتجاوز الحجم المسموح (10MB)', 'error');
                return;
            }
            formData.append('documents', documentsInput.files[0]);
        }
        
        try {
          btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري إرسال الطلب...';
          btn.disabled = true;
          
          // Use XMLHttpRequest for reliable file uploads
          const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://127.0.0.1:5000/api/doctors/apply');
            
            // Set auth header
            const authToken = localStorage.getItem('token');
            if (authToken) {
              xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            }
            
            // Do NOT set Content-Type — browser sets multipart/form-data boundary automatically
            
            xhr.onload = function() {
              try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve(response);
                } else {
                  reject(new Error(response.message || 'خطأ من السيرفر'));
                }
              } catch(e) {
                reject(new Error('خطأ غير متوقع في استجابة السيرفر'));
              }
            };
            
            xhr.onerror = function() {
              reject(new Error('تعذر الاتصال بالسيرفر. تأكد من أن السيرفر يعمل.'));
            };
            
            xhr.ontimeout = function() {
              reject(new Error('انتهت مهلة الاتصال. حاول مرة أخرى.'));
            };
            
            xhr.timeout = 60000; // 60 seconds timeout
            xhr.send(formData);
          });
          
          btn.style.display = 'none';
          document.getElementById('joinSuccess').style.display = 'block';
          if(window.Toast) window.Toast.show('عملية ناجحة', 'تم إرسال طلب الانضمام وتلقت الإدارة بياناتك بنجاح!', 'success');
        } catch (err) {
          errBox.textContent = 'حدث خطأ: ' + err.message;
          errBox.style.display = 'none';
          if(window.Toast) window.Toast.show('فشل في الإرسال', err.message || 'يرجى التحقق من صحة البيانات والمحاولة مجدداً.', 'error');
          
          btn.innerHTML = 'إرسال طلب الانضمام';
          btn.disabled = false;
        }
      });
    }
    
    // 4. File Input Name Display Logic
    const fileInputs = ['documents', 'personal_photo'];
    fileInputs.forEach(id => {
        const input = document.getElementById(id);
        const nameDisplay = document.getElementById(id + '-name');
        if (input && nameDisplay) {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    nameDisplay.textContent = e.target.files[0].name;
                    nameDisplay.style.color = 'var(--sys-color-primary)';
                    nameDisplay.style.fontWeight = '700';
                } else {
                    nameDisplay.textContent = 'لم يتم اختيار ملف';
                    nameDisplay.style.color = 'var(--sys-color-on-surface-variant)';
                    nameDisplay.style.fontWeight = '400';
                }
            });
        }
    });
});
