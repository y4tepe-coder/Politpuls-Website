import type { CampaignState, ElectionResult, Role, Stance } from "./types";
import { KEYS, PQ_EVENTS, emit, readJSON, writeJSON } from "./storage";

/* ============================================================
   Campaign tracking — where the election result becomes
   individual: mission scores + "Volks-Match" + party base.
   Ported from the PoliQuest prototype's campaign.jsx.
   ============================================================ */

/* Basis-Stimmen pro Partei (realitätsnah, Mai 2026). */
export const PQ_PARTY_BASE: Record<string, number> = {
  cdu: 27,
  afd: 17,
  spd: 16,
  gruene: 11,
  bsw: 7,
  fdp: 5,
  linke: 5,
  eigen: 3,
};

/* Wille des Volkes pro Aussage (siehe POSITIONS_CATALOGUE). */
export const POPULAR_STANCE: Record<string, Stance> = {
  k1: "nein",
  k2: "ja",
  k3: "ja",
  u1: "ja",
  u2: "neutral",
  u3: "ja",
  s1: "ja",
  s2: "ja",
  s3: "ja",
  w1: "neutral",
  w2: "nein",
  w3: "ja",
  si1: "neutral",
  si2: "ja",
  si3: "neutral",
  b1: "ja",
  b2: "ja",
  b3: "nein",
};

/* Themen, mit denen man im Wahlkampf besonders viele Stimmen holt. */
export const POPULAR_THEMES = new Set<string>([
  "migration",
  "wirtschaft",
  "sicherheit",
  "rente",
  "energie",
  "inflation",
  "buerokratie",
  "kanzler",
  "skandal",
]);

/* ─── Storage ─────────────────────────────────────────────── */
function defaultCampaign(): CampaignState {
  return { missions: {}, aiAnalysis: null };
}
export function loadCampaign(): CampaignState {
  return readJSON<CampaignState>(KEYS.campaign, defaultCampaign());
}
export function saveCampaign(c: CampaignState) {
  writeJSON(KEYS.campaign, c);
}
export function resetCampaign() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEYS.campaign);
    } catch {
      /* ignore */
    }
  }
}

export function recordMission(
  missionId: string,
  score: number,
  details: Record<string, unknown> = {},
) {
  const c = loadCampaign();
  c.missions[missionId] = { score: clamp01(score), details, at: Date.now() };
  saveCampaign(c);
  emit(PQ_EVENTS.campaign);
}

/* ─── Scoring ─────────────────────────────────────────────── */
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

/* Wie nah ist die Spieler:in am Volk? 0..1 */
export function popularAlignment(positions?: Record<string, Stance>): number {
  if (!positions) return 0.5;
  let weighted = 0;
  let total = 0;
  for (const [id, stance] of Object.entries(positions)) {
    const popular = POPULAR_STANCE[id];
    if (!popular) continue;
    total += 1;
    if (popular === stance) weighted += 1;
    else if (popular === "neutral" || stance === "neutral") weighted += 0.5;
  }
  return total > 0 ? weighted / total : 0.5;
}

export function missionAverage(): number {
  const ms = Object.values(loadCampaign().missions);
  if (ms.length === 0) return 0.5;
  return ms.reduce((s, m) => s + m.score, 0) / ms.length;
}

/* Gesamtscore: 60% Missionen + 40% Volks-Match. */
export function totalScore(positions?: Record<string, Stance>): number {
  return missionAverage() * 0.6 + popularAlignment(positions) * 0.4;
}

/* ─── Deterministischer Pseudo-Random aus Score + Partei ─────── */
function seedFromScore(score: number, party: string) {
  let h = 2166136261;
  const str = party + ":" + Math.round(score * 1000);
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) * 16777619;
  }
  return (n: number) => {
    h = (h ^ (n + 2654435761)) * 2654435761;
    return (h >>> 0) / 0xffffffff;
  };
}

/* ─── Wahlergebnis ────────────────────────────────────────── */
export function computeElectionResult(
  party: string,
  positions?: Record<string, Stance>,
): ElectionResult[] {
  if (!party) party = "eigen";
  const score = totalScore(positions);
  const base = PQ_PARTY_BASE[party] ?? 4;
  const modifier = score >= 0.5 ? (score - 0.5) * 2 * 28 : (score - 0.5) * 2 * 10;
  const ownSeeded = seedFromScore(score, party + ":own");
  const ownJitter = (ownSeeded(0) - 0.5) * 2 * 4;
  const myPct = clamp(base + modifier + ownJitter, 2, 55);

  const otherIds = Object.keys(PQ_PARTY_BASE).filter((id) => id !== party);
  const otherBaseSum = otherIds.reduce((s, id) => s + PQ_PARTY_BASE[id], 0);
  const remaining = 100 - myPct;
  const factor = remaining / otherBaseSum;

  const seeded = seedFromScore(score, party);
  let i = 0;
  const results: ElectionResult[] = otherIds.map((id) => {
    const jitter = (seeded(i++) - 0.5) * 2.6;
    return { id, pct: Math.max(1.5, PQ_PARTY_BASE[id] * factor + jitter), mine: false };
  });
  results.push({ id: party, pct: myPct, mine: true });

  const sum = results.reduce((s, r) => s + r.pct, 0);
  results.forEach((r) => {
    r.pct = round1((r.pct * 100) / sum);
  });

  return results.sort((a, b) => b.pct - a.pct);
}

/* Welche Koalitionen sind in DE realistisch? */
function combinationFeasible(ids: string[]): boolean {
  if (ids.includes("afd") && ids.length > 1) return false;
  if (ids.includes("bsw") && ids.includes("gruene")) return false;
  if (ids.includes("linke") && ids.includes("cdu")) return false;
  if (ids.includes("linke") && ids.includes("fdp")) return false;
  return true;
}

/* 1. Platz → Kanzler:in. Sonst Koalitions-Permutationen prüfen. */
export function determineRole(results: ElectionResult[], ownPartyId: string): Role {
  if (!results?.length) return "opposition";
  const mineIdx = results.findIndex((r) => r.id === ownPartyId);
  if (mineIdx < 0) return "opposition";
  if (mineIdx === 0) return "kanzler";

  const idx = [1, 2, 3, 4];
  const tryCombos: number[][] = [];
  for (const a of idx) {
    if (!results[a]) continue;
    tryCombos.push([0, a]);
    for (const b of idx) {
      if (b <= a || !results[b]) continue;
      tryCombos.push([0, a, b]);
    }
  }
  for (const combo of tryCombos) {
    const ids = combo.map((i) => results[i].id);
    const sum = combo.reduce((s, i) => s + results[i].pct, 0);
    if (sum <= 50) continue;
    if (!combinationFeasible(ids)) continue;
    if (combo.includes(mineIdx)) return "minister";
    return "opposition";
  }
  return "opposition";
}

/* Welche Parteien sind in der Regierung? */
export function regierungsParteien(
  results: ElectionResult[],
  ownPartyId: string,
): string[] {
  const role = determineRole(results, ownPartyId);
  const top = results[0];
  if (!top) return [];
  if (role === "opposition") {
    for (let a = 1; a <= 4; a++) {
      if (!results[a]) continue;
      const sum = top.pct + results[a].pct;
      if (sum > 50 && combinationFeasible([top.id, results[a].id])) {
        return [top.id, results[a].id];
      }
      for (let b = a + 1; b <= 4; b++) {
        if (!results[b]) continue;
        const s2 = sum + results[b].pct;
        if (s2 > 50 && combinationFeasible([top.id, results[a].id, results[b].id])) {
          return [top.id, results[a].id, results[b].id];
        }
      }
    }
    return [top.id];
  }
  const mineIdx = results.findIndex((r) => r.id === ownPartyId);
  if (mineIdx === 0) {
    for (let a = 1; a <= 4; a++) {
      if (!results[a]) continue;
      const sum = top.pct + results[a].pct;
      if (sum > 50 && combinationFeasible([top.id, results[a].id])) {
        return [top.id, results[a].id];
      }
    }
    return [top.id];
  }
  for (let a = 1; a <= 4; a++) {
    if (a === mineIdx) continue;
    if (!results[a]) continue;
    const sum = top.pct + results[a].pct + results[mineIdx].pct;
    if (
      a === 1 &&
      top.pct + results[mineIdx].pct > 50 &&
      combinationFeasible([top.id, results[mineIdx].id])
    ) {
      return [top.id, results[mineIdx].id];
    }
    if (
      sum > 50 &&
      combinationFeasible([top.id, results[a].id, results[mineIdx].id])
    ) {
      return [top.id, results[a].id, results[mineIdx].id];
    }
  }
  return [top.id, ownPartyId];
}

/* Alle realistischen Regierungskoalitionen, in denen die eigene
   Partei mitregiert — zur Auswahl in der Koalitionsverhandlung. */
export function moeglicheKoalitionen(
  results: ElectionResult[],
  ownPartyId: string,
): string[][] {
  if (!results?.length) return [];
  const top = results[0];
  const topId = top.id;
  const pct = (id: string) => results.find((r) => r.id === id)?.pct ?? 0;

  /* Nur die Top-5 sind realistische Regierungsparteien. */
  const candidates = results
    .slice(0, 5)
    .map((r) => r.id)
    .filter((id) => id !== topId);

  const combos: string[][] = [];
  for (let i = 0; i < candidates.length; i++) {
    combos.push([topId, candidates[i]]);
    for (let j = i + 1; j < candidates.length; j++) {
      combos.push([topId, candidates[i], candidates[j]]);
    }
  }

  const seen = new Set<string>();
  let found: string[][] = [];
  for (const combo of combos) {
    if (!combo.includes(ownPartyId)) continue;
    if (!combinationFeasible(combo)) continue;
    if (combo.reduce((s, id) => s + pct(id), 0) <= 50.5) continue;
    const sorted = [...combo].sort((a, b) => pct(b) - pct(a));
    const key = sorted.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      found.push(sorted);
    }
  }
  /* Wenige Partner zuerst, dann knappste Mehrheit zuerst. */
  found.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return (
      a.reduce((s, id) => s + pct(id), 0) -
      b.reduce((s, id) => s + pct(id), 0)
    );
  });
  if (found.length === 0) {
    const auto = regierungsParteien(results, ownPartyId);
    if (auto.length > 0) found = [auto];
  }
  return found.slice(0, 6);
}
