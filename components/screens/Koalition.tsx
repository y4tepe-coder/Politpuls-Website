"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ElectionResult, Profile, Skin } from "@/lib/types";
import { PressButton } from "@/components/ui";
import { loadSession, saveSession } from "@/lib/storage";
import { moeglicheKoalitionen, regierungsParteien } from "@/lib/campaign";
import { WAHL_PARTY_META } from "@/lib/missionsData";

/* ============================================================
   Koalitionsverhandlung + Ressortwahl — der Schritt nach dem
   Wahlsonntag. Wer als Kanzler:in oder Juniorpartner:in in die
   Regierung will, muss erst verhandeln. Ported 1:1 from
   ios/Politpuls/Screens/KoalitionView.swift.
   ============================================================ */

interface KoaRessort {
  id: string;
  kuerzel: string;
  name: string;
  role: string;
  gewicht: number;
  icon: string;
  macht: string;
}

const KOA_RESSORTS: KoaRessort[] = [
  { id: "kanzleramt", kuerzel: "Kanzleramt", name: "Bundeskanzleramt", role: "Bundeskanzler:in", gewicht: 10, icon: "🏛", macht: "Führt die Regierung und gibt die Richtlinien vor." },
  { id: "finanzen", kuerzel: "Finanzen", name: "Bundesministerium der Finanzen", role: "Finanzminister:in", gewicht: 7, icon: "💶", macht: "Kontrolliert den Bundeshaushalt — wer das Geld hält, hält die Macht." },
  { id: "wirtschaft", kuerzel: "Wirtschaft", name: "Ministerium für Wirtschaft & Klima", role: "Wirtschaftsminister:in", gewicht: 6, icon: "🏭", macht: "Steuert Industrie, Energie und den Klimakurs." },
  { id: "inneres", kuerzel: "Inneres", name: "Bundesministerium des Innern", role: "Innenminister:in", gewicht: 5, icon: "🛡", macht: "Zuständig für Sicherheit, Polizei und Migration." },
  { id: "aeusseres", kuerzel: "Äußeres", name: "Auswärtiges Amt", role: "Außenminister:in", gewicht: 4, icon: "🌍", macht: "Vertritt Deutschland in der Welt." },
  { id: "verteidigung", kuerzel: "Verteidigung", name: "Bundesministerium der Verteidigung", role: "Verteidigungsminister:in", gewicht: 4, icon: "🪖", macht: "Führt die Bundeswehr." },
  { id: "justiz", kuerzel: "Justiz", name: "Bundesministerium der Justiz", role: "Justizminister:in", gewicht: 3, icon: "⚖️", macht: "Wacht über Recht, Gesetze und Verfassung." },
  { id: "soziales", kuerzel: "Soziales", name: "Ministerium für Arbeit & Soziales", role: "Arbeitsminister:in", gewicht: 3, icon: "🤝", macht: "Zuständig für Rente, Arbeit und Bürgergeld." },
];

const KOA_RESSORT_BY_ID: Record<string, KoaRessort> = Object.fromEntries(
  KOA_RESSORTS.map((r) => [r.id, r]),
);

interface KoaStreit {
  id: string;
  thema: string;
  frage: string;
  hartTitel: string;
  hartFolge: string;
  kompromissTitel: string;
  kompromissFolge: string;
}

const KOA_STREIT: KoaStreit[] = [
  {
    id: "schulden",
    thema: "Schuldenbremse",
    frage: "{P} {will} ein 100-Milliarden-Investitionspaket auf Pump. Was ist eure Linie?",
    hartTitel: "Schuldenbremse hält — kein Cent neue Schulden",
    hartFolge: "Du setzt dich durch. {P} {ist} sichtbar verschnupft.",
    kompromissTitel: "Sondervermögen mittragen, dafür eine Steuerentlastung",
    kompromissFolge: "Ein echter Deal — beide Seiten geben etwas nach.",
  },
  {
    id: "buergergeld",
    thema: "Sozialstaat",
    frage: "Streit ums Bürgergeld: schärfere Sanktionen oder höhere Regelsätze?",
    hartTitel: "Schärfere Pflichten — wer arbeiten kann, muss",
    hartFolge: "Deine Basis jubelt. Am Verhandlungstisch wird es eisig.",
    kompromissTitel: "Etwas mehr Geld, etwas mehr Pflichten",
    kompromissFolge: "Niemand gewinnt ganz — aber die Koalition hält.",
  },
  {
    id: "klima",
    thema: "Klima & Energie",
    frage: "Das Verbrenner-Aus 2035 — durchziehen oder aufweichen?",
    hartTitel: "Technologieoffen bleiben — kein festes Verbrenner-Aus",
    hartFolge: "Klare Kante. {P} {ist} außer sich — der Öko-Flügel tobt.",
    kompromissTitel: "Aus 2035, aber mit Ausnahmen für E-Fuels",
    kompromissFolge: "Ein Kompromiss, mit dem alle leben können.",
  },
];

const KoaRegeln = {
  klimaStart: 62,
  klimaHart: -15,
  klimaKompromiss: 8,
  klimaPlatzt: 35,
  ressortPool: 42,
} as const;

type KoaPhase = "intro" | "streit" | "geplatzt" | "ressort" | "fertig";

const C = {
  bg: "#FBF6E9",
  surface: "#FFFFFF",
  ink: "#1F1D17",
  paper: "#FBF6E9",
  text: "#1F1D17",
  textMuted: "#4A463C",
  textDim: "#807A6A",
  divider: "#E8E2D2",
  tagBg: "#F0EADB",
  red: "#D81E26",
  redDeep: "#9B1219",
  gold: "#F6C414",
  green: "#1AA037",
  greenDeep: "#166B3A",
};

function partnerForm(partnerId: string): { subjekt: string; plural: boolean } {
  switch (partnerId) {
    case "cdu":    return { subjekt: "die CDU/CSU", plural: false };
    case "spd":    return { subjekt: "die SPD", plural: false };
    case "gruene": return { subjekt: "die Grünen", plural: true };
    case "fdp":    return { subjekt: "die FDP", plural: false };
    case "linke":  return { subjekt: "die Linke", plural: false };
    case "afd":    return { subjekt: "die AfD", plural: false };
    case "bsw":    return { subjekt: "das BSW", plural: false };
    default:       return { subjekt: "die Bewegung", plural: false };
  }
}

function personalisiere(text: string, partnerId: string): string {
  const f = partnerForm(partnerId);
  const gross = f.subjekt.charAt(0).toUpperCase() + f.subjekt.slice(1);
  return text
    .replaceAll("{P}", gross)
    .replaceAll("{p}", f.subjekt)
    .replaceAll("{will}", f.plural ? "wollen" : "will")
    .replaceAll("{ist}", f.plural ? "sind" : "ist");
}

export default function MissionKoalition({
  onClose: _onClose,
  onDone,
}: {
  skin?: Skin;
  onClose: () => void;
  onDone: (xp?: number) => void;
}) {
  const session = loadSession();
  const profile: Profile = session?.profile ?? {};
  const ownPartyId = profile.party ?? "eigen";
  const isKanzler = (profile.electedRole ?? profile.role) === "kanzler";
  const results: ElectionResult[] = profile.electionResults ?? [];

  const [phase, setPhase] = useState<KoaPhase>("intro");
  const [streitIdx, setStreitIdx] = useState(0);
  const [streitWahl, setStreitWahl] = useState<boolean | null>(null);
  const [, setEntscheidungen] = useState<Record<string, boolean>>({});
  const [klima, setKlima] = useState<number>(KoaRegeln.klimaStart);
  const [picks, setPicks] = useState<Set<string>>(new Set());
  const [chosenCoalition, setChosenCoalition] = useState<string[] | null>(null);

  const koalitionsOptionen = useMemo(
    () => moeglicheKoalitionen(results, ownPartyId),
    [results, ownPartyId],
  );

  const coalition = chosenCoalition ?? [];
  const pctFor = (id: string) => results.find((r) => r.id === id)?.pct ?? 0;
  const ownPct = pctFor(ownPartyId);
  const coalitionPct = coalition.reduce((s, id) => s + pctFor(id), 0);
  const leadPartyId = coalition[0] ?? ownPartyId;
  const partnerId =
    coalition.find((id) => id !== ownPartyId) ?? leadPartyId;

  const klimaBonus = klima >= 75 ? 3 : klima >= 55 ? 1 : -1;
  const verhandlungsgewicht = useMemo(() => {
    if (isKanzler) {
      const kanzleramt = KOA_RESSORT_BY_ID["kanzleramt"]?.gewicht ?? 10;
      return kanzleramt + Math.max(3, 3 + klimaBonus);
    }
    const share = coalitionPct > 0 ? ownPct / coalitionPct : 0.3;
    const base = Math.round(share * KoaRegeln.ressortPool);
    return Math.max(10, base + klimaBonus);
  }, [isKanzler, ownPct, coalitionPct, klimaBonus]);

  const usedGewicht = useMemo(() => {
    const gewaehlt = Array.from(picks).reduce(
      (s, id) => s + (KOA_RESSORT_BY_ID[id]?.gewicht ?? 0),
      0,
    );
    const kanzleramt = isKanzler ? KOA_RESSORT_BY_ID["kanzleramt"]?.gewicht ?? 10 : 0;
    return gewaehlt + kanzleramt;
  }, [picks, isKanzler]);

  const restGewicht = verhandlungsgewicht - usedGewicht;

  const primaryRessortId = useMemo(() => {
    if (isKanzler) return "kanzleramt";
    const picked = KOA_RESSORTS.filter((r) => picks.has(r.id));
    return picked.sort((a, b) => b.gewicht - a.gewicht)[0]?.id ?? "";
  }, [picks, isKanzler]);

  const stepNr =
    phase === "intro" ? 1
    : phase === "streit" ? 2
    : phase === "geplatzt" ? 2
    : phase === "ressort" ? 3
    : 4;

  /* Beim Intro die bisher gewählte Koalition vorauswählen, sonst die erste. */
  useEffect(() => {
    if (chosenCoalition !== null) return;
    const bisher = profile.coalitionParties;
    const fromOpts =
      koalitionsOptionen.find((o) => bisher && arrEq(o, bisher)) ??
      koalitionsOptionen[0] ??
      bisher ??
      null;
    if (fromOpts) setChosenCoalition(fromOpts);
  }, [chosenCoalition, koalitionsOptionen, profile.coalitionParties]);

  /* ─── Phase 1 · Intro ───────────────────────────────────── */
  function renderIntro() {
    return (
      <>
        <Headline
          kicker={isKanzler ? "Regierungsbildung" : "Regierungsbildung · Juniorpartner"}
          title="Mit wem regierst du?"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {koalitionsOptionen.map((ids) => (
            <KoalitionCard
              key={ids.join(",")}
              ids={ids}
              selected={arrEq(coalition, ids)}
              results={results}
              onClick={() => setChosenCoalition(ids)}
            />
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <PressButton
            variant={coalition.length === 0 ? "ghost" : "primary"}
            size="lg"
            full
            disabled={coalition.length === 0}
            onClick={() => {
              const s = loadSession() ?? {};
              saveSession({
                ...s,
                profile: { ...(s.profile ?? {}), coalitionParties: coalition },
              });
              setPhase("streit");
            }}
          >
            Verhandlung beginnen
          </PressButton>
        </div>
      </>
    );
  }

  /* ─── Phase 2 · Streitthemen ────────────────────────────── */
  function renderStreit() {
    const streit = KOA_STREIT[Math.min(streitIdx, KOA_STREIT.length - 1)];
    return (
      <>
        <KlimaMeter klima={klima} />
        <div style={{ marginTop: 14 }}>
          <Headline
            kicker={`Streitthema ${streitIdx + 1}/${KOA_STREIT.length} · ${streit.thema}`}
            title={personalisiere(streit.frage, partnerId)}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <StreitOption streit={streit} hart={true} on={streitWahl === true}  partnerId={partnerId} onClick={() => setStreitWahl(true)} />
          <StreitOption streit={streit} hart={false} on={streitWahl === false} partnerId={partnerId} onClick={() => setStreitWahl(false)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <PressButton
            variant={streitWahl === null ? "ghost" : "primary"}
            size="lg"
            full
            disabled={streitWahl === null}
            onClick={commitStreit}
          >
            {streitWahl === null
              ? "Position wählen"
              : streitIdx + 1 < KOA_STREIT.length
                ? "Weiter verhandeln"
                : "Verhandlung abschließen"}
          </PressButton>
        </div>
      </>
    );
  }

  function commitStreit() {
    const streit = KOA_STREIT[Math.min(streitIdx, KOA_STREIT.length - 1)];
    if (streitWahl === null) return;
    setEntscheidungen((e) => ({ ...e, [streit.id]: streitWahl }));
    const next = Math.max(
      0,
      Math.min(100, klima + (streitWahl ? KoaRegeln.klimaHart : KoaRegeln.klimaKompromiss)),
    );
    setKlima(next);
    setStreitWahl(null);
    if (streitIdx + 1 < KOA_STREIT.length) {
      setStreitIdx((i) => i + 1);
    } else {
      setPhase(next < KoaRegeln.klimaPlatzt ? "geplatzt" : "ressort");
    }
  }

  /* ─── Phase · Geplatzt ──────────────────────────────────── */
  function renderGeplatzt() {
    return (
      <>
        <div
          style={{
            ...cardBase,
            background: C.redDeep,
            color: "#fff",
            marginTop: 14,
            padding: 20,
          }}
        >
          <div style={{ ...eyebrow, color: "rgba(255,255,255,0.8)" }}>
            VERHANDLUNG GESCHEITERT
          </div>
          <div style={{ ...display(26), color: "#fff", marginTop: 6 }}>
            Die Koalition ist geplatzt.
          </div>
          <p style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
            Du hast zu hart gepokert. Das Koalitionsklima ist auf {Math.round(klima)} gefallen —
            die Partner haben den Tisch verlassen. Eine andere Mehrheit übernimmt die Regierung.
          </p>
          <div
            style={{
              marginTop: 14,
              padding: 12,
              fontSize: 12,
              color: "#fff",
              lineHeight: 1.6,
              background: "rgba(0,0,0,0.22)",
              borderRadius: 10,
            }}
          >
            Profil zeigen ist gut — aber ohne Kompromiss kommt man in Deutschland in keine
            Regierung. Nächstes Mal klüger verhandeln.
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <PressButton
            variant="dark"
            size="lg"
            full
            onClick={() => {
              /* Spieler in Opposition, Koalition leeren, Ressort weg. */
              const s = loadSession() ?? {};
              const autoCoalition = regierungsParteien(results, ownPartyId);
              saveSession({
                ...s,
                profile: {
                  ...(s.profile ?? {}),
                  electedRole: "opposition",
                  coalitionParties: autoCoalition,
                  ressort: undefined,
                },
              });
              onDone(40);
            }}
          >
            In die Opposition · +40 XP
          </PressButton>
        </div>
      </>
    );
  }

  /* ─── Phase 3 · Ressortwahl ─────────────────────────────── */
  function renderRessort() {
    const ressortWeiterEnabled =
      usedGewicht <= verhandlungsgewicht && (isKanzler || picks.size > 0);
    const ressortWeiterTitel =
      usedGewicht > verhandlungsgewicht
        ? "Zu viel verlangt"
        : !isKanzler && picks.size === 0
          ? "Mindestens ein Ressort wählen"
          : "Regierung bilden";
    return (
      <>
        <Headline
          kicker="Ressortverteilung"
          title={isKanzler ? "Dein Kabinett" : "Welche Ministerien holst du?"}
        />
        <div style={{ marginTop: 12 }}>
          <GewichtMeter used={usedGewicht} max={verhandlungsgewicht} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {KOA_RESSORTS.map((r) => (
            <RessortCard
              key={r.id}
              r={r}
              picked={picks.has(r.id)}
              isKanzler={isKanzler}
              restGewicht={restGewicht}
              leadPartyId={leadPartyId}
              onToggle={() => {
                if (r.id === "kanzleramt") return;
                setPicks((prev) => {
                  const next = new Set(prev);
                  if (next.has(r.id)) next.delete(r.id);
                  else next.add(r.id);
                  return next;
                });
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <PressButton
            variant={ressortWeiterEnabled ? "success" : "ghost"}
            size="lg"
            full
            disabled={!ressortWeiterEnabled}
            onClick={() => setPhase("fertig")}
          >
            {ressortWeiterTitel}
          </PressButton>
        </div>
      </>
    );
  }

  /* ─── Phase 4 · Vereidigung ─────────────────────────────── */
  function renderFertig() {
    const primary = KOA_RESSORT_BY_ID[primaryRessortId];
    const weitere = KOA_RESSORTS.filter((r) => picks.has(r.id) && r.id !== primaryRessortId);
    const eyebrowCol = isKanzler ? "rgba(31,29,23,0.75)" : "rgba(255,255,255,0.8)";
    const txtCol = isKanzler ? C.ink : "#fff";
    return (
      <>
        <div
          style={{
            ...cardBase,
            marginTop: 14,
            padding: 20,
            background: isKanzler ? C.gold : C.green,
            color: txtCol,
          }}
        >
          <div style={{ ...eyebrow, color: eyebrowCol }}>
            {isKanzler ? "REGIERUNGSCHEF:IN" : "KABINETTSMITGLIED"}
          </div>
          <div style={{ ...display(25), color: txtCol, marginTop: 6 }}>
            {isKanzler ? "Du wirst Bundeskanzler:in." : `Du wirst ${primary?.role ?? "Minister:in"}.`}
          </div>
          <p style={{ marginTop: 8, fontSize: 12.5, color: txtCol, opacity: 0.9, lineHeight: 1.6 }}>
            {primary?.macht ?? "Die Koalition steht."}
          </p>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...eyebrow, color: eyebrowCol, opacity: 0.55 }}>
              {isKanzler ? "DEINE PARTEI FÜHRT" : "IN DEINER HAND"}
            </div>
            {primary && <KabinettZeile r={primary} istChef isKanzler={isKanzler} />}
            {weitere.map((r) => (
              <KabinettZeile key={r.id} r={r} istChef={false} isKanzler={isKanzler} />
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              fontSize: 11.5,
              color: txtCol,
              lineHeight: 1.6,
              background: isKanzler ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.2)",
              borderRadius: 10,
            }}
          >
            {primaryRessortId === "kanzleramt" || primaryRessortId === "finanzen"
              ? `Als ${primary?.role ?? "Minister:in"} steuerst du jetzt den Bundeshaushalt.`
              : "Tag für Tag triffst du jetzt Entscheidungen in deinem Ressort."}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <PressButton
            variant="success"
            size="lg"
            full
            onClick={() => {
              const s = loadSession() ?? {};
              saveSession({
                ...s,
                profile: {
                  ...(s.profile ?? {}),
                  coalitionParties: coalition,
                  ressort: primaryRessortId,
                },
              });
              onDone(100);
            }}
          >
            Vereidigung im Bundestag · +100 XP
          </PressButton>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ProgressHeader step={stepNr} total={4} showStep={phase !== "geplatzt"} />
      <div style={{ flex: 1, overflow: "auto", padding: "4px 16px 32px" }}>
        {phase === "intro" && renderIntro()}
        {phase === "streit" && renderStreit()}
        {phase === "geplatzt" && renderGeplatzt()}
        {phase === "ressort" && renderRessort()}
        {phase === "fertig" && renderFertig()}
      </div>
    </div>
  );
}

/* ─── Sub-Komponenten ─────────────────────────────────────────── */

function ProgressHeader({
  step,
  total,
  showStep,
}: {
  step: number;
  total: number;
  showStep: boolean;
}) {
  const pct = Math.max(0, Math.min(1, step / total));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px 10px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 10,
          background: C.tagBg,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: C.red,
            borderRadius: 5,
            transition: "width 280ms ease",
          }}
        />
      </div>
      <div
        style={{
          width: 88,
          textAlign: "right",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          fontWeight: 800,
          color: C.red,
          letterSpacing: 0.5,
        }}
      >
        {showStep ? `KOALITION · ${step}/${total}` : "KOALITION"}
      </div>
    </div>
  );
}

function Headline({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div>
      <div style={eyebrow}>{kicker.toUpperCase()}</div>
      <div style={{ ...display(24), marginTop: 4 }}>{title}</div>
      {sub && (
        <p style={{ marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function KoalitionCard({
  ids,
  selected,
  results,
  onClick,
}: {
  ids: string[];
  selected: boolean;
  results: ElectionResult[];
  onClick: () => void;
}) {
  const pct = ids.reduce(
    (s, id) => s + (results.find((r) => r.id === id)?.pct ?? 0),
    0,
  );
  const names = ids.map((id) => WAHL_PARTY_META[id]?.name ?? id).join(" + ");
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...cardBase,
        padding: 13,
        display: "flex",
        alignItems: "center",
        gap: 11,
        background: selected ? C.ink : C.surface,
        color: selected ? C.paper : C.text,
        border: `${selected ? 2.5 : 1.5}px solid ${selected ? C.gold : C.divider}`,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 21,
          height: 21,
          borderRadius: 999,
          border: `2px solid ${selected ? C.gold : C.divider}`,
          background: selected ? C.gold : "transparent",
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800 }}>{names}</div>
        <div style={{ display: "flex", gap: 2 }}>
          {ids.map((id) => {
            const meta = WAHL_PARTY_META[id] ?? WAHL_PARTY_META.eigen;
            const p = results.find((r) => r.id === id)?.pct ?? 1;
            return (
              <div
                key={id}
                style={{
                  height: 5,
                  borderRadius: 3,
                  background: meta.color,
                  flex: p,
                }}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          fontWeight: 800,
          color: selected ? C.gold : C.greenDeep,
        }}
      >
        {pct.toFixed(0)} %
      </div>
    </button>
  );
}

function KlimaMeter({ klima }: { klima: number }) {
  const c = klima >= 60 ? C.greenDeep : klima >= KoaRegeln.klimaPlatzt ? C.gold : C.redDeep;
  return (
    <div style={{ ...cardBase, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...eyebrow }}>KOALITIONSKLIMA</span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            fontWeight: 800,
            color: c,
          }}
        >
          {Math.round(klima)} / 100
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          position: "relative",
          height: 9,
          background: C.tagBg,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.max(0, Math.min(100, klima))}%`,
            background: c,
            borderRadius: 4,
            transition: "width 240ms ease, background 240ms ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${KoaRegeln.klimaPlatzt}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: C.redDeep,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 10.5,
          fontWeight: 600,
          color: klima < 50 ? C.redDeep : C.textDim,
        }}
      >
        {klima < 50
          ? "Achtung — fällt das Klima zu tief, platzt die Koalition."
          : "Die Stimmung am Verhandlungstisch ist stabil."}
      </div>
    </div>
  );
}

function StreitOption({
  streit,
  hart,
  on,
  partnerId,
  onClick,
}: {
  streit: KoaStreit;
  hart: boolean;
  on: boolean;
  partnerId: string;
  onClick: () => void;
}) {
  const titel = personalisiere(hart ? streit.hartTitel : streit.kompromissTitel, partnerId);
  const folge = personalisiere(hart ? streit.hartFolge : streit.kompromissFolge, partnerId);
  const tag = hart ? "HART BLEIBEN" : "KOMPROMISS";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...cardBase,
        padding: 16,
        background: on ? C.ink : C.surface,
        color: on ? C.paper : C.text,
        border: `${on ? 2.5 : 1.5}px solid ${on ? C.gold : C.divider}`,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            color: on ? C.gold : hart ? C.red : C.greenDeep,
          }}
        >
          {tag}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.4,
            color: on
              ? hart ? "#F4B8B8" : "#8FE0A4"
              : hart ? C.redDeep : C.greenDeep,
          }}
        >
          {hart ? "↓" : "↑"} {hart ? "Klima sinkt" : "Klima steigt"}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4 }}>{titel}</div>
      {on && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "rgba(251,246,233,0.7)", lineHeight: 1.55 }}>
          {folge}
        </div>
      )}
    </button>
  );
}

function GewichtMeter({ used, max }: { used: number; max: number }) {
  const over = used > max;
  return (
    <div style={{ ...cardBase, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={eyebrow}>DEIN VERHANDLUNGSGEWICHT</span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            fontWeight: 800,
            color: over ? C.redDeep : C.ink,
          }}
        >
          {used} / {max}
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          height: 9,
          background: C.tagBg,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, (used / Math.max(1, max)) * 100))}%`,
            height: "100%",
            background: over ? C.redDeep : C.gold,
            transition: "width 240ms ease, background 240ms ease",
          }}
        />
      </div>
    </div>
  );
}

function RessortCard({
  r,
  picked,
  isKanzler,
  restGewicht,
  leadPartyId,
  onToggle,
}: {
  r: KoaRessort;
  picked: boolean;
  isKanzler: boolean;
  restGewicht: number;
  leadPartyId: string;
  onToggle: () => void;
}) {
  const isKanzleramt = r.id === "kanzleramt";
  const lockedMine = isKanzleramt && isKanzler;
  const lockedOther = isKanzleramt && !isKanzler;
  const affordable = picked || r.gewicht <= restGewicht;
  const disabled = isKanzleramt || (!affordable && !picked);
  const leadMeta = WAHL_PARTY_META[leadPartyId] ?? WAHL_PARTY_META.eigen;
  const active = picked || lockedMine;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        ...cardBase,
        padding: "11px 13px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? C.ink : C.surface,
        color: active ? C.paper : C.text,
        border: `${active ? 2.5 : 1.5}px solid ${active ? C.gold : C.divider}`,
        opacity: disabled && !lockedMine && !lockedOther ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 24, width: 34, textAlign: "center" }}>{r.icon}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: active ? C.paper : C.text }}>
            {r.kuerzel}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 5px",
              borderRadius: 4,
              background: active ? "rgba(255,255,255,0.12)" : C.tagBg,
              color: active ? C.gold : C.textDim,
            }}
          >
            Gewicht {r.gewicht}
          </span>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: active ? C.gold : C.textDim }}>
          {r.role}
        </div>
      </div>
      <div style={{ width: isKanzleramt ? undefined : 80, textAlign: "right" }}>
        {lockedMine ? (
          <StatusTag s="DEIN AMT" bg={C.green} fg="#fff" />
        ) : lockedOther ? (
          <StatusTag s={`→ ${leadMeta.name}`} bg={C.tagBg} fg={C.textDim} />
        ) : picked ? (
          <span style={{ fontSize: 22, color: C.gold }}>●</span>
        ) : !affordable ? (
          <StatusTag s="ZU TEUER" bg={C.tagBg} fg={C.redDeep} />
        ) : (
          <span style={{ fontSize: 22, color: C.divider }}>○</span>
        )}
      </div>
    </button>
  );
}

function StatusTag({ s, bg, fg }: { s: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 7px",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.6,
        borderRadius: 6,
        background: bg,
        color: fg,
      }}
    >
      {s}
    </span>
  );
}

function KabinettZeile({
  r,
  istChef,
  isKanzler,
}: {
  r: KoaRessort;
  istChef: boolean;
  isKanzler: boolean;
}) {
  const txt = isKanzler ? C.ink : "#fff";
  const muted = isKanzler ? "rgba(31,29,23,0.6)" : "rgba(255,255,255,0.65)";
  return (
    <div
      style={{
        padding: "7px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 9,
        background: (isKanzler ? "rgba(0,0,0," : "rgba(255,255,255,") + (istChef ? "0.12)" : "0.06)"),
      }}
    >
      <span style={{ fontSize: 16 }}>{r.icon}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: txt }}>{r.name}</span>
        <span style={{ fontSize: 9.5, color: muted }}>
          {istChef ? "Dein persönliches Amt" : "geführt von deiner Partei"}
        </span>
      </div>
      {istChef && (
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            padding: "3px 6px",
            borderRadius: 5,
            color: isKanzler ? C.gold : C.green,
            background: isKanzler ? C.ink : "#fff",
          }}
        >
          DU
        </span>
      )}
    </div>
  );
}

/* ─── Style snippets ──────────────────────────────────────────── */

const cardBase: CSSProperties = {
  background: C.surface,
  border: `1.5px solid ${C.divider}`,
  borderRadius: 14,
};

const eyebrow: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  color: C.red,
  textTransform: "uppercase",
};

function display(size: number): CSSProperties {
  return {
    fontFamily: "var(--font-display), 'Bricolage Grotesque', system-ui, sans-serif",
    fontSize: size,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    lineHeight: 1.05,
    color: C.text,
  };
}

function arrEq<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/* Silence "unused" warning for ReactNode import (used in props typing). */
type _Unused = ReactNode;
