import type { WahlkampfPhase, WahlkampfStep, WahlkampfStepId } from "./types";
import {
  KEYS,
  PQ_EVENTS,
  emit,
  readJSON,
  writeJSON,
  loadProgress,
  saveProgress,
} from "./storage";

/* ============================================================
   Monats-Wahlkampf cycle.
     • MONTH_LEN = 30. Elections on day 1, 31, 61, 91…
     • Day 1     = Wahlkampf-Intensiv (all 9 steps in one sitting)
     • Day 29/30/31 = 3-day campaign phase, 3 steps per day
     • Every other day = a daily mission (KI-Redaktion)
   Ported from the prototype's screen-home.jsx + screen-mission.jsx.
   ============================================================ */

export const WK_STEPS: WahlkampfStep[] = [
  { id: "themen", label: "Themen-Setzung", short: "Themen", k: "briefing", desc: "Wähle deine 3 Kernthemen" },
  { id: "programm", label: "Wahlprogramm", short: "Programm", k: "briefing", desc: "Top-5 Versprechen" },
  { id: "plakat", label: "Wahlplakat", short: "Plakat", k: "meeting", desc: "Foto, Slogan, Farbe" },
  { id: "rede", label: "Antrittsrede", short: "Rede", k: "briefing", desc: "Auftakt im Bundestag" },
  { id: "social", label: "Social Media", short: "Social", k: "meeting", desc: "TikTok- & Insta-Plan" },
  { id: "presse", label: "Pressekonferenz", short: "Presse", k: "meeting", desc: "Hauptstadt-Korrespondenten" },
  { id: "tv", label: "TV-Triell", short: "TV", k: "tv", desc: "3 Fragen live im Studio" },
  { id: "tour", label: "Wahlkampftour", short: "Tour", k: "decision", desc: "Markt & Hausbesuche" },
  { id: "wahl", label: "Wahlsonntag", short: "Wahl", k: "vote", desc: "Hochrechnung 18:00" },
];

export const WK_STEP_BY_ID: Record<string, WahlkampfStep> = Object.fromEntries(
  WK_STEPS.map((s) => [s.id, s]),
);

export const MONTH_LEN = 30;
export const TOTAL_DAYS = 100;

/* Election day for a given day: 1, 31, 61… */
export function electionDayFor(day: number): number {
  if (day <= 1) return 1;
  return Math.ceil((day - 1) / MONTH_LEN) * MONTH_LEN + 1;
}

/* Info about the campaign phase on a given day. */
export function wahlkampfFor(day: number): WahlkampfPhase {
  if (day === 1) {
    return {
      active: true,
      intensive: true,
      electionDay: 1,
      dayInPhase: 1,
      totalPhaseDays: 1,
      stepsToday: WK_STEPS.map((s) => s.id),
    };
  }
  const eDay = electionDayFor(day);
  const daysOut = eDay - day;
  if (daysOut >= 0 && daysOut <= 2) {
    const dayInPhase = 3 - daysOut;
    const startIdx = (dayInPhase - 1) * 3;
    return {
      active: true,
      intensive: false,
      electionDay: eDay,
      dayInPhase,
      totalPhaseDays: 3,
      stepsToday: WK_STEPS.slice(startIdx, startIdx + 3).map((s) => s.id),
    };
  }
  return { active: false, electionDay: eDay, daysOut };
}

/* ─── Daily-mission label (rotates) ───────────────────────── */
export const DAILY_MOCK = [
  { k: "briefing", label: "Tages-Briefing" },
  { k: "decision", label: "Tages-Entscheidung" },
  { k: "crisis", label: "Lage des Tages" },
  { k: "meeting", label: "Bundestags-Sitzung" },
  { k: "tv", label: "Sender-Anruf" },
];
export function dailyFor(day: number): { k: string; label: string } | null {
  if (day === 1) return null;
  return DAILY_MOCK[(day - 2) % DAILY_MOCK.length];
}

/* ─── Wahlkampf-step progress storage ─────────────────────── */
type WKProgress = Record<string, WahlkampfStepId[]>;

export function loadWKProgress(): WKProgress {
  return readJSON<WKProgress>(KEYS.wahlkampf, {});
}
function saveWKProgress(p: WKProgress) {
  writeJSON(KEYS.wahlkampf, p);
  emit(PQ_EVENTS.wahlkampf);
}
export function getStepsDone(electionDay: number): WahlkampfStepId[] {
  return loadWKProgress()[String(electionDay)] || [];
}
export function markStepDone(electionDay: number, stepId: WahlkampfStepId) {
  const p = loadWKProgress();
  const k = String(electionDay);
  p[k] = p[k] || [];
  if (!p[k].includes(stepId)) p[k].push(stepId);
  saveWKProgress(p);
}
export function resetStepsFor(electionDay: number) {
  const p = loadWKProgress();
  delete p[String(electionDay)];
  saveWKProgress(p);
}

/* Next unfinished step for today (or null). */
export function nextStepToday(): WahlkampfStepId | null {
  const wk = wahlkampfFor(loadProgress().currentDay);
  if (!wk.active || !wk.stepsToday) return null;
  const done = getStepsDone(wk.electionDay);
  return wk.stepsToday.find((id) => !done.includes(id)) || null;
}

/* ─── Day completion ──────────────────────────────────────── */
/* Advance the day if everything required is done. The single source
   of truth for currentDay / streak / completedDays. */
export function maybeAdvanceDay() {
  const p = loadProgress();
  const day = p.currentDay;
  const wk = wahlkampfFor(day);
  const wkDone = getStepsDone(wk.electionDay);
  const dailyDone = (p.dailyDone || []).includes(day);

  let complete = false;
  if (wk.intensive) {
    complete = (wk.stepsToday || []).every((id) => wkDone.includes(id));
  } else if (wk.active) {
    complete = dailyDone && (wk.stepsToday || []).every((id) => wkDone.includes(id));
  } else {
    complete = dailyDone;
  }

  if (complete && !p.completedDays.includes(day)) {
    p.completedDays.push(day);
    p.streak = (p.streak || 0) + 1;
    p.currentDay = Math.min(day + 1, TOTAL_DAYS);
    saveProgress(p);
  }
}

/* Finish the daily mission: mark done, +50 XP, then maybe advance. */
export function completeDailyMission() {
  const p = loadProgress();
  p.dailyDone = p.dailyDone || [];
  if (!p.dailyDone.includes(p.currentDay)) p.dailyDone.push(p.currentDay);
  p.xp = (p.xp || 0) + 50;
  saveProgress(p);
  maybeAdvanceDay();
}

/* Finish a Wahlkampf step: mark done, add XP, then maybe advance. */
export function completeWahlkampfStep(stepId: WahlkampfStepId, xp = 50) {
  const day = loadProgress().currentDay;
  const wk = wahlkampfFor(day);
  markStepDone(wk.electionDay, stepId);
  const p = loadProgress();
  p.xp = (p.xp || 0) + xp;
  saveProgress(p);
  maybeAdvanceDay();
}

/* Post-election Bundeshaushalt mission award (no day advance). */
export function awardXp(xp: number) {
  const p = loadProgress();
  p.xp = (p.xp || 0) + xp;
  saveProgress(p);
}
