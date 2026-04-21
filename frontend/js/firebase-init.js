import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

// TODO: استبدل هذه الإعدادات بإعدادات مشروعك في Firebase (من إعدادات المشروع -> تطبيق الويب)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "healthcarekg",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  // تهيئة Firebase
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // دالة لإنشاء مودال مخصص لطلب الإذن
  function showPermissionModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(17, 28, 45, 0.4); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 11000;
        animation: fadeIn 0.3s ease;
      `;
      
      modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 32px; width: 90%; max-width: 450px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
          <div style="width: 80px; height: 80px; background: rgba(0, 91, 191, 0.1); color: #005bbf; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 24px;">
            <i class="ph-fill ph-bell-ringing"></i>
          </div>
          <h2 style="font-family: 'Cairo', sans-serif; font-size: 1.5rem; color: #111c2d; margin-bottom: 12px;">تفعيل التنبيهات؟</h2>
          <p style="font-family: 'Cairo', sans-serif; color: #414754; line-height: 1.6; margin-bottom: 32px;">هل ترغب في استقبال إشعارات فورية حول المواعيد، الاستشارات الطبية، والنصائح الصحية الهامة؟</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="btnAllow" style="background: #005bbf; color: white; border: none; padding: 12px 32px; border-radius: 14px; font-family: 'Cairo', sans-serif; font-weight: 700; cursor: pointer; flex: 1;">تفعيل الآن</button>
            <button id="btnDeny" style="background: #f0f3ff; color: #414754; border: none; padding: 12px 24px; border-radius: 14px; font-family: 'Cairo', sans-serif; cursor: pointer;">ليس الآن</button>
          </div>
        </div>
        <style>
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#btnAllow').onclick = () => {
        modal.remove();
        resolve(true);
      };
      modal.querySelector('#btnDeny').onclick = () => {
        modal.remove();
        resolve(false);
      };
    });
  }

  // طلب الإذن لإرسال الإشعارات
  async function requestNotificationPermission() {
    if (Notification.permission === 'granted') {
       setupToken();
       return;
    }

    if (Notification.permission === 'denied') return;

    const userAgreed = await showPermissionModal();
    if (!userAgreed) return;

    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setupToken();
    }
  }

  async function setupToken() {
      try {
        const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' });
        if (currentToken) {
          if (window.ApiService && localStorage.getItem('token')) {
            await window.ApiService.updateFcmToken(currentToken);
            if(window.showToast) window.showToast('تم تفعيل الإشعارات بنجاح!', 'success');
          }
        }
      } catch (err) {
        console.error('Error setup token:', err);
      }
  }

  // الاستماع للإشعارات في واجهة المستخدم (Foreground)
  onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // يمكنك هنا عرض الإشعار كـ Toast باستخدام دالة إظهار الرسائل المتوفرة في مشروعك
    if (window.showToast) {
      window.showToast(payload.notification.title + " - " + payload.notification.body, 'info');
    }
    // تحديث قائمة الإشعارات إذا كانت دالة loadNotifications موجودة
    if (window.loadNotifications) {
      window.loadNotifications();
    }
  });

  // تفعيل عند تحميل الصفحة إذا كان المستخدم مسجل دخول
  document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
      requestNotificationPermission();
    }
  });

} catch (error) {
  console.error("Firebase Initialization Error:", error);
}
