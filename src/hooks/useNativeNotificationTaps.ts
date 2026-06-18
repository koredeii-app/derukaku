import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type ActionPerformed } from "@capacitor/local-notifications";

/**
 * ネイティブ通知をタップした際に、対応する予定のチェック画面へ直行させる。
 */
export function useNativeNotificationTaps(onTap: (scheduleId: string) => void) {
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action: ActionPerformed) => {
        const scheduleId = action.notification.extra?.scheduleId as string | undefined;
        if (scheduleId) onTapRef.current(scheduleId);
      },
    );

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);
}
