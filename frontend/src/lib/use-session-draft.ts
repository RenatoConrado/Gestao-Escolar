"use client";

import { useEffect, useState } from "react";

export function useSessionDraft<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(key);
      if (saved !== null) {
        setValue(JSON.parse(saved) as T);
        setHasDraft(true);
      }
    } catch {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Storage may be disabled by the browser.
      }
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The form remains usable when browser storage is unavailable.
    }
  }, [key, ready, value]);

  const clearDraft = () => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // The form remains usable when browser storage is unavailable.
    }
  };

  return [value, setValue, clearDraft, ready, hasDraft] as const;
}
