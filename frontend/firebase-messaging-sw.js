importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

fetch('/.env').then(res => res.text()).then(text => {
  const config = {};
  text.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/['"]/g, '');
      if (key === 'FIREBASE_API_KEY') config.apiKey = value;
      if (key === 'FIREBASE_AUTH_DOMAIN') config.authDomain = value;
      if (key === 'FIREBASE_PROJECT_ID') config.projectId = value;
      if (key === 'FIREBASE_STORAGE_BUCKET') config.storageBucket = value;
      if (key === 'FIREBASE_MESSAGING_SENDER_ID') config.messagingSenderId = value;
      if (key === 'FIREBASE_APP_ID') config.appId = value;
      if (key === 'FIREBASE_MEASUREMENT_ID') config.measurementId = value;
    }
  });

  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title || 'إشعار جديد';
    const notificationOptions = {
      body: payload.notification.body || '',
      icon: '/logo.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}).catch(err => {
  console.error("SW: Failed to load .env", err);
});


