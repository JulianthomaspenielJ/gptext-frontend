import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
// const vapidKey = "BJWibAs4RiroVJ41cjxDXKc3wFaDPVWSJ6VIS5nC6IKbch6HnP1OXXRUOJEBZuU62fPbGmRgr0n2Ia1w416KXAk";
// const vapidKey="BIHR2tcExxYR_XEoCWHFA0SVQpRAGF_7q3c50okew9k7CwBkHWg4TAqnyr9qPrMERvkrwgUmjRQNCOzuhUndkv0"
// console.log("fggfdgfdfgdfgd",import.meta.env.VITE_FIREBASE_VAPID_KEY)
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    // console.log("🔥 FCM Token:", token);

    // TODO: send token to backend
    return token;
  } catch (err) {
    console.error("FCM error:", err);
    return null;
  }
};

/**
 * Foreground message listener
 */
export const onMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};
