import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * ネイティブ通知をタップした際に、ホーム（今日の確認）へ遷移させる。
 */
export function useNativeNotificationTaps(onTap: () => void) {
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = LocalNotifications.addListener("localNotificationActionPerformed", () => {
      onTapRef.current();
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);
}
