/* ============================================================
   Wahlkampf-Missionen — data + scoring helpers.
   Ported from the prototype's missions.jsx.
   ============================================================ */

/* ─── Mission: Antrittsrede ────────────────────────────────── */
export interface RedeTheme { id: string; label: string; emoji: string }

export const REDE_THEMES: Record<string, RedeTheme[]> = {
  kanzler: [
    { id: "wirtschaft", label: "Wirtschaft", emoji: "📈" },
    { id: "klima", label: "Klima", emoji: "🌍" },
    { id: "migration", label: "Migration", emoji: "🛂" },
    { id: "sicherheit", label: "Sicherheit", emoji: "🛡️" },
    { id: "rente", label: "Rente", emoji: "👵" },
    { id: "bildung", label: "Bildung", emoji: "🎓" },
    { id: "europa", label: "Europa", emoji: "🇪🇺" },
    { id: "digitales", label: "Digitales", emoji: "💻" },
  ],
  opposition: [
    { id: "skandal", label: "Regierungs-Skandal", emoji: "🚨" },
    { id: "inflation", label: "Inflation", emoji: "💸" },
    { id: "buerokratie", label: "Bürokratie", emoji: "📑" },
    { id: "migration", label: "Migration", emoji: "🛂" },
    { id: "energie", label: "Energie-Krise", emoji: "⚡" },
    { id: "sicherheit", label: "Innere Sicherheit", emoji: "🛡️" },
    { id: "kanzler", label: "Kanzler-Versagen", emoji: "🎯" },
    { id: "wirtschaft", label: "Wirtschafts-Stillstand", emoji: "📉" },
  ],
};

export function toneDescriptor(t: number): string {
  if (t < 20) return "Staatsmännisch, ruhig";
  if (t < 40) return "Sachlich, konkret";
  if (t < 60) return "Selbstbewusst, klar";
  if (t < 80) return "Pointiert, scharf";
  return "Hart, konfrontativ";
}

const SPEECH_LINES: Record<string, [string, string, string]> = {
  wirtschaft: [
    "Wir investieren in Industrie, Mittelstand und gute Löhne.",
    "Wir machen dieses Land wieder zur stärksten Wirtschaft Europas.",
    "Schluss mit dem Abstieg — wir holen uns Platz eins zurück.",
  ],
  klima: [
    "Klimaschutz, bezahlbar und mit klarem Plan bis 2040.",
    "Saubere Energie heißt sichere Arbeitsplätze — beides gehört zusammen.",
    "Wir werden keine Generation verheizen — Schluss mit dem Aussitzen.",
  ],
  migration: [
    "Wir steuern Migration: geordnet, rechtsstaatlich, menschlich.",
    "Wer Schutz braucht, bekommt ihn. Wer kein Recht hat, geht zurück.",
    "Schluss mit dem Chaos an den Grenzen — wir holen die Kontrolle zurück.",
  ],
  sicherheit: [
    "Wir stärken Polizei, Justiz und unseren Katastrophenschutz.",
    "Sicherheit ist nicht verhandelbar — in jeder Straße, jedem Bahnhof.",
    "Schluss mit Angsträumen — wir machen die Städte wieder sicher.",
  ],
  rente: [
    "Die Rente bleibt stabil — kein Renteneintritt mit 70.",
    "Wer ein Leben lang gearbeitet hat, hat eine verlässliche Rente verdient.",
    "Hände weg vom Rentenalter — das ist mit mir nicht zu machen.",
  ],
  bildung: [
    "Wir investieren in Schulen, Lehrkräfte und digitale Ausstattung.",
    "Jedes Kind bekommt seine Chance — egal aus welchem Elternhaus.",
    "Schluss mit maroden Schulen — Bildung zuerst, immer.",
  ],
  europa: [
    "Wir stärken ein handlungsfähiges, demokratisches Europa.",
    "Deutschland gehört ins Herz Europas — nicht an den Rand.",
    "Wir machen Europa zur Schutzmacht der Demokratie.",
  ],
  digitales: [
    "Wir digitalisieren Verwaltung und Wirtschaft — endlich mit Tempo.",
    "Faxgeräte raus, Glasfaser rein — überall in Deutschland.",
    "Schluss mit dem digitalen Mittelalter — wir holen das auf.",
  ],
  skandal: [
    "Die Regierung schuldet uns Antworten — und einen Untersuchungs­ausschuss.",
    "Wer Vertrauen verspielt, kann nicht weiterregieren. Punkt.",
    "Diese Regierung ist am Ende — Rücktritt, sofort.",
  ],
  inflation: [
    "Wir entlasten Familien spürbar — bei Energie, Miete, Lebensmitteln.",
    "Die Menschen können sich das Leben nicht mehr leisten — wir ändern das.",
    "Stoppt die Preis-Lawine — diese Regierung versagt jeden Tag.",
  ],
  buerokratie: [
    "Wir streichen jede zweite Vorschrift in den ersten 100 Tagen.",
    "Handwerk und Mittelstand ersticken — wir schaffen Luft zum Atmen.",
    "Bürokratie-Monster — wir reißen es nieder, Paragraf für Paragraf.",
  ],
  energie: [
    "Bezahlbare Energie — Versorgung sichern, Preise senken.",
    "Diese Energiepolitik ruiniert unsere Industrie. Wir korrigieren das.",
    "Energie-Wahnsinn beenden — bevor die Lichter ausgehen.",
  ],
  kanzler: [
    "Der Kanzler trägt die Verantwortung — und liefert nicht.",
    "Führungsschwach, planlos, mutlos — Deutschland verdient mehr.",
    "Dieser Kanzler ist eine Zumutung — die Quittung kommt am Wahltag.",
  ],
};

export function speechLineFor(themeId: string, tone: number): string {
  const lines = SPEECH_LINES[themeId];
  if (!lines) return "Das müssen wir jetzt angehen — sachlich und entschlossen.";
  const tier = tone < 35 ? 0 : tone < 70 ? 1 : 2;
  return lines[tier];
}

export function speechOpener(count: number, tone: number, role: string): string {
  const n = count || "einige";
  if (role === "opposition") {
    if (tone < 35) return `Meine Damen und Herren — ${n} Punkte, in denen diese Regierung versagt.`;
    if (tone < 70) return `Liebe Mitbürgerinnen und Mitbürger — ${n} Gründe, warum es so nicht weitergeht.`;
    return `Schluss mit den Ausreden — ${n} Baustellen, die diese Regierung hinterlässt.`;
  }
  if (tone < 35) return `Meine Damen und Herren — ${n} Felder, in denen wir vorangehen.`;
  if (tone < 70) return `Liebe Mitbürgerinnen und Mitbürger — ${n} Versprechen, die ich heute gebe.`;
  return `Es reicht — ${n} Dinge, die wir jetzt anpacken. Ohne Wenn und Aber.`;
}

/* ─── Mission: TV-Triell ───────────────────────────────────── */
export interface TvAnswer { id: string; text: string; score: number }
export interface TvQuestion { q: string; a: TvAnswer[] }

export const TV_QUESTIONS: TvQuestion[] = [
  {
    q: "Frau Lehmann (ARD): Wann senken Sie die Strompreise?",
    a: [
      { id: "A", text: "Im ersten Jahr meiner Kanzlerschaft.", score: 3 },
      { id: "B", text: "Sobald die Lage es zulässt — kein Wahlversprechen.", score: 2 },
      { id: "C", text: "Das ist Aufgabe der Konzerne, nicht der Politik.", score: 1 },
    ],
  },
  {
    q: "Herr Klar (ZDF): Schließen Sie eine Koalition mit den Grünen aus?",
    a: [
      { id: "A", text: "Ich schließe niemanden aus. Inhalte zählen.", score: 3 },
      { id: "B", text: "Schwer vorstellbar.", score: 2 },
      { id: "C", text: "Definitiv ja.", score: 1 },
    ],
  },
  {
    q: "Frau Yilmaz (DLF): Was sagen Sie jungen Wählern, die das Vertrauen verloren haben?",
    a: [
      { id: "A", text: "Ich höre zu — und ich liefere.", score: 3 },
      { id: "B", text: "Politik ist mühsam, das müssen sie aushalten.", score: 1 },
      { id: "C", text: "Wir haben in den letzten Jahren viel erreicht.", score: 2 },
    ],
  },
];

export interface Segments { jung: number; mitte: number; senioren: number }

const REACTION_TABLE: Record<string, Segments>[] = [
  { A: { jung: 35, mitte: 25, senioren: 40 }, B: { jung: -10, mitte: 20, senioren: 5 }, C: { jung: -30, mitte: -20, senioren: -25 } },
  { A: { jung: 30, mitte: 10, senioren: -5 }, B: { jung: -5, mitte: 15, senioren: 20 }, C: { jung: -25, mitte: -10, senioren: 10 } },
  { A: { jung: 45, mitte: 20, senioren: 10 }, B: { jung: -40, mitte: -5, senioren: 25 }, C: { jung: -10, mitte: 15, senioren: 20 } },
];

export function reactionFor(qIdx: number, choice: string): Segments {
  return (REACTION_TABLE[qIdx] && REACTION_TABLE[qIdx][choice]) || { jung: 0, mitte: 0, senioren: 0 };
}

export function avgSegments(arr: Segments[]): Segments {
  const out = { jung: 0, mitte: 0, senioren: 0 };
  arr.forEach((r) => {
    out.jung += r.jung;
    out.mitte += r.mitte;
    out.senioren += r.senioren;
  });
  const n = arr.length || 1;
  return {
    jung: Math.round(out.jung / n),
    mitte: Math.round(out.mitte / n),
    senioren: Math.round(out.senioren / n),
  };
}

/* ─── Mission: Pressekonferenz ─────────────────────────────── */
export const PRESSE_QUESTIONS = [
  { reporter: "BILD · Lukas König", q: "Was werfen Sie der Regierung konkret vor?", a: ["Sie hat die Inflation laufen lassen.", "Sie regiert am Volk vorbei.", "Sie versteckt Skandale."] },
  { reporter: "taz · Mira Yıldız", q: "Würden Sie selbst mit der AfD koalieren?", a: ["Niemals.", "Inhalte zählen — keine Brandmauer.", "Kein Kommentar."] },
  { reporter: "Spiegel · Jan Wolff", q: "Sie haben heute scharf angegriffen — geht das nicht zu weit?", a: ["Opposition ist Mist, sagte schon Müntefering.", "Demokratie braucht Streit.", "Ich nehme nichts zurück."] },
];

/* ─── Mission: Wahlkampftour ───────────────────────────────── */
export const ENCOUNTERS = [
  { name: "Rentnerin", age: 72, q: "„Reicht meine Rente noch in zehn Jahren?\"", a: ["„Ja — wir werden sie verteidigen.\"", "„Wir bauen das System fair um.\"", "„Ich verstehe Ihre Angst. Hier ist mein Plan.\""] },
  { name: "Auszubildender", age: 19, q: "„Was machen Sie für meine Generation?\"", a: ["„Bildung kostenlos bis zum Master.\"", "„Klimaschutz — mein wichtigstes Thema.\"", "„Wir machen Wohnen wieder bezahlbar.\""] },
  { name: "Handwerker", age: 48, q: "„Die Bürokratie killt meinen Betrieb.\"", a: ["„Wir streichen Vorschriften zusammen.\"", "„Ich nehme das mit — versprochen.\"", "„Das ist seit Jahren so. Kein einfacher Hebel.\""] },
  { name: "Studierende", age: 23, q: "„Wie ernst nehmen Sie Klimaschutz wirklich?\"", a: ["„Tempolimit, CO2-Steuer, Wärmewende — alles.\"", "„Realistisch und bezahlbar.\"", "„Klima ja, aber nicht auf Kosten der Wirtschaft.\""] },
];
export const ENCOUNTER_WEIGHTS: number[][] = [
  [1.0, 0.7, 0.9],
  [0.9, 0.8, 1.0],
  [1.0, 0.7, 0.4],
  [1.0, 0.7, 0.5],
];

/* ─── Mission: Themen-Setzung ──────────────────────────────── */
export const LAGE_POLLS = [
  { id: "cdu", name: "CDU/CSU", pct: 27, color: "#2C2C2C" },
  { id: "afd", name: "AfD", pct: 17, color: "#009EE0" },
  { id: "spd", name: "SPD", pct: 16, color: "#E3000F" },
  { id: "gruene", name: "Grüne", pct: 11, color: "#1AA037" },
  { id: "bsw", name: "BSW", pct: 7, color: "#7A1F82" },
  { id: "fdp", name: "FDP", pct: 5, color: "#FFCC00" },
  { id: "linke", name: "Linke", pct: 5, color: "#BE3075" },
];

export const REDE_EROEFFNUNG = [
  { id: "kernthemen", label: "Meine Themen zuerst", quote: "„Ich stehe für drei Dinge — die werde ich nicht verraten.\"", effect: "Klar und authentisch. Starkes Signal für deine persönliche Agenda.", score: 0.85, xp: 65 },
  { id: "bruecke", label: "Brücken bauen", quote: "„Deutschland braucht keine Spaltung — wir brauchen Lösungen.\"", effect: "Holt Mitte-Wähler. Wirkt auf Stammwähler etwas zahm.", score: 0.75, xp: 60 },
  { id: "angriff", label: "Klarer Angriff", quote: "„Diese Regierung hat versagt. Ich komme, um es besser zu machen.\"", effect: "Begeistert Stammwähler. Wirkt auf Unentschlossene polarisierend.", score: 0.65, xp: 55 },
];

/* ─── Mission: Wahlprogramm + Bundeshaushalt ───────────────── */
export interface HaushaltKategorie {
  id: string;
  label: string;
  ist: number;
  fest: number;
  desc: string;
  color: string;
}
export const HAUSHALT_KATEGORIEN: HaushaltKategorie[] = [
  { id: "soziales", label: "Soziales & Rente", ist: 180, fest: 165, desc: "Rente, Bürgergeld, Grundsicherung", color: "#1F1D17" },
  { id: "verteidigung", label: "Verteidigung & Sicherheit", ist: 65, fest: 40, desc: "Bundeswehr, Polizei, BAMF", color: "#4A463C" },
  { id: "klima", label: "Klima & Verkehr", ist: 50, fest: 25, desc: "Bahn, Straßen, Klimaschutz, Energie", color: "#807A6A" },
  { id: "gesundheit", label: "Gesundheit & Familie", ist: 30, fest: 20, desc: "Krankenkassen, Elterngeld, Kindergeld", color: "#A39B85" },
  { id: "bildung", label: "Bildung & Forschung", ist: 20, fest: 10, desc: "Schulen, BAföG, Hochschulen, Forschung", color: "#C9C2AE" },
];
export const HAUSHALT_FESTBLOCK = {
  label: "Zinsen & Verwaltung",
  desc: "Zinsen, Justiz, Außenamt, EU-Beiträge, Verwaltung",
  betrag: 145,
  color: "#E8E2D2",
};
export const STEUEREINNAHMEN = 450;
export const KAT_STEP = 5;
export const KAT_DELTA_MAX = 30;
export const SCHULDEN_OPTIONEN = [
  { v: 0, label: "Keine", zone: "kein", hint: "Alles aus Steuern." },
  { v: 15, label: "+15 Mrd", zone: "umgangen", hint: "Knapp über der Schuldenbremse — Sondervermögen nötig." },
  { v: 30, label: "+30 Mrd", zone: "sondervermoegen", hint: "Sondervermögen für Bundeswehr o. Klima. Politisch laut." },
  { v: 50, label: "+50 Mrd", zone: "notlage", hint: "Notlage muss vom Bundestag beschlossen werden." },
];

export interface ProgrammOption { id: string; label: string; cost: number }
export interface ProgrammThema {
  id: string;
  label: string;
  icon: string;
  kat: string;
  optionen: ProgrammOption[];
}
export const PROGRAMM_THEMEN: ProgrammThema[] = [
  {
    id: "soziales", label: "Soziales & Rente", icon: "👵", kat: "soziales",
    optionen: [
      { id: "p_soz_a", label: "Rentenniveau 48 % dauerhaft sichern", cost: 10 },
      { id: "p_soz_b", label: "Aktienrente als zweite Säule", cost: 5 },
      { id: "p_soz_c", label: "Mindestrente 1.200 € einführen", cost: 8 },
      { id: "p_soz_d", label: "Rentenalter flexibel anpassen", cost: 0 },
    ],
  },
  {
    id: "klima", label: "Klima & Verkehr", icon: "🌍", kat: "klima",
    optionen: [
      { id: "p_kli_a", label: "Klimageld 200 €/Person/Jahr", cost: 15 },
      { id: "p_kli_b", label: "Deutschlandticket für 29 €/Monat", cost: 4 },
      { id: "p_kli_c", label: "Autobahn-Modernisierung beschleunigen", cost: 8 },
      { id: "p_kli_d", label: "Technologieoffen – kein Verbrenner-Aus", cost: 0 },
    ],
  },
  {
    id: "bildung", label: "Bildung & Forschung", icon: "🎓", kat: "bildung",
    optionen: [
      { id: "p_bil_a", label: "BAföG kräftig erhöhen", cost: 3 },
      { id: "p_bil_b", label: "Digitalpakt Schulen 2.0", cost: 5 },
      { id: "p_bil_c", label: "Leistungsprinzip & Notenvergleich", cost: 0 },
      { id: "p_bil_d", label: "Bildungsgutscheine für alle", cost: 2 },
    ],
  },
  {
    id: "verteidigung", label: "Verteidigung & Sicherheit", icon: "🛡️", kat: "verteidigung",
    optionen: [
      { id: "p_def_a", label: "Bundeswehr auf 2,5 % BIP", cost: 15 },
      { id: "p_def_b", label: "NATO-Ziel 2 % zuverlässig erfüllen", cost: 8 },
      { id: "p_def_c", label: "Mehr Diplomatie, weniger Rüstung", cost: 0 },
      { id: "p_def_d", label: "Effizientere Bundeswehr statt mehr Geld", cost: 2 },
    ],
  },
  {
    id: "gesundheit", label: "Gesundheit & Familie", icon: "❤️", kat: "gesundheit",
    optionen: [
      { id: "p_ges_a", label: "Bürgerversicherung einführen", cost: 0 },
      { id: "p_ges_b", label: "Kindergrundsicherung + Prävention", cost: 5 },
      { id: "p_ges_c", label: "Große Pflegereform", cost: 5 },
      { id: "p_ges_d", label: "Mehr Wettbewerb im Gesundheitssystem", cost: 0 },
    ],
  },
];

export const WAHLVERSPRECHEN_BY_ID: Record<string, { id: string; label: string; kat: string; cost: number }> =
  Object.fromEntries(
    PROGRAMM_THEMEN.flatMap((t) =>
      t.optionen.map((o) => [o.id, { id: o.id, label: o.label, kat: t.kat, cost: o.cost }]),
    ),
  );
export const VERSPRECHEN_BUDGET_HINT = 40;

/* ─── Mission: Social Media ────────────────────────────────── */
export const PLATTFORMEN = [
  { id: "tiktok", label: "TikTok", target: "Junge (18-29)", emoji: "🎵", reach: 0.85, risk: 0.6 },
  { id: "insta", label: "Instagram", target: "Mitte (25-45)", emoji: "📷", reach: 0.75, risk: 0.3 },
  { id: "x", label: "X / Twitter", target: "Politik-Bubble", emoji: "✖️", reach: 0.4, risk: 0.8 },
  { id: "yt", label: "YouTube", target: "Alle Altersgruppen", emoji: "▶️", reach: 0.6, risk: 0.2 },
  { id: "fb", label: "Facebook", target: "Senioren (55+)", emoji: "👵", reach: 0.55, risk: 0.4 },
];
export const SOCIAL_TONALITAET = [
  { id: "sachlich", label: "Sachlich-erklärend", desc: "Lange Posts, ernsthaft, faktenbasiert", mod: 0.6 },
  { id: "witzig", label: "Witzig-nahbar", desc: "Memes & Selbstironie, niedrige Distanz", mod: 1.0 },
  { id: "kaempfer", label: "Kämpferisch-pointiert", desc: "Scharfe Angriffe, klare Gegner", mod: 0.85 },
];

/* ─── Wahlsonntag ──────────────────────────────────────────── */
export const WAHL_PARTY_META: Record<string, { name: string; color: string; fg: string }> = {
  cdu: { name: "CDU/CSU", color: "#000000", fg: "#FFFFFF" },
  spd: { name: "SPD", color: "#E3000F", fg: "#FFFFFF" },
  gruene: { name: "Grüne", color: "#1AA037", fg: "#FFFFFF" },
  fdp: { name: "FDP", color: "#FFCC00", fg: "#1F1D17" },
  linke: { name: "Linke", color: "#BE3075", fg: "#FFFFFF" },
  afd: { name: "AfD", color: "#009EE0", fg: "#FFFFFF" },
  bsw: { name: "BSW", color: "#7A1F82", fg: "#FFFFFF" },
  eigen: { name: "Bewegung", color: "#F6C414", fg: "#1F1D17" },
};

export function fallbackAnalysis(
  total: number,
  pop: number,
  pct: number | undefined,
  partyName: string,
): string {
  const t = Math.round(total * 100);
  const p = Math.round(pop * 100);
  if (total > 0.7) {
    return `Sie haben einen starken Wahlkampf hingelegt — Performance bei ${t}%, ${p}% Übereinstimmung mit dem Volk. ${partyName} kommt damit auf ${pct?.toFixed(1) || "?"}%. Ein gutes Mandat.`;
  }
  if (total > 0.45) {
    return `Solider, kein starker Wahlkampf. Mit ${t}% Performance und ${p}% Volks-Match landet ${partyName} bei ${pct?.toFixed(1) || "?"}%. Mehr war drin.`;
  }
  return `Schwacher Wahlkampf — nur ${t}% Performance und ${p}% Volks-Match. ${partyName} schrumpft auf ${pct?.toFixed(1) || "?"}%. Daraus muss eine Lehre werden.`;
}
