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
          
          const res = await window.ApiService.login(email, password);
          if (res.token) {
            localStorage.setItem('token', res.token);
            // Optionally fetch 'me' to get role and name
            const meRes = await window.ApiService.getMe();
            localStorage.setItem('name', meRes.data.name);
            localStorage.setItem('role', meRes.data.role);
            localStorage.setItem('userId', meRes.data.id);
            
            // Redirect based on role
            if (meRes.data.role === 'DOCTOR') {
                window.location.href = 'doctor-dashboard.html';
            } else if (meRes.data.role === 'ADMIN') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
          }
        } catch (err) {
          alert('فشل تسجيل الدخول: ' + err.message);
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
          alert('تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول');
          window.location.href = 'login.html';
        } catch (err) {
          alert('فشل التسجيل: ' + err.message);
          btn.innerHTML = 'إنشاء الحساب';
          btn.disabled = false;
        }
      });
    }
  
    // 3. Join Doctor App Logic
    const joinForm = document.getElementById('joinDoctorForm');
    if (joinForm) {
      joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!localStorage.getItem('token')) {
            alert('الرجاء تسجيل الدخول كمستخدم للتمكن من تقديم طلب الانضمام.');
            window.location.href = 'login.html';
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
            formData.append('personal_photo', personalPhotoInput.files[0]);
        }

        const documentsInput = document.getElementById('documents');
        if (documentsInput.files[0]) {
            formData.append('documents', documentsInput.files[0]);
        }
        
        try {
          btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري إرسال الطلب...';
          btn.disabled = true;
          
          await window.ApiService.applyAsDoctor(formData);
          
          btn.style.display = 'none';
          document.getElementById('joinSuccess').style.display = 'block';
        } catch (err) {
          errBox.textContent = 'حدث خطأ: ' + err.message;
          errBox.style.display = 'block';
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
