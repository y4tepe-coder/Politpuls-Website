/* Shared domain types for Politpuls. Ported from iOS Models/Types.swift. */

export type Skin = "clean" | "paper" | "dark";
export type MascotStyle = "bold" | "line" | "mosaic";
export type Role = "kandidat" | "kanzler" | "minister" | "opposition";
export type Stance = "ja" | "neutral" | "nein";
export type Gender = "m" | "w" | "d";
export type PartyId =
  | "cdu"
  | "spd"
  | "gruene"
  | "fdp"
  | "linke"
  | "afd"
  | "bsw"
  | "eigen";

export type Difficulty = "einfach" | "mittel" | "schwer" | "extrem";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  einfach: "Einfach",
  mittel: "Mittel",
  schwer: "Schwer",
  extrem: "Extrem schwer",
};

export const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  einfach: "Viele Erklärungen, milde Folgen — ideal zum Reinkommen.",
  mittel: "Ausgewogen: realistische Folgen, faire Hinweise.",
  schwer: "Härtere Konsequenzen, wenige Hilfen — für Erfahrene.",
  extrem: "Gnadenlos: maximale Folgen, keine Hinweise.",
};

/** Migrate legacy difficulty values from older save states. */
export function normalizeDifficulty(raw: string | undefined | null): Difficulty {
  switch (raw) {
    case "einfach":
    case "einsteiger":
      return "einfach";
    case "schwer":
    case "profi":
      return "schwer";
    case "extrem":
      return "extrem";
    default:
      return "mittel";
  }
}

/** Geschlechtsgerechter Rollen-Titel. */
export function roleTitle(role: Role, gender?: string | null): string {
  switch (role) {
    case "kandidat":
      return gender === "m" ? "Kandidat" : gender === "w" ? "Kandidatin" : "Kandidat:in";
    case "kanzler":
      return gender === "m"
        ? "Bundeskanzler"
        : gender === "w"
          ? "Bundeskanzlerin"
          : "Bundeskanzler:in";
    case "minister":
      return gender === "m" ? "Minister" : gender === "w" ? "Ministerin" : "Minister:in";
    case "opposition":
      return "Opposition";
  }
}

/* A freely built style avatar (no real politicians). */
export interface Character {
  gender: Gender;
  skin: number;
  hair: number;
  hairColor: number;
  glasses: boolean;
  beard: number;
  suit: number;
  tie: number;
  expression: number;
  accessory: number;
  presetId?: string;
  kind?: string;
  photo?: string;
}

export interface ElectionResult {
  id: string;
  pct: number;
  mine: boolean;
}

export interface Profile {
  role?: Role;
  name?: string;
  character?: Character;
  party?: string | null;
  kernthemen?: string[];
  positions?: Record<string, Stance>;
  traits?: string[];
  alignment?: Record<string, number>;
  topParty?: string;
  electedRole?: Role;
  electionResults?: ElectionResult[];
  coalitionParties?: string[];
  /** Gewähltes Ministerium nach der Koalitionsverhandlung (KOA_RESSORTS-id). */
  ressort?: string;
  gender?: Gender;
  age?: number;
  difficulty?: Difficulty;
}

export interface Session {
  user?: { provider: string } | null;
  onboarded?: boolean;
  profile?: Profile;
}

export interface Progress {
  completedDays: number[];
  currentDay: number;
  streak: number;
  xp: number;
  startedAt: number;
  dailyDone?: number[];
  /** IDs der bereits gezeigten Tutorial-Erklärungen. Append-only. */
  tutorialsSeen?: string[];
}

export interface MissionRecord {
  score: number;
  details?: Record<string, unknown>;
  at: number;
}

export interface CampaignState {
  missions: Record<string, MissionRecord>;
  aiAnalysis: string | null;
  /** Wahlversprechen-ids — gesetzt vom Programm-Schritt, gelesen vom Bundeshaushalt. */
  programmPicks?: string[];
  /** Aufgebaute Parteistärke — wächst über Wahlkämpfe hinweg. */
  partyStanding?: number;
}

/** The campaign poster the user designs each cycle. */
export interface PlakatState {
  slogan: string;
  subline: string;
  movement: string;
  candidate: string;
  role: string;
  layout: "classic" | "modern" | "bold";
  accent: "red" | "gold" | "black";
  motif: string;
  saved: boolean;
}

/* Daily-mission dossier (Redaktion) */
export interface DossierOutlet {
  name: string;
  dot: string;
  kicker: string;
}
export interface DossierPress {
  name: string;
  role: string;
  initials: string;
  gradient: string;
}
export interface DossierDelta {
  label: string;
  delta: number;
  unit: string;
  good: boolean;
  note?: string;
}
export interface DossierChoice {
  id: string;
  tag: string;
  tone: "gold" | "red" | "dark" | "blue";
  label: string;
  bullets: string[];
  bildQuestion: string;
  presets: string[];
  deltas: DossierDelta[];
}
export interface DossierStat {
  value: string;
  unit?: string;
  caption?: string;
}

export interface DossierSource {
  title: string;
  outlet: string;
  url: string;
  date?: string;
}

export interface GlossarEntry {
  term: string;
  short: string;
  long?: string;
}

export interface Dossier {
  id: string;
  day: number;
  date: string;
  outlet: DossierOutlet;
  press: DossierPress;
  article: {
    kicker: string;
    headline: string;
    deck: string;
    lede: string;
    pull: string;
    byline: string;
    body?: string[];
    kennzahl?: DossierStat;
    streitfrage?: string;
    pro?: string[];
    contra?: string[];
    fuerdich?: string;
  };
  video: {
    channel: string;
    ticker: string;
    title: string;
    blurb: string;
    runtime: string;
    time: string;
    url?: string;
  };
  facts: string[];
  sources?: DossierSource[];
  glossar?: GlossarEntry[];
  prompt: Record<string, string>;
  choices: DossierChoice[];
}

/* ─── Wahlkampf cycle ─────────────────────────────────────────
   iOS-Stand: 4 Schritte (programm/plakat/tv/wahl). Themen, Rede,
   Social, Presse, Tour wurden bewusst gestrichen — die Themenwahl
   im Programm genügt, der Rest soll schnell gehen. */
export type WahlkampfStepId = "programm" | "plakat" | "tv" | "wahl";

export interface WahlkampfStep {
  id: WahlkampfStepId;
  label: string;
  short: string;
  k: string;
  desc: string;
}

export interface WahlkampfPhase {
  active: boolean;
  intensive?: boolean;
  electionDay: number;
  dayInPhase?: number;
  totalPhaseDays?: number;
  stepsToday?: WahlkampfStepId[];
  daysOut?: number;
}

/* ─── App navigation ──────────────────────────────────────── */
export type Stage = "splash" | "auth" | "onboarding" | "app";

export type Screen =
  | "home"
  | "phone"
  | "spectrum"
  | "profile"
  | "decision"
  | "plakat"
  | "wahlkampf"
  | "valuescheck"
  | "auth";

/** What the mission router is currently showing. */
export type MissionSlot =
  | { kind: "daily" }
  | { kind: "step"; step: WahlkampfStepId }
  | { kind: "haushalt" }
  | { kind: "koalition" };
