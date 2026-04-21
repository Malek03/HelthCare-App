importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');


const firebaseConfig = {
  apiKey: "AIzaSyCrBNhI6w-yp8-Z5WtaUI90_DYkrRGMtsg",
  authDomain: "healthcarekg.firebaseapp.com",
  projectId: "healthcarekg",
  storageBucket: "healthcarekg.firebasestorage.app",
  messagingSenderId: "544266605571",
  appId: "1:544266605571:web:79e333a9e0245cbb192a36",
  measurementId: "G-DXMHZYZT4F"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // مسار الأيقونة
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
