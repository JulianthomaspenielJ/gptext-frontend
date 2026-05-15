import { useEffect } from "react";
import { requestPermission, onMessageListener } from "./notification";
import { toast } from "sonner";

const NotificationListener = () => {
  useEffect(() => {
    requestPermission();

    const unsubscribe = onMessageListener((payload) => {
      console.log("📩 Message received:", payload);

      // if (payload?.notification) {
      toast(payload.data.title ?? "Notification", {
        description: payload.data.body,
      });
      // }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
};

export default NotificationListener;
