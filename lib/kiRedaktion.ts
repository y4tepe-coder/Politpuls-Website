import type { Dossier, DossierOutlet, DossierPress } from "./types";

/* ============================================================
   KI-Redaktion — the daily dossier catalogue.
   In production a real editorial AI pulls today's actual news;
   the app ships a hand-crafted catalogue of 7 day-dossiers that
   rotate so consecutive days never feel identical.
   ============================================================ */

const TODAY_START = new Date(2026, 4, 15); // 15. Mai 2026 == app day 1
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = [
  "Jan", "Feb", "März", "April", "Mai", "Juni",
  "Juli", "August", "Sept", "Okt", "Nov", "Dez",
];

export function dateForDay(day: number): string {
  const d = new Date(TODAY_START);
  d.setDate(d.getDate() + (day - 1));
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

export const OUTLETS: Record<string, DossierOutlet> = {
  bild: { name: "BILD", dot: "#D81E26", kicker: "Frage an die Kanzlerin" },
  spiegel: { name: "DER SPIEGEL", dot: "#E64415", kicker: "Interview-Anfrage" },
  taz: { name: "taz", dot: "#D80F26", kicker: "Kommentar erbeten" },
  faz: { name: "F.A.Z.", dot: "#1F1D17", kicker: "Stellungnahme" },
  sz: { name: "SZ", dot: "#003A8C", kicker: "Im Wortlaut" },
  rnd: { name: "RND", dot: "#D7263D", kicker: "Hauptstadt-Briefing" },
};

export const PRESS: Record<string, DossierPress> = {
  mira: { name: "Mira Lang", role: "Pressesprecherin", initials: "ML", gradient: "linear-gradient(135deg,#D81E26,#9B1219)" },
  konrad: { name: "Konrad Vogt", role: "Regierungssprecher", initials: "KV", gradient: "linear-gradient(135deg,#3A506B,#1C2541)" },
  yasmin: { name: "Yasmin Köhler", role: "Kommunikationschefin", initials: "YK", gradient: "linear-gradient(135deg,#C48A05,#7A5500)" },
  tilo: { name: "Tilo Brandt", role: "Stabschef", initials: "TB", gradient: "linear-gradient(135deg,#2D6A4F,#143824)" },
  rebecca: { name: "Rebecca Adler", role: "Sprecherin Kanzleramt", initials: "RA", gradient: "linear-gradient(135deg,#7C2D80,#3E1646)" },
};

type DossierSeed = Omit<Dossier, "day" | "date">;

const DOSSIERS: DossierSeed[] = [
  /* ───────────── Day 1: Bürgergeld ───────────── */
  {
    id: "buergergeld",
    outlet: OUTLETS.bild,
    press: PRESS.mira,
    article: {
      kicker: "Bundespolitik",
      headline: "Streit ums Bürger­geld\nspaltet die Koalition",
      deck: "Die SPD pocht auf Schutz für Langzeit­arbeitslose, die CDU verlangt schärfere Sanktionen. Heute fällt die Entscheidung im Kanzleramt.",
      lede: "Im Kanzleramt liegen die Nerven blank. Vier Stunden ringen die Koalitionspartner um den Entwurf, der morgen ins Kabinett soll.",
      pull: "71% der Befragten fordern strengere Pflichten — 64% wollen den Regelsatz halten. Eine ehrliche Klemme.",
      byline: "Von Sarah Lehmann",
    },
    video: {
      channel: "tagesschau",
      ticker: "BÜRGERGELD · Koalitionsausschuss tagt im Kanzleramt",
      title: "„Koalition im Streit\": Schalte live aus Berlin zum Bürgergeld",
      blurb: "Reporterin Lisa Berger fasst die Stimmung im Kanzleramt zusammen: vier Stunden Verhandlung, Pressekonferenz für 19 Uhr angekündigt.",
      runtime: "2:14",
      time: "18:42",
    },
    facts: [
      "Das Bürgergeld ersetzt seit 2023 Hartz IV.",
      "5,5 Mio. Menschen in Deutschland beziehen es.",
      "Regelsatz für Alleinstehende: 563 €/Monat.",
      "~ 75% der Beziehenden sind nicht erwerbsfähig.",
    ],
    prompt: {
      kanzler: "Welchen Vorschlag legst du morgen vor?",
      opposition: "Welche Position bringst du morgen in den Bundestag?",
      minister: "Welche Linie vertrittst du morgen in der Kabinettssitzung?",
      kandidat: "Was forderst du morgen im Wahlkampf?",
    },
    choices: [
      {
        id: "A", tag: "Kompromiss", tone: "gold",
        label: "Regelsatz +12 €, dafür mehr Mitwirkungspflichten",
        bullets: ["SPD bekommt die Erhöhung", "CDU bekommt strengere Pflichten", "Koalition hält — BILD wird meckern"],
        bildQuestion: "Frau Kanzlerin, 12 Euro mehr — und gleichzeitig härtere Sanktionen. Ist das jetzt sozial oder ist das kalt?",
        presets: [
          "Wir geben mehr — und verlangen mehr. Beides gehört zusammen.",
          "Wer kann, soll arbeiten. Wer nicht kann, bekommt mehr.",
          "Ein Kompromiss, der niemandem schmeichelt — und genau deshalb hält.",
        ],
        deltas: [
          { label: "Zustimmung Kanzlerin", delta: 2, unit: "%", good: true },
          { label: "Stimmung Koalition", delta: 5, unit: "%", good: true },
          { label: "BILD-Schlagzeilen", delta: -3, unit: "", good: false, note: "eher kritisch" },
        ],
      },
      {
        id: "B", tag: "Sozial", tone: "red",
        label: "Regelsatz deutlich erhöhen, keine neuen Sanktionen",
        bullets: ["Klares Signal an Geringverdiener", "SPD-Basis ist begeistert", "Streit mit CDU/CSU vorprogrammiert"],
        bildQuestion: "Frau Kanzlerin, ohne neue Pflichten: Warum soll der Steuerzahler weiter draufzahlen, wenn 1,7 Millionen Stellen unbesetzt sind?",
        presets: [
          "In einem reichen Land darf Armut nicht das Problem der Armen sein.",
          "Sanktionen ersetzen keine Kita-Plätze und keinen Mindestlohn.",
          "Wir reden über 563 Euro. Das ist kein Sofa, das ist Existenz.",
        ],
        deltas: [
          { label: "Zustimmung SPD-Lager", delta: 6, unit: "%", good: true },
          { label: "Stimmung Koalition", delta: -4, unit: "%", good: false },
          { label: "Kritik aus CDU/CSU", delta: 8, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Hart", tone: "dark",
        label: "Bürgergeld einfrieren, härtere Pflichten durchsetzen",
        bullets: ["Druck auf Langzeitarbeitslose", "CDU-Wähler kommen zurück", "Soziale Verbände laufen Sturm"],
        bildQuestion: "Frau Kanzlerin, Sie frieren das Bürgergeld bei Inflation ein. Sagen Sie das gerade einer alleinerziehenden Verkäuferin?",
        presets: [
          "Wer arbeiten kann, der muss auch arbeiten. Punkt.",
          "Sozial ist, was Menschen wieder in Arbeit bringt — nicht der Schein.",
          "Wir helfen denen, die Hilfe brauchen — nicht denen, die sie ausnutzen.",
        ],
        deltas: [
          { label: "Zustimmung CDU-Lager", delta: 5, unit: "%", good: true },
          { label: "SPD-Fraktion", delta: -7, unit: "%", good: false },
          { label: "Soziale Verbände", delta: -4, unit: "%", good: false },
        ],
      },
      {
        id: "D", tag: "Vertagen", tone: "blue",
        label: "Erst Experten-Anhörung, Entscheidung nächste Woche",
        bullets: ["Zeit gewinnen, Fakten sammeln", "Wirkt unentschlossen in den Medien", "Koalitionsstreit kühlt ab"],
        bildQuestion: "Frau Kanzlerin, Sie vertagen heute zum dritten Mal. Wann entscheiden Sie eigentlich noch — oder regiert nur noch die Kommission?",
        presets: [
          "Eine Reform, die Millionen betrifft, verdient eine Woche mehr Sorgfalt.",
          "Lieber spät richtig als schnell falsch entschieden.",
          "Wir hören erst die Expertinnen — dann entscheidet das Kabinett.",
        ],
        deltas: [
          { label: "Entschlossenheit", delta: -5, unit: "%", good: false, note: "wirkt zögerlich" },
          { label: "Expertenstimmen", delta: 4, unit: "%", good: true },
          { label: "Koalitionsklima", delta: 3, unit: "%", good: true },
        ],
      },
    ],
  },

  /* ───────────── Day 2: Migration / Asylgipfel ───────────── */
  {
    id: "asylgipfel",
    outlet: OUTLETS.spiegel,
    press: PRESS.konrad,
    article: {
      kicker: "Innenpolitik",
      headline: "Asyl-Gipfel\nplatzt vor Start",
      deck: "Die Innenministerin droht mit Rückzug, Bayern blockiert die Verteilung. In wenigen Stunden sitzen 16 Länderchefs am Tisch — ohne Einigung.",
      lede: "Es ist 6 Uhr früh. In den Hotelzimmern um den Bundestag herum brennen die ersten Bürolichter. Was als großer Wurf angekündigt war, droht zur Blamage zu werden.",
      pull: "54% der Deutschen halten den Zustrom für „zu hoch\" — gleichzeitig fehlen 400.000 Pflegekräfte.",
      byline: "Von Tom Reisig",
    },
    video: {
      channel: "ZDF heute",
      ticker: "ASYLGIPFEL · Länder uneins über Verteilung",
      title: "Vor dem Gipfel: Söder droht, Faeser pocht auf Quote",
      blurb: "Hauptstadt-Studio Berlin: Korrespondentin Anja Petzold ordnet ein, warum es heute zum offenen Bruch zwischen Bund und Ländern kommen könnte.",
      runtime: "3:08",
      time: "06:41",
    },
    facts: [
      "329.120 Asylanträge in DE im letzten Jahr.",
      "Kommunen klagen über volle Unterkünfte.",
      "EU-Verteilmechanismus wurde 2024 verschärft.",
      "400.000 unbesetzte Stellen v. a. in Pflege & Bau.",
    ],
    prompt: {
      kanzler: "Mit welcher Linie gehst du in den Asyl-Gipfel?",
      opposition: "Was forderst du heute im Bundestag von der Regierung?",
      minister: "Welchen Vorschlag legst du im Kabinett vor?",
      kandidat: "Wie positionierst du dich heute zur Migration?",
    },
    choices: [
      {
        id: "A", tag: "Ordnung & Tempo", tone: "gold",
        label: "Schnellere Verfahren, dafür mehr Geld für Kommunen",
        bullets: ["Verfahren auf 3 Monate verkürzen", "Kommunen bekommen 2 Mrd. extra", "Klingt nach Lösung — Umsetzung dauert"],
        bildQuestion: "Herr Kanzler, Sie versprechen 3 Monate. Die Behörden brauchen heute 18. Wie soll das gehen?",
        presets: [
          "Wir entscheiden schneller — und entscheiden ehrlich.",
          "Die Kommunen halten dieses Land zusammen. Heute hilft der Bund.",
          "Tempo bei den Verfahren, Stärke bei der Integration.",
        ],
        deltas: [
          { label: "Zustimmung in der Mitte", delta: 5, unit: "%", good: true },
          { label: "Kommunalverbände", delta: 6, unit: "%", good: true },
          { label: "Glaubwürdigkeit", delta: -2, unit: "%", good: false, note: 'wieder mal "Tempo"' },
        ],
      },
      {
        id: "B", tag: "Humanität", tone: "red",
        label: "Familiennachzug erhalten, Integration ausbauen",
        bullets: ["Sprachkurse + Pflege-Anerkennung", "Kirchen & DGB applaudieren", "Union nennt es „Magnet-Politik\""],
        bildQuestion: "Herr Kanzler, Bayern droht mit Klage. Riskieren Sie heute den Bruch der Koalition für Familiennachzug?",
        presets: [
          "Wer hier ankommt, soll arbeiten dürfen — und zwar schnell.",
          "Familien gehören zusammen. Punkt.",
          "Integration kostet Geld. Sie nicht zu machen, kostet uns mehr.",
        ],
        deltas: [
          { label: "SPD/Grüne-Basis", delta: 7, unit: "%", good: true },
          { label: "Union & FDP", delta: -6, unit: "%", good: false },
          { label: "AfD-Umfragewert", delta: 3, unit: "%", good: false, note: "profitiert" },
        ],
      },
      {
        id: "C", tag: "Hart", tone: "dark",
        label: "Grenzkontrollen ausweiten, Sozialleistungen kürzen",
        bullets: ["Sichere Drittstaaten ausweiten", "Bezahlkarte statt Bargeld", "Grüne kündigen Widerstand an"],
        bildQuestion: "Herr Kanzler, Menschenrechtsanwälte sprechen von Rechtsbruch. Was sagen Sie denen heute?",
        presets: [
          "Wer kommt, muss sich an unsere Regeln halten — und unsere Gesetze.",
          "Deutschland ist hilfsbereit, aber nicht naiv.",
          "Wir steuern, wer kommt — und wer geht.",
        ],
        deltas: [
          { label: "Union-Lager", delta: 6, unit: "%", good: true },
          { label: "Koalitionsklima", delta: -8, unit: "%", good: false },
          { label: "Verfassungsklagen", delta: 2, unit: "", good: false, note: "2 Klagen angekündigt" },
        ],
      },
      {
        id: "D", tag: "Europäisch", tone: "blue",
        label: "EU-Lösung abwarten, national nur Anpassungen",
        bullets: ["Druck Richtung Brüssel", "Spielt auf Zeit", "Länder fühlen sich alleingelassen"],
        bildQuestion: "Herr Kanzler, Sie schieben das nach Brüssel. Ist das Führung — oder Drücken?",
        presets: [
          "Migration löst kein Land alleine. Auch Deutschland nicht.",
          "Wir koordinieren mit unseren Partnern — und handeln, wenn Brüssel liefert.",
          "Schnellschüsse kosten uns nachher mehr.",
        ],
        deltas: [
          { label: "EU-Partner", delta: 4, unit: "%", good: true },
          { label: "Länderchefs", delta: -5, unit: "%", good: false },
          { label: "Entschlossenheit", delta: -3, unit: "%", good: false },
        ],
      },
    ],
  },

  /* ───────────── Day 3: Klima / CO2-Preis ───────────── */
  {
    id: "co2preis",
    outlet: OUTLETS.taz,
    press: PRESS.yasmin,
    article: {
      kicker: "Klima & Energie",
      headline: "CO₂-Preis vor\ndem Knall",
      deck: "Ab Januar soll der nationale CO₂-Preis um 15 € pro Tonne steigen. Der ADAC warnt, Klimaforscher applaudieren — und im Osten wittert die AfD ein Geschenk.",
      lede: "Sprit, Heizen, Pendeln: Die Rechnung steht in jedem Haushalt. Heute Nachmittag entscheidet das Kabinett, ob der CO₂-Preis 2027 wirklich steigt.",
      pull: "38 ct mehr pro Liter Diesel im Worst Case — das Klimageld kommt frühestens 2027.",
      byline: "Von Laura Krings",
    },
    video: {
      channel: "tagesschau",
      ticker: "KLIMA · Kabinett entscheidet über CO₂-Pfad",
      title: "Der Preis fürs Klima — wer zahlt, wer gewinnt?",
      blurb: "Ein Tag im Pendlerverkehr von Brandenburg nach Berlin — wir haben Familien begleitet, die schon jetzt jeden Cent umdrehen.",
      runtime: "4:22",
      time: "12:15",
    },
    facts: [
      "CO₂-Preis aktuell 55 €/t — geplant: 70 €/t.",
      "Pendler legen im Schnitt 33 km einfach zurück.",
      "Klimageld: pro Kopf rund 130 €/Jahr.",
      "DE will bis 2045 klimaneutral sein.",
    ],
    prompt: {
      kanzler: "Welchen Klima-Pfad legst du heute im Kabinett vor?",
      opposition: "Was forderst du zur CO₂-Preis-Debatte?",
      minister: "Welche Linie vertrittst du in der Kabinettssitzung?",
      kandidat: "Wie positionierst du dich zum CO₂-Preis im Wahlkampf?",
    },
    choices: [
      {
        id: "A", tag: "Sozial gestaffelt", tone: "gold",
        label: "CO₂-Preis steigt, dafür Klimageld ab 2026 ausgezahlt",
        bullets: ["Erhöhung wie geplant", "Pendler & Familien werden entlastet", "Auszahlung wird teuer & komplex"],
        bildQuestion: "Frau Kanzlerin, Sie versprechen das Klimageld seit drei Jahren. Warum sollen wir Ihnen jetzt glauben?",
        presets: [
          "Klimaschutz ja — aber nicht auf dem Rücken der Pendler.",
          "Wer mehr verschmutzt, zahlt mehr. Wer es richtig macht, kriegt zurück.",
          "Das Klimageld kommt — und zwar 2026.",
        ],
        deltas: [
          { label: "Klima-Wähler", delta: 5, unit: "%", good: true },
          { label: "Pendler-Lager", delta: -2, unit: "%", good: false },
          { label: "Glaubwürdigkeit", delta: -3, unit: "%", good: false, note: "Klimageld verspätet sich" },
        ],
      },
      {
        id: "B", tag: "Ambitioniert", tone: "red",
        label: "CO₂-Preis stärker erhöhen, EU-Niveau ansteuern",
        bullets: ["Klare Klima-Linie", "Industrie warnt vor Abwanderung", "Heizkosten ein Politikum"],
        bildQuestion: "Frau Kanzlerin, Sie kennen die Heizkosten-Rechnung einer Rentnerin in Cottbus? Nein? Dann hören Sie zu.",
        presets: [
          "1,5 Grad sind keine Verhandlungsmasse.",
          "Wir bleiben Industriestandort — und Klimavorreiter.",
          "Wer jetzt nicht handelt, zahlt später doppelt.",
        ],
        deltas: [
          { label: "Grüne-nahe Wähler", delta: 8, unit: "%", good: true },
          { label: "Industrie", delta: -6, unit: "%", good: false },
          { label: "Ost-Bundesländer", delta: -5, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Bremsen", tone: "dark",
        label: "CO₂-Pfad aussetzen, Belastung für Bürger einfrieren",
        bullets: ["Sofortige Entlastung", "Klimaziele wackeln", "EU-Druck wird steigen"],
        bildQuestion: "Frau Kanzlerin, beerdigen Sie damit das 1,5-Grad-Ziel? Ja oder nein?",
        presets: [
          "Klima ja — aber niemand soll wegen Heizkosten in die Schuldenfalle.",
          "Wir bleiben ambitioniert. Aber realistisch.",
          "Zumutbarkeit ist auch eine Form von Klimapolitik.",
        ],
        deltas: [
          { label: "Union/FDP-Lager", delta: 6, unit: "%", good: true },
          { label: "Grüne", delta: -9, unit: "%", good: false },
          { label: "EU-Kommission", delta: -4, unit: "%", good: false, note: "rüffelt" },
        ],
      },
      {
        id: "D", tag: "Marktbasiert", tone: "blue",
        label: "Emissionshandel ausweiten, weniger Steuern",
        bullets: ["Markt regelt — in der Theorie", "Liberale Wählerschaft applaudiert", "Sozial schwer steuerbar"],
        bildQuestion: "Frau Kanzlerin, „der Markt regelt das\" — sagen Sie das den Mietern in Wuppertal?",
        presets: [
          "Der Markt löst Probleme, die Politik nur verschiebt.",
          "Wir setzen auf Innovation, nicht auf Verbote.",
          "Klimaschutz braucht Anreize, keine Strafsteuern.",
        ],
        deltas: [
          { label: "FDP-nahe Wähler", delta: 5, unit: "%", good: true },
          { label: "Mieter-Lager", delta: -3, unit: "%", good: false },
          { label: "Klima-Bewegung", delta: -6, unit: "%", good: false },
        ],
      },
    ],
  },

  /* ───────────── Day 4: Bahn-Streik / Pendler ───────────── */
  {
    id: "bahnstreik",
    outlet: OUTLETS.bild,
    press: PRESS.tilo,
    article: {
      kicker: "Wirtschaft",
      headline: "Bahn steht still —\nund das Land mit ihr",
      deck: "GDL ruft zum 6. Streik in diesem Jahr auf, 50 Stunden. Vorstandschef Lutz spricht von „Erpressung\", Lokführer von „Würde\". Heute trifft sich die Schlichtungsrunde.",
      lede: "Hauptbahnhof Hannover, 5:30 Uhr. Auf den Anzeigetafeln blinkt überall „entfällt\". Pendler:innen, die nicht mehr genervt, sondern nur noch müde sind.",
      pull: "2,8 Mrd. € Schaden für die Wirtschaft pro Streiktag. 8,5 Mio. Bahn-Pendler täglich.",
      byline: "Von Markus Heinrich",
    },
    video: {
      channel: "BILD live",
      ticker: "BAHNSTREIK · Tag 2 — 80% der Fernzüge fallen aus",
      title: "Chaos auf den Bahnhöfen: „Wir müssen unsere Kinder bei Oma abladen\"",
      blurb: "Live aus Hannover Hbf: Reporter Tim Krohn spricht mit Pendlerinnen, die seit 4 Uhr auf dem Bahnsteig stehen — und einem Lokführer im Streik.",
      runtime: "1:48",
      time: "07:02",
    },
    facts: [
      "GDL fordert 35-Std-Woche bei vollem Lohnausgleich.",
      "Bahn-Vorstand bietet bisher 32 Stunden ab 2028.",
      "2024: 6 Streiks, 14 Tage Stillstand.",
      "Bahn schreibt 2,4 Mrd. € Verlust pro Jahr.",
    ],
    prompt: {
      kanzler: "Wie greift die Regierung in den Tarifstreit ein — oder nicht?",
      opposition: "Was forderst du heute Mittag im Bundestag?",
      minister: "Welche Linie vertrittst du beim Verkehrsausschuss?",
      kandidat: "Wie positionierst du dich zum Bahnstreik?",
    },
    choices: [
      {
        id: "A", tag: "Vermitteln", tone: "gold",
        label: "Schlichtung einberufen, beide Seiten an einen Tisch",
        bullets: ["Klassischer Kanzlerinnen-Move", "Druck auf beide Seiten", "Keine schnelle Lösung"],
        bildQuestion: "Frau Kanzlerin, drei Pendler stehen hier neben mir. Was sagen Sie denen, die heute den Job verlieren?",
        presets: [
          "Wir setzen uns an den Tisch — und stehen erst auf, wenn die Züge fahren.",
          "Tarifautonomie ist heilig. Vermitteln darf der Staat trotzdem.",
          "Pendlerinnen sind das Rückgrat dieses Landes — sie dürfen nicht Spielball sein.",
        ],
        deltas: [
          { label: "Pendler-Lager", delta: 4, unit: "%", good: true },
          { label: "Wirtschaftsverbände", delta: 3, unit: "%", good: true },
          { label: "Gewerkschaften", delta: -1, unit: "%", good: false },
        ],
      },
      {
        id: "B", tag: "Arbeiterseite", tone: "red",
        label: "Solidarität mit Lokführern — Bahn-Vorstand in die Pflicht",
        bullets: ["SPD-Basis ist begeistert", "Liberale toben", "Bahnchef Lutz unter Druck"],
        bildQuestion: "Frau Kanzlerin, geben Sie den Bahnstreik-Anführern jetzt auch noch Ihren Segen?",
        presets: [
          "Wer Schichten fährt, verdient mehr als nette Worte.",
          "Wenn die Bahn 16 Mrd. an Boni zahlt, sind 35 Stunden drin.",
          "Solidarität ist keine Floskel. Heute schon gar nicht.",
        ],
        deltas: [
          { label: "Gewerkschaften", delta: 9, unit: "%", good: true },
          { label: "FDP-Lager", delta: -7, unit: "%", good: false },
          { label: "Wirtschaftsverbände", delta: -5, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Streikrecht beschneiden", tone: "dark",
        label: "Notstands-Schlichtung gesetzlich verankern",
        bullets: ["Pendler-Lager applaudiert", "DGB ruft Großdemo aus", "Verfassungsrechtler skeptisch"],
        bildQuestion: "Frau Kanzlerin, schaffen Sie heute das Streikrecht ab? Ja oder nein?",
        presets: [
          "Kritische Infrastruktur ist keine Geisel.",
          "Wir verteidigen das Streikrecht — und das Recht der Pendler:innen.",
          "Wenn ein Land stillsteht, muss Politik handeln.",
        ],
        deltas: [
          { label: "Wirtschaftsverbände", delta: 7, unit: "%", good: true },
          { label: "DGB & SPD", delta: -8, unit: "%", good: false },
          { label: "Verfassungsdebatte", delta: 5, unit: "", good: false, note: "Klagen drohen" },
        ],
      },
      {
        id: "D", tag: "Raushalten", tone: "blue",
        label: "Tarifautonomie wahren, Bund mischt sich nicht ein",
        bullets: ["Verfassungs-konform", "Wirkt passiv", "Streik kann weiterlaufen"],
        bildQuestion: "Frau Kanzlerin, 8 Millionen Pendler — und Sie machen einfach nichts?",
        presets: [
          "Tarifautonomie heißt: Bund hält sich raus. Auch wenn es weh tut.",
          "Wir helfen mit Verkehrsmitteln, nicht mit Tarifdiktaten.",
          "Demokratie aushalten heißt auch: Streiks aushalten.",
        ],
        deltas: [
          { label: "Verfassungsfreund:innen", delta: 3, unit: "%", good: true },
          { label: "Pendler-Stimmung", delta: -6, unit: "%", good: false },
          { label: "Entschlossenheit", delta: -4, unit: "%", good: false, note: "wirkt tatenlos" },
        ],
      },
    ],
  },

  /* ───────────── Day 5: Bundeswehr / Sondervermögen II ───────────── */
  {
    id: "bundeswehr",
    outlet: OUTLETS.faz,
    press: PRESS.rebecca,
    article: {
      kicker: "Sicherheit",
      headline: "Zweites Sonder­vermögen?\nGeneral schlägt Alarm",
      deck: "Der Generalinspekteur sagt: Die ersten 100 Milliarden sind weg, die Lücken bleiben. Die FDP blockt — die Grünen fordern Mittel jetzt für Drohnenabwehr.",
      lede: "„Wir sind nicht abwehrbereit.\" Der Satz, mit dem der Generalinspekteur den Kanzler heute Morgen geweckt hat, steht inzwischen auf jedem Frühstückstisch.",
      pull: "2,1% des BIP gibt DE für Verteidigung aus — NATO-Ziel ist erreicht, aber Material fehlt überall.",
      byline: "Von Friedrich Auer",
    },
    video: {
      channel: "tagesschau",
      ticker: "BUNDESWEHR · Generalinspekteur fordert mehr Geld",
      title: "„Nicht abwehrbereit\": Der Brandbrief aus dem Verteidigungsministerium",
      blurb: "Was bedeutet das eigentlich konkret? Korrespondentin Karin Pell ordnet ein, woran es bei der Truppe wirklich hakt.",
      runtime: "3:35",
      time: "20:18",
    },
    facts: [
      "100 Mrd. Sondervermögen ist 2024 vertraglich gebunden.",
      "Munitionslager nur 30% der NATO-Soll.",
      "Drohnenabwehr: keine flächendeckende Lösung.",
      "180.000 Soldat:innen — geplant: 203.000.",
    ],
    prompt: {
      kanzler: "Wie reagierst du auf den Brandbrief des Generals?",
      opposition: "Was forderst du heute im Verteidigungsausschuss?",
      minister: "Welche Linie vertrittst du heute Abend im NATO-Briefing?",
      kandidat: "Wie positionierst du dich zum Verteidigungsbudget?",
    },
    choices: [
      {
        id: "A", tag: "Sondervermögen II", tone: "gold",
        label: "Weitere 60 Mrd. €, finanziert über neue Schulden",
        bullets: ["NATO-Partner applaudieren", "Schuldenbremse-Drama", "FDP droht mit Bruch"],
        bildQuestion: "Herr Kanzler, 60 neue Milliarden — und unsere Kinder zahlen das ab. Verantwortlich?",
        presets: [
          "Sicherheit ist die Grundlage von allem. Auch von Sozialpolitik.",
          "Wir investieren in Abschreckung — damit niemand zuschlagen muss.",
          "Wer nicht verteidigungsfähig ist, ist auch nicht souverän.",
        ],
        deltas: [
          { label: "NATO-Partner", delta: 7, unit: "%", good: true },
          { label: "FDP & Sparer", delta: -8, unit: "%", good: false },
          { label: "Glaubwürdigkeit Verteidigung", delta: 5, unit: "%", good: true },
        ],
      },
      {
        id: "B", tag: "Umschichten", tone: "red",
        label: "Im regulären Haushalt umschichten, kein neues Vermögen",
        bullets: ["Sozial-Etats müssen bluten", "Schuldenbremse hält", "SPD-Basis stöhnt"],
        bildQuestion: "Herr Kanzler, woraus genau zahlen Sie das? Wer verliert dafür Kita-Geld?",
        presets: [
          "Sicherheit darf nicht zulasten der nächsten Generation gehen.",
          "Wir priorisieren — wie jede Familie es auch tut.",
          "Verteidigung kostet. Aber sie muss aus dem Haushalt kommen.",
        ],
        deltas: [
          { label: "FDP & Union", delta: 4, unit: "%", good: true },
          { label: "SPD-Linke", delta: -7, unit: "%", good: false },
          { label: "Sozialverbände", delta: -6, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Aufrüsten", tone: "dark",
        label: "Wehrpflicht reaktivieren, Bundeswehr massiv ausbauen",
        bullets: ["CDU-Lager begeistert", "Jugend protestiert", "Russland-Signal eindeutig"],
        bildQuestion: "Herr Kanzler, holen Sie heute meinen 18-Jährigen zur Truppe? Wir wollen das nicht!",
        presets: [
          "Wer Freiheit will, muss sie auch verteidigen können.",
          "Wir reden über Pflicht — und über Schutz für 80 Millionen Menschen.",
          "Diese Welt ist nicht freundlicher geworden. Wir auch nicht naiver.",
        ],
        deltas: [
          { label: "CDU/CSU-Lager", delta: 8, unit: "%", good: true },
          { label: "Jugend-Wähler", delta: -10, unit: "%", good: false },
          { label: "NATO-Vertrauen", delta: 6, unit: "%", good: true },
        ],
      },
      {
        id: "D", tag: "Diplomatisch", tone: "blue",
        label: "Diplomatie-Offensive statt neuer Milliarden",
        bullets: ["Friedens-Wählerschaft applaudiert", "NATO ist irritiert", "Wirkt naiv im Bündnis"],
        bildQuestion: "Herr Kanzler, der General sagt „nicht abwehrbereit\". Sie sagen „reden\". Wirklich?",
        presets: [
          "Sicherheit hat viele Werkzeuge. Diplomatie ist das günstigste.",
          "Aufrüstung schafft Gegen-Aufrüstung. Wir müssen aus der Spirale.",
          "Stark sein heißt nicht laut sein.",
        ],
        deltas: [
          { label: "Friedens-Bewegung", delta: 6, unit: "%", good: true },
          { label: "NATO-Partner", delta: -7, unit: "%", good: false },
          { label: "Verteidigungslobby", delta: -8, unit: "%", good: false },
        ],
      },
    ],
  },

  /* ───────────── Day 6: Rente ───────────── */
  {
    id: "rente",
    outlet: OUTLETS.rnd,
    press: PRESS.mira,
    article: {
      kicker: "Sozialpolitik",
      headline: "Rentenpaket II:\ndie heikle Rechnung",
      deck: "Das Rentenniveau soll bei 48% gehalten werden — bezahlt mit höheren Beiträgen. Junge Bundestagsabgeordnete proben den Aufstand.",
      lede: "In der Fraktion gärt es. Was die Ministerin als „Generationenversprechen\" verkauft, nennt eine 28-jährige Abgeordnete „die größte Umverteilung von Jung nach Alt seit 1957\".",
      pull: "Beitragssatz steigt von 18,6% auf voraussichtlich 22,3% bis 2035.",
      byline: "Von Helena Pries",
    },
    video: {
      channel: "ZDF heute",
      ticker: "RENTE · Streit ums Paket II in der Koalition",
      title: "„Jung gegen Alt\": Wie viel kostet das Rentenniveau wirklich?",
      blurb: "Reporter Jan Bothe rechnet vor: was eine heute 30-jährige Verkäuferin in 35 Jahren bekommt — und was sie bis dahin einzahlen muss.",
      runtime: "4:11",
      time: "19:08",
    },
    facts: [
      "Rentenniveau aktuell: 48,1%.",
      "Zuschuss aus Bundeshaushalt: 116 Mrd. €/Jahr.",
      "1962 zahlten 6 Beitragszahler für 1 Rentner — heute 2.",
      "Aktienrente: 12 Mrd. € Startkapital eingeplant.",
    ],
    prompt: {
      kanzler: "Welche Linie vertrittst du beim Rentenpaket II?",
      opposition: "Was forderst du heute zur Rentenfrage?",
      minister: "Welchen Vorschlag legst du im Sozialausschuss vor?",
      kandidat: "Wie positionierst du dich zur Rente im Wahlkampf?",
    },
    choices: [
      {
        id: "A", tag: "Mitte", tone: "gold",
        label: "48% halten, Aktienrente schrittweise ausbauen",
        bullets: ["Versprechen wird gehalten", "Junge Generation bekommt was", "Kostet trotzdem viel"],
        bildQuestion: "Frau Kanzlerin, woher kommen die 12 Mrd. Aktienrente — und wie sicher ist die Wette?",
        presets: [
          "Die Rente bleibt verlässlich — und wir bauen vor.",
          "Aktienrente und gesetzliche Rente — beides gehört zur Zukunft.",
          "Verlässlichkeit für alle, Chancen für die Jungen.",
        ],
        deltas: [
          { label: "Rentnerschaft", delta: 5, unit: "%", good: true },
          { label: "Junge Wähler", delta: 1, unit: "%", good: true },
          { label: "FDP-Lager", delta: -3, unit: "%", good: false },
        ],
      },
      {
        id: "B", tag: "Rente stärken", tone: "red",
        label: "Rentenniveau auf 50% anheben, Beiträge steigen",
        bullets: ["Klares SPD-Signal", "Junge zahlen kräftig drauf", "Wirtschaft warnt vor Lohnzusatzkosten"],
        bildQuestion: "Frau Kanzlerin, 22% Beitrag — geben Sie damit die Berufseinsteiger:innen auf?",
        presets: [
          "Wer ein Leben lang gearbeitet hat, verdient eine gute Rente.",
          "Wir verteidigen das Rentenniveau — und damit den Generationenvertrag.",
          "Soziale Sicherheit ist nicht verhandelbar.",
        ],
        deltas: [
          { label: "Rentnerschaft", delta: 9, unit: "%", good: true },
          { label: "U-30-Wähler", delta: -8, unit: "%", good: false },
          { label: "Arbeitgeberverbände", delta: -5, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Generationengerecht", tone: "dark",
        label: "Renteneintritt auf 70, Niveau langsam absenken",
        bullets: ["Mathematisch ehrlich", "Politisch giftig", "Gewerkschaften toben"],
        bildQuestion: "Frau Kanzlerin, sagen Sie das mal einer Dachdeckerin mit 67 — noch 3 Jahre aufs Dach?",
        presets: [
          "Wir leben länger. Wir arbeiten auch länger. Das ist keine Strafe — das ist Realität.",
          "Wer heute 30 ist, soll auch noch eine Rente bekommen. Genau dafür ist das.",
          "Ehrlich rechnen ist auch Sozialpolitik.",
        ],
        deltas: [
          { label: "U-30-Wähler", delta: 7, unit: "%", good: true },
          { label: "Ältere Arbeitnehmer", delta: -10, unit: "%", good: false },
          { label: "Gewerkschaften", delta: -8, unit: "%", good: false },
        ],
      },
      {
        id: "D", tag: "Aktienrente", tone: "blue",
        label: "Voll auf Aktienrente setzen, gesetzliche stabil halten",
        bullets: ["Liberales Modell", "Aktien-Risiko bleibt", "Politisch umstritten"],
        bildQuestion: "Frau Kanzlerin, im Crash 2008 war die Rente halbiert. Wer haftet diesmal?",
        presets: [
          "Wir geben den Menschen die Chance, am Wohlstand teilzuhaben.",
          "Vorsorge ist mehr als Umlage. Beides gehört zusammen.",
          "Aktienrente ist eine Brücke — keine Wette.",
        ],
        deltas: [
          { label: "FDP-nahe Wähler", delta: 6, unit: "%", good: true },
          { label: "SPD-Linke", delta: -7, unit: "%", good: false },
          { label: "Verbraucherschutz", delta: -3, unit: "%", good: false },
        ],
      },
    ],
  },

  /* ───────────── Day 7: KI-Gesetz ───────────── */
  {
    id: "kigesetz",
    outlet: OUTLETS.sz,
    press: PRESS.konrad,
    article: {
      kicker: "Digital & Recht",
      headline: "KI-Gesetz vor\nder zweiten Lesung",
      deck: "Brüssel hat geliefert, Berlin muss umsetzen: Heute geht der nationale Aufschlag in den Bundestag. Start-ups fürchten Bürokratie, Datenschützer:innen wollen mehr.",
      lede: "Im Glaskasten des Bundestags reden vier Lobbyverbände auf eine 29-jährige Abgeordnete ein. Sie hat die Frage gestellt, vor der sich heute alle drücken: Was passiert, wenn die KI sich irrt?",
      pull: "EU-AI-Act greift seit 2025 — DE muss bis 2027 nationales Recht angepasst haben.",
      byline: "Von Anna Vetter",
    },
    video: {
      channel: "tagesschau",
      ticker: "DIGITAL · KI-Gesetz in der zweiten Lesung",
      title: "KI im Behördencomputer — Chance oder Risiko?",
      blurb: "Reporter Phil Auerbach besucht ein Jobcenter in Köln, wo schon heute KI über Anträge mitentscheidet — und einen Kläger, dem die Maschine die Hilfe verweigert hat.",
      runtime: "3:50",
      time: "17:55",
    },
    facts: [
      "EU-AI-Act unterscheidet 4 Risikoklassen.",
      "3.200 Beschwerden gegen KI-Entscheidungen in DE seit 2024.",
      "DE Start-up-Szene: 18.000 Jobs in KI direkt.",
      "Bundestags-Anhörung am 22. Mai geplant.",
    ],
    prompt: {
      kanzler: "Welche Linie vertrittst du im KI-Gesetz?",
      opposition: "Was forderst du in der zweiten Lesung?",
      minister: "Welchen Vorschlag legst du im Kabinett vor?",
      kandidat: "Wie positionierst du dich zum KI-Gesetz?",
    },
    choices: [
      {
        id: "A", tag: "Pragmatisch", tone: "gold",
        label: "Mittelweg: Pflichten für Hochrisiko, Sandbox für Start-ups",
        bullets: ["Start-up-Verband ist zufrieden", "Datenschützer halten still", "Brüssel ist beruhigt"],
        bildQuestion: "Herr Kanzler, was passiert, wenn eine KI heute meinem Vater die Pflegestufe verweigert?",
        presets: [
          "Wir machen KI sicher — ohne sie totzuregulieren.",
          "Innovation in Deutschland, Schutz für jede:n.",
          "Klare Regeln für hohe Risiken — Freiräume für Ideen.",
        ],
        deltas: [
          { label: "Tech-Branche", delta: 5, unit: "%", good: true },
          { label: "Datenschützer", delta: 2, unit: "%", good: true },
          { label: "EU-Kommission", delta: 4, unit: "%", good: true },
        ],
      },
      {
        id: "B", tag: "Schutz first", tone: "red",
        label: "Strenge Pflichten für alle KI in Behörden",
        bullets: ["Bürgerrechte gestärkt", "Behörden-Modernisierung verzögert sich", "Tech-Branche stöhnt"],
        bildQuestion: "Herr Kanzler, mit Ihrem Gesetz kommt die digitale Steuererklärung erst 2030. Wirklich?",
        presets: [
          "Menschen haben ein Recht zu wissen, warum eine Maschine über sie entschieden hat.",
          "Datenschutz ist Bürgerrecht — kein Hindernis.",
          "KI darf das Recht nicht ersetzen.",
        ],
        deltas: [
          { label: "Bürgerrechtler", delta: 8, unit: "%", good: true },
          { label: "Tech-Branche", delta: -6, unit: "%", good: false },
          { label: "Verwaltungs-Tempo", delta: -4, unit: "%", good: false },
        ],
      },
      {
        id: "C", tag: "Innovation first", tone: "dark",
        label: "Pflichten minimal halten, Standortvorteil ausbauen",
        bullets: ["Start-up-Lobby jubelt", "Datenschützer:innen toben", "EU schaut kritisch"],
        bildQuestion: "Herr Kanzler, wenn das schief geht — wer haftet dann eigentlich?",
        presets: [
          "Wir können nicht jede neue Technologie zu Tode regulieren.",
          "Deutschland darf den KI-Anschluss nicht verlieren.",
          "Vertrauen in unsere Behörden — Freiraum für unsere Tüftler:innen.",
        ],
        deltas: [
          { label: "Tech-Investoren", delta: 9, unit: "%", good: true },
          { label: "Datenschützer", delta: -8, unit: "%", good: false },
          { label: "Bürgerrechte-Lager", delta: -6, unit: "%", good: false },
        ],
      },
      {
        id: "D", tag: "Verfahren", tone: "blue",
        label: "Vor Lesung erst Enquete-Kommission einsetzen",
        bullets: ["Gründlichkeit signalisiert", "Verzögert um 8 Monate", "EU mahnt Tempo an"],
        bildQuestion: "Herr Kanzler, noch eine Kommission — wann regieren Sie eigentlich noch?",
        presets: [
          "Eine Technologie, die alles verändert, verdient mehr als drei Lesungen.",
          "Wir hören Expertinnen — und entscheiden danach.",
          "Sorgfalt schlägt Schnellschuss.",
        ],
        deltas: [
          { label: "Expertenstimmen", delta: 5, unit: "%", good: true },
          { label: "EU-Kommission", delta: -4, unit: "%", good: false },
          { label: "Entschlossenheit", delta: -5, unit: "%", good: false },
        ],
      },
    ],
  },
];

export const DOSSIER_COUNT = DOSSIERS.length;

/* Pick the dossier for a given app-day; wraps around. */
export function dossierForDay(day: number): Dossier {
  const idx = (((day - 1) % DOSSIERS.length) + DOSSIERS.length) % DOSSIERS.length;
  return { ...DOSSIERS[idx], day, date: dateForDay(day) };
}
