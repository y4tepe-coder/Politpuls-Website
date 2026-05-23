import type { Dossier, DossierChoice, DossierDelta, DossierSource, GlossarEntry } from "./types";
import { OUTLETS, PRESS } from "./kiRedaktion";

/* ============================================================
   DossierFeed — lädt das tägliche Redaktions-Dossier vom
   öffentlichen Politpuls-iOS-Repo (raw.githubusercontent.com).

   • Cache: localStorage `pq.feed.dossiers` (überlebt Reloads).
   • Refresh: beim App-Start async; failt still, falls offline.
   • Fallback: leere Liste → Decision-Screen nutzt seinen Mock.

   Kein API-Key nötig — das Repo ist public.
   ============================================================ */

const FEED_URL =
  "https://raw.githubusercontent.com/y4tepe-coder/Politpuls-iOS/main/feed/dossiers.json";
const CACHE_KEY = "pq.feed.dossiers";

interface FeedFile {
  version: number;
  generated: string;
  dossiers: FeedDossier[];
}

interface FeedDossier {
  id: string;
  date: string;
  outletId: string;
  pressId: string;
  article: {
    kicker: string;
    headline: string;
    deck: string;
    lede: string;
    pull: string;
    byline: string;
    body?: string[];
    kennzahl?: { value: string; unit?: string; caption?: string };
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
  choices: Array<{
    id: string;
    tag: string;
    tone: string;
    label: string;
    bullets: string[];
    bildQuestion: string;
    presets: string[];
    deltas: DossierDelta[];
  }>;
}

function isBrowser() {
  return typeof window !== "undefined";
}

/** Synchron: liest den letzten erfolgreich validierten Feed aus localStorage. */
export function loadCachedDossiers(): Dossier[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Dossier[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Async: holt das Feed übers Netz, validiert, mappt, cached. */
export async function refreshDossiers(): Promise<Dossier[] | null> {
  if (!isBrowser()) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const file = (await res.json()) as FeedFile;
    const mapped = file.dossiers.map(mapDossier);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    return mapped;
  } catch {
    return null;
  }
}

function mapDossier(d: FeedDossier): Dossier {
  const outlet = OUTLETS[d.outletId] ?? OUTLETS["rnd"];
  const press = PRESS[d.pressId] ?? PRESS["mira"];

  const choices: DossierChoice[] = d.choices.map((c) => ({
    id: c.id,
    tag: c.tag,
    tone: (["gold", "red", "dark", "blue"].includes(c.tone) ? c.tone : "dark") as DossierChoice["tone"],
    label: c.label,
    bullets: c.bullets,
    bildQuestion: c.bildQuestion,
    presets: c.presets,
    deltas: c.deltas,
  }));

  return {
    id: d.id,
    day: 0, // wird vom Konsumenten gesetzt (currentDay)
    date: d.date,
    outlet,
    press,
    article: {
      kicker: d.article.kicker,
      headline: d.article.headline,
      deck: d.article.deck,
      lede: d.article.lede,
      pull: d.article.pull,
      byline: d.article.byline,
      body: d.article.body,
      kennzahl: d.article.kennzahl,
      streitfrage: d.article.streitfrage,
      pro: d.article.pro,
      contra: d.article.contra,
      fuerdich: d.article.fuerdich,
    },
    video: d.video,
    facts: d.facts,
    sources: d.sources,
    glossar: d.glossar,
    prompt: d.prompt,
    choices,
  };
}
