"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXTENSION_BANNER_DISMISS_KEY,
  EXTENSION_PING_EVENT,
  EXTENSION_PONG_EVENT,
} from "@/lib/extension-config";

const CHECK_TIMEOUT_MS = 700;

export function useExtensionInstallDetection(isMobile: boolean) {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsChecking(false);
      return;
    }

    const dismissed =
      window.localStorage.getItem(EXTENSION_BANNER_DISMISS_KEY) === "1";
    setIsDismissed(dismissed);

    if (dismissed) {
      setIsChecking(false);
      return;
    }

    let settled = false;

    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      setIsChecking(false);
    }, CHECK_TIMEOUT_MS);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      const data = event.data;
      if (!data || data.type !== EXTENSION_PONG_EVENT) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      setIsInstalled(true);
      setIsChecking(false);
    };

    window.addEventListener("message", handleMessage);
    window.postMessage({ type: EXTENSION_PING_EVENT }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
    };
  }, [isMobile]);

  const dismissBanner = () => {
    window.localStorage.setItem(EXTENSION_BANNER_DISMISS_KEY, "1");
    setIsDismissed(true);
  };

  const showBanner = useMemo(() => {
    return !isMobile && !isChecking && !isInstalled && !isDismissed;
  }, [isChecking, isDismissed, isInstalled, isMobile]);

  return {
    showBanner,
    dismissBanner,
    isInstalled,
    isChecking,
  };
}
