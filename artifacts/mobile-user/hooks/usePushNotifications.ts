import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function isGranted(perms: unknown): boolean {
  if (!perms || typeof perms !== "object") return false;
  const p = perms as Record<string, unknown>;
  if (typeof p["granted"] === "boolean") return p["granted"];
  if (p["status"] === "granted") return true;
  return false;
}

export function usePushNotifications(token: string | null, baseUrl: string) {
  const registered = useRef(false);

  useEffect(() => {
    if (!token || registered.current || Platform.OS === "web") return;
    registered.current = true;

    (async () => {
      try {
        const existingPerms = await Notifications.getPermissionsAsync();
        let finalGranted = isGranted(existingPerms);
        if (!finalGranted) {
          const newPerms = await Notifications.requestPermissionsAsync();
          finalGranted = isGranted(newPerms);
        }
        if (!finalGranted) return;

        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        if (!expoPushToken.data) return;

        await fetch(`${baseUrl}/api/v1/users/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: expoPushToken.data }),
        });
      } catch (err) {
        console.warn("Push notification setup failed:", err);
      }
    })();
  }, [token, baseUrl]);
}

export function useNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const notifSub = onNotification
      ? Notifications.addNotificationReceivedListener(onNotification)
      : null;
    const responseSub = onResponse
      ? Notifications.addNotificationResponseReceivedListener(onResponse)
      : null;
    return () => {
      notifSub?.remove();
      responseSub?.remove();
    };
  }, [onNotification, onResponse]);
}
