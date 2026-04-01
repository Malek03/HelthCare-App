const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.warn('⚠️ Firebase service account file not found. Push notifications will be disabled.');
      firebaseApp = admin.initializeApp();
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }

  return firebaseApp;
};

const getMessaging = () => {
  if (!firebaseApp) initializeFirebase();
  try {
    return admin.messaging();
  } catch (error) {
    console.error('❌ Firebase Messaging not available:', error.message);
    return null;
  }
};

module.exports = { initializeFirebase, getMessaging };
