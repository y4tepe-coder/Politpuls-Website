/* Shared domain types for Politpuls. */

export type Skin = "clean" | "paper" | "dark";
export type MascotStyle = "bold" | "line" | "mosaic";
export type Role = "kandidat" | "kanzler" | "minister" | "opposition";
export type Stance = "ja" | "neutral" | "nein";
export type PartyId =
  | "cdu"
  | "spd"
  | "gruene"
  | "fdp"
  | "linke"
  | "afd"
  | "bsw"
  | "eigen";

/* The four pre-made style avatars (no real politicians). */
export interface Character {
  gender: "m" | "f";
  skin: number;
  hair: number;
  hairColor: number;
  glasses: boolean;
  beard: number;
  suit: number;
  tie: number;
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
}

export interface MissionRecord {
  score: number;
  details: Record<string, unknown>;
  at: number;
}

export interface CampaignState {
  missions: Record<string, MissionRecord>;
  aiAnalysis: string | null;
}

/* Daily-mission dossier (KI-Redaktion) */
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
  };
  video: {
    channel: string;
    ticker: string;
    title: string;
    blurb: string;
    runtime: string;
    time: string;
  };
  facts: string[];
  prompt: Record<string, string>;
  choices: DossierChoice[];
}

/* The 9-step Wahlkampf */
export type WahlkampfStepId =
  | "themen"
  | "programm"
  | "plakat"
  | "rede"
  | "social"
  | "presse"
  | "tv"
  | "tour"
  | "wahl";

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
