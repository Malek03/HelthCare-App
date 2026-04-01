const { getMessaging } = require('../config/firebase');
const prisma = require('../config/database');

/**
 * Send a push notification to a specific user via Firebase
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        title,
        body,
        type: data.type || 'SYSTEM',
        data: JSON.stringify(data),
      },
    });

    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcm_token: true },
    });

    if (user && user.fcm_token) {
      const messaging = getMessaging();
      if (messaging) {
        await messaging.send({
          token: user.fcm_token,
          notification: { title, body },
          data: { ...data, notificationId: notification.id },
        });
        console.log(`✅ Push notification sent to user ${userId}`);
      }
    }

    return notification;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    // Still save the notification even if push fails
    return null;
  }
};

/**
 * Send push notification to all users (broadcast)
 */
const sendBroadcastNotification = async (title, body, type = 'HEALTH_TIP') => {
  try {
    const users = await prisma.user.findMany({
      where: { is_banned: false, is_active: true },
      select: { id: true, fcm_token: true },
    });

    // Save notifications for all users
    const notifications = await prisma.notification.createMany({
      data: users.map((user) => ({
        user_id: user.id,
        title,
        body,
        type,
      })),
    });

    // Send push to users with FCM tokens
    const messaging = getMessaging();
    if (messaging) {
      const tokens = users.filter((u) => u.fcm_token).map((u) => u.fcm_token);
      if (tokens.length > 0) {
        // Send in batches of 500 (Firebase limit)
        for (let i = 0; i < tokens.length; i += 500) {
          const batch = tokens.slice(i, i + 500);
          await messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title, body },
            data: { type },
          });
        }
        console.log(`✅ Broadcast notification sent to ${tokens.length} users`);
      }
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error sending broadcast:', error.message);
    return null;
  }
};

module.exports = { sendPushNotification, sendBroadcastNotification };
