import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const messaging = getMessaging(app);

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log('FCM token:', token);
          // TODO: send token to your backend to associate with the user
        }

        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          const { title, body } = payload.notification || {};
          if (title && Notification.permission === 'granted') {
            new Notification(title, { body });
          }
        });
      } catch (err) {
        console.error('FCM setup failed:', err);
      }
    };

    if (Notification.permission === 'granted') {
      setup();
    }
  }, []);
}