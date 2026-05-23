import type { Character, Stance } from "./types";

/* ============================================================
   Onboarding data — characters, themes, the 18-statement
   values catalogue, parties, traits.
   ============================================================ */

/* ─── Character presets (4 pre-made style avatars) ─────────── */
export interface CharacterPreset {
  id: string;
  name: string;
  label: string;
  char: Omit<Character, "presetId" | "kind" | "photo">;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  { id: "p1", name: "Mara",  label: "Pragmatisch",  char: { gender: "w", skin: 0, hair: 0, hairColor: 2, glasses: false, beard: 0, suit: 0, tie: 4, expression: 0, accessory: 0 } },
  { id: "p2", name: "Jonas", label: "Idealistisch", char: { gender: "m", skin: 0, hair: 2, hairColor: 1, glasses: false, beard: 0, suit: 1, tie: 1, expression: 0, accessory: 0 } },
  { id: "p3", name: "Yusuf", label: "Analytisch",   char: { gender: "m", skin: 2, hair: 0, hairColor: 0, glasses: true,  beard: 0, suit: 0, tie: 3, expression: 0, accessory: 0 } },
  { id: "p4", name: "Hanna", label: "Energisch",    char: { gender: "w", skin: 0, hair: 1, hairColor: 0, glasses: false, beard: 0, suit: 2, tie: 0, expression: 0, accessory: 0 } },
];

export function defaultCharacter(): Character {
  return { ...CHARACTER_PRESETS[0].char, presetId: "p1", kind: "avatar" };
}

export const SKIN_TONES = ["#F5D7B5", "#E5B991", "#C99576", "#8B5A3C"];
export const HAIR_STYLES_M = ["short", "side", "swept", "bald", "beardonly", "curly"];
export const HAIR_STYLES_F = ["bob", "long", "bun", "pixie", "curly", "ponytail"];
export const HAIR_COLORS = ["#2A1F18", "#7B4A2E", "#D4A85A", "#8E7560", "#5C5547"];
export const SUIT_COLORS = [
  { id: "navy", bg: "#1A2A4A" },
  { id: "charcoal", bg: "#2C2C2C" },
  { id: "wine", bg: "#5A1E25" },
  { id: "grey", bg: "#6E6E6E" },
];
export const TIE_COLORS = [
  { id: "red", bg: "#D81E26" },
  { id: "blue", bg: "#1B5FAE" },
  { id: "gold", bg: "#F6C414" },
  { id: "green", bg: "#1F6F4F" },
  { id: "none", bg: "#FFFFFF" },
];

/* ─── 3 Kernthemen catalogue (12 themes) ───────────────────── */
export interface Kernthema {
  id: string;
  cat: string;
  catColor: string;
  text: string;
  info: string;
}

export const KERNTHEMEN_CATALOGUE: Kernthema[] = [
  { id: "klimawende", cat: "Klima", catColor: "#2E9F5D", text: "Klimawende als Wirtschaftschance", info: "Erneuerbare Energien schaffen Arbeitsplätze und Innovationen. Streitfrage: Wer finanziert den Umbau — Steuerzahler, Unternehmen oder EU-Fonds?" },
  { id: "energiepreise", cat: "Klima", catColor: "#2E9F5D", text: "Energiepreise dauerhaft senken", info: "Hohe Strom- und Gaspreise belasten Haushalte und Industrie. Debatte: Staatliche Deckelung schützt Verbraucher, kann aber Investitionen hemmen." },
  { id: "wohnen", cat: "Soziales", catColor: "#B9343A", text: "Bezahlbares Wohnen für alle", info: "Mieten in Großstädten wachsen schneller als Löhne. Frage: Mietpreisbremse, mehr Neubau oder beides — und wer baut wirklich?" },
  { id: "faire_loehne", cat: "Soziales", catColor: "#B9343A", text: "Faire Löhne und sichere Rente", info: "Mindestlohn und Rentenstabilität sind zentrale Themen. Streitfrage: Wie viel können Arbeitgeber tragen, ohne Jobs abzubauen?" },
  { id: "entbuerokratisierung", cat: "Wirtschaft", catColor: "#1B5FAE", text: "Bürokratie abbauen, Wirtschaft befreien", info: "Deutschland gilt als Bürokratie-Weltmeister. Frage: Welche Vorschriften schützen Bürger — und welche blockieren Investitionen?" },
  { id: "innovation", cat: "Wirtschaft", catColor: "#1B5FAE", text: "Digitalisierung und Innovation vorantreiben", info: "Glasfaser, KI und E-Government hinken hinterher. Debatte: Staatliche Steuerung vs. Markttempo — wer setzt den Standard?" },
  { id: "migration", cat: "Sicherheit", catColor: "#2D2D44", text: "Migration ordnen, Integration fördern", info: "Asylanträge und Integrations­programme sind politisch heiß. Streitfrage: Mehr Kontrolle oder mehr Offenheit — was bringt Deutschland langfristig voran?" },
  { id: "innere_sicherheit", cat: "Sicherheit", catColor: "#2D2D44", text: "Sicherheit in jeder Straße", info: "Polizei, Justiz und Prävention. Frage: Mehr Befugnisse für Behörden oder mehr Investitionen in Sozialarbeit?" },
  { id: "bildungschancen", cat: "Bildung", catColor: "#C48A05", text: "Gleiche Bildungschancen für alle Kinder", info: "Bildungserfolg hängt stark von Herkunft ab. Debatte: Ganztagsschulen, kleinere Klassen — was wirkt am schnellsten?" },
  { id: "digitale_schule", cat: "Bildung", catColor: "#C48A05", text: "Schulen für die digitale Zukunft rüsten", info: "Tablets, Glasfaser, Lehrerfortbildung. Frage: Wer zahlt und kontrolliert — Bund, Länder oder Gemeinden?" },
  { id: "demokratie", cat: "Demokratie", catColor: "#7A6E48", text: "Demokratie stärken, Medien schützen", info: "Vertrauen in Institutionen steht unter Druck. Streitfrage: Wie unterscheidet man zulässige Kritik von gezielter Desinformation?" },
  { id: "europa", cat: "Außenpolitik", catColor: "#7A6E48", text: "Ein starkes, handlungsfähiges Europa", info: "EU-Reform und gemeinsame Sicherheitspolitik. Debatte: Mehr Souveränität an die EU abgeben oder nationale Kontrolle stärken?" },
];

/* ─── Parties (live data) ──────────────────────────────────── */
export interface LiveParty {
  id: string;
  short: string;
  name: string;
  color: string;
  text: string;
  vibe: string;
}

export const PQ_PARTIES_LIVE: LiveParty[] = [
  { id: "cdu", short: "CDU/CSU", name: "Christlich Demokratische Union", color: "#000000", text: "#FFFFFF", vibe: "Konservativ · Wirtschaftsnah" },
  { id: "spd", short: "SPD", name: "Sozialdemokratische Partei", color: "#E3000F", text: "#FFFFFF", vibe: "Sozial · Arbeitnehmer" },
  { id: "gruene", short: "Grüne", name: "Bündnis 90 / Die Grünen", color: "#1AA037", text: "#FFFFFF", vibe: "Öko · Progressiv" },
  { id: "fdp", short: "FDP", name: "Freie Demokratische Partei", color: "#FFCC00", text: "#1F1D17", vibe: "Liberal · Marktwirtschaft" },
  { id: "linke", short: "Linke", name: "Die Linke", color: "#BE3075", text: "#FFFFFF", vibe: "Sozial · Links" },
  { id: "afd", short: "AfD", name: "Alternative für Deutschland", color: "#009EE0", text: "#FFFFFF", vibe: "Rechts · Migrations­kritisch" },
  { id: "bsw", short: "BSW", name: "Bündnis Sahra Wagenknecht", color: "#7A1F82", text: "#FFFFFF", vibe: "Links · Konservativ" },
];

export const PARTY_SUBLINES: Record<string, string> = {
  cdu: "Konservativ",
  spd: "Sozial­demokratisch",
  gruene: "Öko-progressiv",
  fdp: "Liberal",
  linke: "Sozial-links",
  afd: "Rechts-populistisch",
  bsw: "Links-konservativ",
};

/* Parties for the onboarding party-picker grid (+ "Eigene Bewegung"). */
export function partiesForOnboarding() {
  return [
    ...PQ_PARTIES_LIVE.map((p) => ({
      id: p.id,
      name: p.short,
      full: p.name,
      color: p.color,
      sub: PARTY_SUBLINES[p.id] || "",
    })),
    { id: "eigen", name: "Eigene Bewegung", full: "Du gründest neu", color: "#F6C414", sub: "Du gründest neu" },
  ];
}

/* ─── 18-statement values catalogue (6 fields × 3) ─────────── */
export interface PositionItem {
  id: string;
  text: string;
  stances: Record<string, Stance>;
}
export interface PositionCategory {
  id: string;
  label: string;
  color: string;
  items: PositionItem[];
}

export const POSITIONS_CATALOGUE: PositionCategory[] = [
  {
    id: "kultur", label: "Kultur", color: "#7A6E48",
    items: [
      { id: "k1", text: "Genderneutrale Sprache in Behörden verbindlich machen", stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "nein" } },
      { id: "k2", text: "Öffentlich-rechtlichen Rundfunk im jetzigen Umfang erhalten", stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" } },
      { id: "k3", text: "Deutsche Leitkultur im Grundgesetz verankern", stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "neutral", linke: "nein", afd: "ja", bsw: "ja" } },
    ],
  },
  {
    id: "umwelt", label: "Umwelt", color: "#2E9F5D",
    items: [
      { id: "u1", text: "Tempolimit 130 km/h auf Autobahnen", stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" } },
      { id: "u2", text: "Kohleausstieg auf 2030 vorziehen", stances: { cdu: "nein", spd: "neutral", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "neutral" } },
      { id: "u3", text: "Atomkraft als Brückentechnologie reaktivieren", stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" } },
    ],
  },
  {
    id: "soziales", label: "Soziales", color: "#B9343A",
    items: [
      { id: "s1", text: "Mindestlohn auf 15 € pro Stunde anheben", stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "neutral", bsw: "ja" } },
      { id: "s2", text: "Bürgergeld kürzen bei Annahme-Verweigerung", stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" } },
      { id: "s3", text: "Mietpreisbremse bundesweit ausweiten", stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "neutral", bsw: "ja" } },
    ],
  },
  {
    id: "wirtschaft", label: "Wirtschaft", color: "#1B5FAE",
    items: [
      { id: "w1", text: "Unternehmenssteuern auf 25 % senken", stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "neutral" } },
      { id: "w2", text: "Schuldenbremse im Grundgesetz lockern", stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "ja" } },
      { id: "w3", text: "Vermögenssteuer ab 1 Mio. € einführen", stances: { cdu: "nein", spd: "ja", gruene: "ja", fdp: "nein", linke: "ja", afd: "nein", bsw: "ja" } },
    ],
  },
  {
    id: "sicherheit", label: "Sicherheit", color: "#2D2D44",
    items: [
      { id: "si1", text: "Bundeswehr-Etat dauerhaft auf 3 % des BIP", stances: { cdu: "ja", spd: "neutral", gruene: "neutral", fdp: "ja", linke: "nein", afd: "ja", bsw: "nein" } },
      { id: "si2", text: "Asylverfahren in Drittstaaten an EU-Außengrenze", stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "ja", linke: "nein", afd: "ja", bsw: "ja" } },
      { id: "si3", text: "Vorratsdatenspeicherung wieder einführen", stances: { cdu: "ja", spd: "neutral", gruene: "nein", fdp: "nein", linke: "nein", afd: "ja", bsw: "neutral" } },
    ],
  },
  {
    id: "bildung", label: "Bildung", color: "#C48A05",
    items: [
      { id: "b1", text: "Digitalpakt 2.0: Tablets und Glasfaser für alle Schulen", stances: { cdu: "neutral", spd: "ja", gruene: "ja", fdp: "ja", linke: "ja", afd: "nein", bsw: "ja" } },
      { id: "b2", text: "Mehr Lehrkräfte einstellen, Klassen verkleinern", stances: { cdu: "ja", spd: "ja", gruene: "ja", fdp: "neutral", linke: "ja", afd: "nein", bsw: "ja" } },
      { id: "b3", text: "Studiengebühren ab dem 2. Studium einführen", stances: { cdu: "ja", spd: "nein", gruene: "nein", fdp: "ja", linke: "nein", afd: "neutral", bsw: "nein" } },
    ],
  },
];

export function categoryBlurb(id: string): string {
  return (
    {
      kultur: "3 Aussagen zu Sprache, Medien & Identität.",
      umwelt: "3 Aussagen zu Klima, Verkehr & Energie.",
      soziales: "3 Aussagen zu Lohn, Wohnen & Bürgergeld.",
      wirtschaft: "3 Aussagen zu Steuern, Schulden & Vermögen.",
      sicherheit: "3 Aussagen zu Verteidigung, Asyl & Daten.",
      bildung: "3 Aussagen zu Schule, Uni & Digitalpakt.",
    } as Record<string, string>
  )[id] || "3 Aussagen.";
}

/* Übereinstimmung 0..1 pro Partei. */
export function computePartyAlignment(
  userPositions: Record<string, Stance>,
): Record<string, number> {
  const allItems = POSITIONS_CATALOGUE.flatMap((c) => c.items);
  const answered = allItems.filter((it) => userPositions[it.id]);
  const result: Record<string, number> = {};
  for (const p of PQ_PARTIES_LIVE) {
    if (answered.length === 0) {
      result[p.id] = 0;
      continue;
    }
    let score = 0;
    for (const it of answered) {
      const u = userPositions[it.id];
      const s = it.stances[p.id];
      if (!s) continue;
      if (u === s) score += 1;
      else if (u === "neutral" || s === "neutral") score += 0.5;
    }
    result[p.id] = score / answered.length;
  }
  return result;
}

/* ─── Zusatzeigenschaften ──────────────────────────────────── */
export interface Trait {
  id: string;
  label: string;
  sub: string;
  emoji: string;
}
export const PQ_TRAITS: Trait[] = [
  { id: "buergerrechte", label: "Bürgerrechte", sub: "Privatsphäre, Demokratie", emoji: "⚖" },
  { id: "wirtschaft", label: "Wirtschaftsnah", sub: "Wachstum, Wettbewerb", emoji: "↗" },
  { id: "natur", label: "Naturnah", sub: "Klima, Tierwohl", emoji: "♺" },
  { id: "technik", label: "Technikbegeistert", sub: "Digital, Innovation", emoji: "◆" },
  { id: "familie", label: "Familiennah", sub: "Eltern, Kinder", emoji: "☷" },
  { id: "senioren", label: "Seniorennah", sub: "Rente, Pflege", emoji: "⊙" },
  { id: "jugend", label: "Jugendnah", sub: "Bildung, Zukunft", emoji: "✦" },
];
