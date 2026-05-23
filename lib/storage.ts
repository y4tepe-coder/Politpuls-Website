import type { Progress, Session, Profile } from "./types";

/* ============================================================
   localStorage layer. SSR-safe — every accessor guards window.
   Cross-component refresh uses window CustomEvents, mirroring the
   PoliQuest prototype's `pq:*-updated` event bus.
   ============================================================ */

export const KEYS = {
  session: "pq.session.v1",
  progress: "pq.progress.v1",
  campaign: "pq.campaign.v1",
  wahlkampf: "pq.wahlkampf.v1",
  plakat: "pq.plakat.v1",
  readIds: "pq.readIds",
  chatHistory: "pq.chatHistory",
} as const;

export const PQ_EVENTS = {
  progress: "pq:progress-updated",
  wahlkampf: "pq:wk-progress-updated",
  campaign: "pq:campaign-updated",
  session: "pq:session-updated",
} as const;

export function emit(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    /* ignore */
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

/* ─── Session ─────────────────────────────────────────────── */
export function loadSession(): Session {
  return readJSON<Session>(KEYS.session, {});
}
export function saveSession(s: Session) {
  writeJSON(KEYS.session, s);
  emit(PQ_EVENTS.session);
}
/* Merge a patch into session.profile and persist. */
export function updateProfile(patch: Partial<Profile>) {
  const s = loadSession();
  s.profile = { ...(s.profile || {}), ...patch };
  saveSession(s);
}

/* ─── Day-progress ────────────────────────────────────────── */
export function defaultProgress(): Progress {
  return {
    completedDays: [],
    currentDay: 1,
    streak: 0,
    xp: 0,
    startedAt: Date.now(),
    dailyDone: [],
  };
}
export function loadProgress(): Progress {
  const p = readJSON<Progress>(KEYS.progress, defaultProgress());
  if (!p.dailyDone) p.dailyDone = [];
  if (!p.completedDays) p.completedDays = [];
  return p;
}
export function saveProgress(p: Progress) {
  writeJSON(KEYS.progress, p);
  emit(PQ_EVENTS.progress);
}

/* ─── Hard reset (the "back to day 1" path) ──────────────────── */
export function clearAllData() {
  if (typeof window === "undefined") return;
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("pq."))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  emit(PQ_EVENTS.progress);
  emit(PQ_EVENTS.session);
  emit(PQ_EVENTS.campaign);
  emit(PQ_EVENTS.wahlkampf);
}
