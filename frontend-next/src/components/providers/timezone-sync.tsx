"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { fetchApi } from "@/lib/api";

// Detects the browser's IANA timezone and persists it to the user's profile
// whenever it differs from what's stored. Keeps day-boundaries/streaks/reminders
// correct for the user's real location, and backfills existing (UTC-defaulted)
// accounts on their next visit — no onboarding friction.
export function TimezoneSync() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const syncing = useRef(false);

  useEffect(() => {
    if (!user || syncing.current) return;

    let detected: string;
    try {
      detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!detected || detected === user.timezone) return;

    syncing.current = true;
    fetchApi<{ timezone: string }>("/settings/timezone", {
      method: "PUT",
      body: JSON.stringify({ timezone: detected }),
    })
      .then((res) => setUser({ ...user, timezone: res.timezone }))
      .catch(() => { /* non-critical; will retry next load */ })
      .finally(() => { syncing.current = false; });
  }, [user, setUser]);

  return null;
}
