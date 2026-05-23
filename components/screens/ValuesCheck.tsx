'use client';

// Werte-Check — self-contained screen opened from the Spectrum screen.
// Tinder-Swipe-Deck for the 18 statements:
//   ← Dagegen   → Dafür   ↑ Später   ↓/Tap-Mitte Neutral
// Between categories a large intro-overlay fades in with the category
// name (Kultur → Umwelt → …). When all 18 are answered, the user taps
// "Profil enthüllen" → the AlignmentRevealStep shows the party match.
// On "Fertig", results are persisted via updateProfile and onDone fires.

import React from 'react';
import type { CSSProperties } from 'react';
import type { Stance } from '@/lib/types';
import { updateProfile } from '@/lib/storage';
import {
  POSITIONS_CATALOGUE,
  PQ_PARTIES_LIVE,
  categoryBlurb,
  computePartyAlignment,
} from '@/lib/onboardingData';
import { PressButton } from '@/components/ui';

type SwipeStance = Stance | 'skip';
type Answers = Record<string, Stance>;

interface DeckCard {
  id: string;
  text: string;
  stances: Record<string, Stance>;
  catId: string;
  catLabel: string;
  catColor: string;
}

const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY = 0.55;

// ─── Build & helpers ─────────────────────────────────────────────
function buildDeck(): DeckCard[] {
  return POSITIONS_CATALOGUE.flatMap((c) =>
    c.items.map((i) => ({
      ...i,
      catId: c.id,
      catLabel: c.label,
      catColor: c.color,
    }))
  );
}

// ─── Local Headline ──────────────────────────────────────────────
function Headline({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#807A6A',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        {kicker}
      </div>
      <div
        className="pq-display-tight"
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: '#1F1D17',
          marginTop: 4,
          lineHeight: 1.05,
          letterSpacing: '-.02em',
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 13,
            color: '#4A463C',
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Phone-Toast (iOS-style banner from "Wahlkampf-Zentrale") ─────
// Rendered inline as an absolutely-positioned banner near the top of
// the Werte-Check screen (no portal).
function PhoneToast({
  text,
  title = 'Wahlkampf-Zentrale',
  onDone,
}: {
  text: string;
  title?: string;
  onDone: () => void;
}) {
  React.useEffect(() => {
    const id = setTimeout(onDone, 4800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={onDone}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'rgba(255,255,255,.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 22,
          padding: '11px 14px 12px',
          boxShadow:
            '0 18px 44px -10px rgba(20,19,15,.45), 0 0 0 .5px rgba(0,0,0,.06)',
          display: 'flex',
          gap: 11,
          alignItems: 'flex-start',
          animation: 'pq-notif-drop .5s cubic-bezier(.2,.9,.25,1.15)',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: '#1F1D17',
            color: '#F6C414',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 0 rgba(255,255,255,.4) inset',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 3 H 14 L 18 7 V 21 H 6 Z"
              stroke="#F6C414"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M9 11 H 15 M 9 15 H 13"
              stroke="#F6C414"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: '#1F1D17',
              letterSpacing: '-.005em',
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {title}
            </span>
            <span style={{ color: '#807A6A', fontWeight: 600 }}>jetzt</span>
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: '#1F1D17',
              marginTop: 2,
              lineHeight: 1.32,
              fontWeight: 600,
              letterSpacing: '-.005em',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ValuesCheck — main flow (was PositionsStep) ─────────────────
export default function ValuesCheck({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [value, setValue] = React.useState<Answers>({});
  const [phase, setPhase] = React.useState<'pick' | 'reveal'>('pick');
  const [notice, setNotice] = React.useState<{ id: number; text: string } | null>(
    null
  );
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [nudgeShown, setNudgeShown] = React.useState(false);

  const allItems = POSITIONS_CATALOGUE.flatMap((c) =>
    c.items.map((i) => ({
      ...i,
      catId: c.id,
      catLabel: c.label,
      catColor: c.color,
    }))
  );
  const TOTAL = allItems.length; // 18
  const answeredCount = Object.values(value).filter(Boolean).length;
  const allAnswered = answeredCount >= TOTAL;

  const fireToast = (text: string) => setNotice({ id: Date.now(), text });

  const setStance = (itemId: string, stance: Stance) => {
    const wasUnanswered = !value[itemId];
    const nextValue: Answers = { ...value, [itemId]: stance };
    setValue(nextValue);
    const nextAnswered = Object.values(nextValue).filter(Boolean).length;
    if (
      wasUnanswered &&
      nextAnswered === Math.ceil(TOTAL / 2) &&
      !nudgeShown
    ) {
      setNudgeShown(true);
      fireToast(
        `Stark — Halbzeit! Beantworte alle ${TOTAL}, dann sehen wir, welche Partei zu dir passt.`
      );
    }
  };

  if (phase === 'reveal') {
    return (
      <div
        style={{
          minHeight: '100%',
          background: '#FBF6E9',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ValuesCheckHeader onClose={onClose} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 18px 22px',
          }}
        >
          <AlignmentRevealStep
            value={value}
            onBack={() => setPhase('pick')}
            onDone={onDone}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#FBF6E9',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <ValuesCheckHeader onClose={onClose} />

      {notice && (
        <PhoneToast
          key={notice.id}
          text={notice.text}
          onDone={() => setNotice(null)}
        />
      )}
      {infoOpen && (
        <InfoSheet onClose={() => setInfoOpen(false)} total={TOTAL} />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '14px 18px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Headline
              kicker="Werte-Check"
              title="Wofür stehst du?"
              sub={`Beantworte alle ${TOTAL} Aussagen mit Dafür, Neutral oder Dagegen. Daraus errechnen wir, welche Partei am besten zu dir passt.`}
            />
          </div>
          <button
            onClick={() => setInfoOpen(true)}
            aria-label="Wie funktioniert das?"
            style={{
              marginTop: 22,
              flexShrink: 0,
              width: 30,
              height: 30,
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#1F1D17',
              border: 0,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontFamily: '"Bricolage Grotesque", serif',
              fontWeight: 800,
              fontSize: 17,
              lineHeight: 1,
              fontStyle: 'italic',
              boxShadow: 'inset 0 0 0 1.5px #1F1D17, inset 0 -2px 0 #1F1D17',
            }}
          >
            i
          </button>
        </div>

        {/* Counter + Progress */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: allAnswered
                ? '#F6C414'
                : answeredCount === 0
                ? '#FFFFFF'
                : '#1F1D17',
              color: allAnswered
                ? '#1F1D17'
                : answeredCount === 0
                ? '#1F1D17'
                : '#FBF6E9',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '.04em',
              boxShadow:
                answeredCount === 0
                  ? 'inset 0 0 0 1.5px #E8E2D2'
                  : 'inset 0 -3px 0 rgba(0,0,0,.25)',
            }}
          >
            <span>
              {answeredCount}/{TOTAL}
            </span>
            <span style={{ opacity: 0.65, fontWeight: 600 }}>beantwortet</span>
            {allAnswered && (
              <span
                style={{
                  marginLeft: 4,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: '#1F1D17',
                  color: '#F6C414',
                  fontSize: 9,
                  letterSpacing: '.08em',
                  fontWeight: 800,
                }}
              >
                FERTIG
              </span>
            )}
          </div>
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: '#F0EADB',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1px #E8E2D2',
            }}
          >
            <div
              style={{
                width: `${(answeredCount / TOTAL) * 100}%`,
                height: '100%',
                background: allAnswered ? '#F6C414' : '#1F1D17',
                transition: 'width .25s ease-out, background .2s',
              }}
            />
          </div>
        </div>

        {/* Items — Tinder-Swipe-Deck */}
        <div style={{ marginTop: 12 }}>
          <SwipeStack value={value} onStance={setStance} />
        </div>

        <div style={{ flex: 1, minHeight: 12 }} />
        <PressButton
          variant={allAnswered ? 'primary' : 'ghost'}
          size="lg"
          full
          disabled={!allAnswered}
          onClick={() => setPhase('reveal')}
          style={{ marginTop: 14 }}
        >
          {allAnswered
            ? 'Profil enthüllen'
            : `Noch ${TOTAL - answeredCount} offen`}
        </PressButton>
      </div>
    </div>
  );
}

// ─── Header bar with X close button ──────────────────────────────
function ValuesCheckHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px 0',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Schließen"
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: '#FFFFFF',
          border: 0,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 0 0 1.5px #E8E2D2',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            d="M6 6 L 18 18 M 18 6 L 6 18"
            stroke="#1F1D17"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#1F1D17',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Werte-Check
      </div>
    </div>
  );
}

// ─── Info-Sheet: erklärt das System ──────────────────────────────
function InfoSheet({ onClose, total }: { onClose: () => void; total: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 80,
        background: 'rgba(20,19,15,.5)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'pq-rise .25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: '#FBF6E9',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: '14px 18px 22px',
          boxShadow: '0 -20px 40px -10px rgba(20,19,15,.4)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            background: '#C9BFA3',
            borderRadius: 999,
            margin: '0 auto 14px',
          }}
        />
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#807A6A',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          So funktioniert's
        </div>
        <div
          className="pq-display-tight"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#1F1D17',
            marginTop: 4,
            lineHeight: 1.1,
            letterSpacing: '-.02em',
          }}
        >
          Erst deine Werte, dann die Partei.
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <InfoBullet
            n="1"
            title="Beantworte alle Aussagen"
            body={`In sechs Feldern liegen ${total} politische Aussagen. Sag bei jeder: Dafür, Neutral oder Dagegen.`}
          />
          <InfoBullet
            n="2"
            title="Wir gleichen mit allen Parteien ab"
            body="Jede Aussage hat eine offizielle Partei-Position. Wir vergleichen Punkt für Punkt deine Antworten mit jeder Partei."
          />
          <InfoBullet
            n="3"
            title="Du bekommst dein Balkendiagramm"
            body="Am Ende siehst du als Balken, welche Partei dir am nächsten ist — und welche am weitesten weg."
          />
          <InfoBullet
            n="4"
            title="Später: dein Wahlkampf"
            body="Wenn du loslegst, wählst du aus deinen Themen drei aus, die dein persönlicher Wahlkampf-Fokus werden."
            soft
          />
        </div>

        <PressButton
          variant="primary"
          size="lg"
          full
          onClick={onClose}
          style={{ marginTop: 18 }}
        >
          Verstanden
        </PressButton>
      </div>
    </div>
  );
}

function InfoBullet({
  n,
  title,
  body,
  soft,
}: {
  n: string;
  title: string;
  body: string;
  soft?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          flexShrink: 0,
          background: soft ? '#FFFFFF' : '#1F1D17',
          color: soft ? '#1F1D17' : '#F6C414',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 13,
          fontWeight: 800,
          boxShadow: soft
            ? 'inset 0 0 0 1.5px #1F1D17'
            : 'inset 0 -2px 0 rgba(0,0,0,.3)',
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#1F1D17',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: '#4A463C',
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

// ─── Reveal-Screen: "Dein politisches Profil" ────────────────────
function AlignmentRevealStep({
  value,
  onBack,
  onDone,
}: {
  value: Answers;
  onBack: () => void;
  onDone: () => void;
}) {
  const align = computePartyAlignment(value);
  const sorted = [...PQ_PARTIES_LIVE].sort(
    (a, b) => (align[b.id] || 0) - (align[a.id] || 0)
  );
  const top = sorted[0];
  const rest = sorted.slice(1);

  const topPct = Math.round((align[top.id] || 0) * 100);
  const isBright = top.color === '#FFCC00';

  const handleDone = () => {
    updateProfile({
      positions: value,
      alignment: align,
      topParty: top.id,
    });
    onDone();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Auswertung"
        title="Dein politisches Profil"
        sub="Deine Antworten formen ein klares Bild. So sieht es aus."
      />

      {/* Big top-match card */}
      <div
        style={{
          marginTop: 16,
          background: top.color,
          color: top.text,
          padding: '18px 18px 16px',
          borderRadius: 18,
          overflow: 'hidden',
          position: 'relative',
          boxShadow:
            'inset 0 -6px 0 rgba(0,0,0,.25), 0 16px 36px -16px rgba(20,19,15,.35)',
          animation: 'pq-rise .45s ease-out',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          Größte Übereinstimmung
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 4,
          }}
        >
          <div
            className="pq-display-tight"
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: '-.04em',
            }}
          >
            {topPct}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, opacity: 0.8 }}>%</div>
        </div>

        <div
          className="pq-display-tight"
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginTop: 8,
            lineHeight: 1,
            letterSpacing: '-.02em',
          }}
        >
          {top.name}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            opacity: 0.82,
            marginTop: 4,
            letterSpacing: '.04em',
          }}
        >
          {top.short} · {top.vibe}
        </div>

        {/* Big "match" stamp in top-right */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 10px',
            borderRadius: 999,
            background: isBright ? '#1F1D17' : 'rgba(255,255,255,.18)',
            color: isBright ? '#F6C414' : top.text,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
          }}
        >
          Top-Match
        </div>
      </div>

      {/* Rest */}
      <div style={{ marginTop: 18 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#807A6A',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            marginBottom: 8,
          }}
        >
          Weitere Parteien
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {rest.map((p) => (
            <RevealPartyRow
              key={p.id}
              party={p}
              pct={Math.round((align[p.id] || 0) * 100)}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 12 }} />

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <PressButton
          variant="secondary"
          size="md"
          onClick={onBack}
          style={{ flex: 1 }}
        >
          Ändern
        </PressButton>
        <PressButton
          variant="primary"
          size="md"
          onClick={handleDone}
          style={{ flex: 1.4 }}
        >
          Fertig
        </PressButton>
      </div>
    </div>
  );
}

function RevealPartyRow({
  party,
  pct,
}: {
  party: { id: string; short: string; color: string };
  pct: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: '#FFFFFF',
        borderRadius: 10,
        boxShadow: 'inset 0 0 0 1px #E8E2D2',
      }}
    >
      <div
        style={{
          width: 32,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 13,
          fontWeight: 800,
          color: '#1F1D17',
          flexShrink: 0,
        }}
      >
        {pct}%
      </div>
      <div
        style={{
          flex: 1,
          height: 12,
          background: '#F4ECD6',
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: party.color,
            boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.18)',
          }}
        />
      </div>
      <div
        style={{
          width: 72,
          textAlign: 'right',
          fontSize: 12,
          fontWeight: 800,
          color: '#1F1D17',
          flexShrink: 0,
        }}
      >
        {party.short}
      </div>
    </div>
  );
}

// ─── SwipeStack ──────────────────────────────────────────────────
function SwipeStack({
  value,
  onStance,
}: {
  value: Answers;
  onStance: (itemId: string, stance: Stance) => void;
}) {
  const fullDeck = React.useMemo(buildDeck, []);
  const [queue, setQueue] = React.useState<DeckCard[]>(fullDeck);
  const [idx, setIdx] = React.useState(0);
  const [drag, setDrag] = React.useState<{
    x: number;
    y: number;
    active: boolean;
  }>({ x: 0, y: 0, active: false });
  const [exiting, setExiting] = React.useState<{
    dx: number;
    dy: number;
    rot: number;
    stance: SwipeStance;
  } | null>(null);
  const [introCat, setIntroCat] = React.useState<string | null>(null);
  const [lastIntroFor, setLastIntroFor] = React.useState<string | null>(null);

  const dragStart = React.useRef<{ x: number; y: number } | null>(null);
  const dragTime = React.useRef(0);

  const current = queue[idx];
  const rawNext = queue[idx + 1];
  const rawNext2 = queue[idx + 2];
  // Don't let cards from the NEXT category peek through behind the
  // current one — the user would read content (e.g. "Atomkraft …")
  // before the category intro for that field has even played.
  const next =
    rawNext && current && rawNext.catId === current.catId ? rawNext : null;
  const next2 =
    rawNext2 && current && rawNext2.catId === current.catId
      ? rawNext2
      : null;

  const isDone = idx >= queue.length;

  // ── Category intro: trigger when current's catId changes ──
  // useLayoutEffect (not useEffect) so we set introCat BEFORE the browser
  // paints the freshly-promoted top card — otherwise the user sees a
  // single frame of the new category's first card flashing through.
  React.useLayoutEffect(() => {
    if (!current) return;
    if (current.catId === lastIntroFor) return;
    setIntroCat(current.catId);
    const t = setTimeout(() => {
      setIntroCat(null);
      setLastIntroFor(current.catId);
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.catId]);

  // ── Commit a stance with exit animation ──
  const commit = (stance: SwipeStance) => {
    if (!current || exiting || introCat) return;
    const isJa = stance === 'ja';
    const isNein = stance === 'nein';
    const isSkip = stance === 'skip';
    const isNeutral = stance === 'neutral';

    const dx = isJa ? 520 : isNein ? -520 : 0;
    const dy = isSkip ? -580 : isNeutral ? 320 : 0;
    const rot = isJa ? 18 : isNein ? -18 : 0;
    setExiting({ dx, dy, rot, stance });

    setTimeout(() => {
      if (!isSkip) onStance(current.id, stance as Stance);

      if (isSkip) {
        // push current to end of queue, keep idx
        setQueue((q) => {
          const nextQueue = q.slice();
          const [it] = nextQueue.splice(idx, 1);
          nextQueue.push(it);
          return nextQueue;
        });
      } else {
        setIdx((i) => i + 1);
      }
      setExiting(null);
      setDrag({ x: 0, y: 0, active: false });
      dragStart.current = null;
    }, 460);
  };

  // ── Pointer handling on the top card ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting || introCat) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragTime.current = Date.now();
    setDrag({ x: 0, y: 0, active: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setDrag({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
      active: true,
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dt = Math.max(1, Date.now() - dragTime.current);
    const vx = dx / dt;
    dragStart.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // up swipe = skip
    if (dy < -SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      commit('skip');
      return;
    }
    // right = ja, left = nein
    if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
      commit('ja');
      return;
    }
    if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
      commit('nein');
      return;
    }
    // otherwise spring back
    setDrag({ x: 0, y: 0, active: false });
  };

  // ── Card transforms ──
  const tilt = Math.max(-22, Math.min(22, drag.x / 14));

  // helpful "intent" overlay
  const intent: SwipeStance | null =
    drag.y < -60 && Math.abs(drag.y) > Math.abs(drag.x)
      ? 'skip'
      : drag.x > 60
      ? 'ja'
      : drag.x < -60
      ? 'nein'
      : null;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card stage */}
      <div
        style={{
          position: 'relative',
          height: 360,
          marginTop: 4,
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Cards from back to front — keys are CRITICAL so the
            depth-1 card animates upward into depth-0 instead of the
            old top-slot DOM element snapping in from its exit pose. */}
        {next2 && <Card key={next2.id} data={next2} depth={2} value={value} />}
        {next && <Card key={next.id} data={next} depth={1} value={value} />}
        {current && !isDone && !introCat && (
          <Card
            key={current.id}
            data={current}
            depth={0}
            value={value}
            drag={drag}
            tilt={tilt}
            intent={intent}
            exiting={exiting}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        )}

        {/* Category intro overlay */}
        {introCat && <CategoryIntro catId={introCat} />}

        {/* All done */}
        {isDone && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#807A6A',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Alle Fragen beantwortet — tipp unten auf „Profil enthüllen".
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActionBtn
          label="Dagegen"
          tone="nein"
          hint={intent === 'nein'}
          onClick={() => commit('nein')}
        />
        <ActionBtn
          label="Neutral"
          tone="neutral"
          onClick={() => commit('neutral')}
        />
        <ActionBtn
          label="Dafür"
          tone="ja"
          hint={intent === 'ja'}
          onClick={() => commit('ja')}
        />
      </div>

      <button
        onClick={() => commit('skip')}
        style={{
          marginTop: 10,
          alignSelf: 'center',
          background: 'transparent',
          border: 0,
          color: intent === 'skip' ? '#1F1D17' : '#807A6A',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        ↑ Später entscheiden
      </button>
    </div>
  );
}

// ─── Single card ─────────────────────────────────────────────────
function Card({
  data,
  depth,
  value,
  drag,
  tilt,
  intent,
  exiting,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  data: DeckCard;
  depth: number;
  value: Answers;
  drag?: { x: number; y: number; active: boolean };
  tilt?: number;
  intent?: SwipeStance | null;
  exiting?: { dx: number; dy: number; rot: number; stance: SwipeStance } | null;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}) {
  const isTop = depth === 0;
  const stance = value[data.id];

  // Background card transforms (the ones behind) — peek pokes out
  // below the front card; the back cards themselves are fully opaque
  // so you never read through them.
  const backY = depth * 18;
  const backSc = 1 - depth * 0.06;
  const backOp = 1;

  let transform = `translate(-50%, ${backY}px) scale(${backSc})`;
  // Slower, calmer easing for the re-stack glide.
  let transition =
    'transform .5s cubic-bezier(.22,.7,.25,1), opacity .4s cubic-bezier(.22,.7,.25,1)';

  if (isTop && exiting) {
    transform = `translate(calc(-50% + ${exiting.dx}px), ${exiting.dy}px) rotate(${exiting.rot}deg)`;
    transition =
      'transform .45s cubic-bezier(.4,.05,.5,1), opacity .45s cubic-bezier(.4,.05,.5,1)';
  } else if (isTop && drag && drag.active) {
    transform = `translate(calc(-50% + ${drag.x}px), ${drag.y}px) rotate(${tilt}deg)`;
    transition = 'none';
  } else if (isTop) {
    transform = `translate(-50%, 0px) scale(1)`;
  }

  return (
    <div
      onPointerDown={isTop ? onPointerDown : undefined}
      onPointerMove={isTop ? onPointerMove : undefined}
      onPointerUp={isTop ? onPointerUp : undefined}
      onPointerCancel={isTop ? onPointerCancel : undefined}
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 'min(330px, 100%)',
        height: 320,
        transform,
        transition,
        opacity: isTop && exiting ? 0 : backOp,
        zIndex: 30 - depth,
        cursor: isTop ? 'grab' : 'default',
        background: '#FFFFFF',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: isTop
          ? '0 24px 50px -18px rgba(20,19,15,.4), 0 0 0 1.5px rgba(20,19,15,.08)'
          : '0 14px 30px -16px rgba(20,19,15,.2), 0 0 0 1px rgba(20,19,15,.06)',
        borderLeft: `8px solid ${data.catColor}`,
        padding: '18px 18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* category tag */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: data.catColor,
          color: '#FFFFFF',
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
        }}
      >
        {data.catLabel}
      </div>

      {/* statement */}
      <div
        className="pq-display-tight"
        style={{
          marginTop: 16,
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#1F1D17',
          letterSpacing: '-.015em',
          textWrap: 'pretty',
        }}
      >
        {data.text}
      </div>

      <div style={{ flex: 1 }} />

      {/* footer hint */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          fontWeight: 800,
          color: '#807A6A',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        <span>← Dagegen</span>
        <span style={{ color: '#1F1D17' }}>↑ Später</span>
        <span>Dafür →</span>
      </div>

      {/* Intent stamps */}
      {isTop && intent === 'ja' && (
        <Stamp text="Dafür" color="#2E9F5D" rot={-12} side="left" />
      )}
      {isTop && intent === 'nein' && (
        <Stamp text="Dagegen" color="#D81E26" rot={12} side="right" />
      )}
      {isTop && intent === 'skip' && (
        <Stamp text="Später" color="#1F1D17" rot={-6} side="top" />
      )}

      {/* Previously answered marker */}
      {isTop && stance && !exiting && !intent && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '3px 8px',
            background:
              stance === 'ja'
                ? '#2E9F5D'
                : stance === 'nein'
                ? '#D81E26'
                : '#C9BFA3',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            borderRadius: 999,
          }}
        >
          {stance === 'ja'
            ? 'Dafür'
            : stance === 'nein'
            ? 'Dagegen'
            : 'Neutral'}
        </div>
      )}
    </div>
  );
}

// ─── Stance stamp ────────────────────────────────────────────────
function Stamp({
  text,
  color,
  rot,
  side,
}: {
  text: string;
  color: string;
  rot: number;
  side: 'left' | 'right' | 'top';
}) {
  const pos: CSSProperties =
    side === 'left'
      ? { top: 30, left: 22 }
      : side === 'right'
      ? { top: 30, right: 22 }
      : {
          top: 18,
          left: '50%',
          transform: `translateX(-50%) rotate(${rot}deg)`,
        };
  const finalTransform =
    side === 'top'
      ? `translateX(-50%) rotate(${rot}deg)`
      : `rotate(${rot}deg)`;
  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        transform: finalTransform,
        padding: '8px 14px',
        background: 'transparent',
        color: color,
        fontFamily: '"Bricolage Grotesque", system-ui',
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        border: `3px solid ${color}`,
        borderRadius: 8,
        opacity: 0.9,
        pointerEvents: 'none',
        animation: 'pq-rise .15s ease-out',
      }}
    >
      {text}
    </div>
  );
}

// ─── Big category-intro overlay ──────────────────────────────────
// Sits in the card slot and animates in/out like a real card so the
// next category's first question never flashes through underneath.
function CategoryIntro({ catId }: { catId: string }) {
  const cat = POSITIONS_CATALOGUE.find((c) => c.id === catId);
  if (!cat) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 'min(330px, 100%)',
        minHeight: 320,
        borderRadius: 22,
        overflow: 'hidden',
        background: cat.color,
        color: '#FFFFFF',
        borderLeft: `8px solid rgba(0,0,0,.18)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        boxShadow:
          '0 26px 54px -18px rgba(20,19,15,.45), 0 0 0 1.5px rgba(20,19,15,.08)',
        animation:
          'pq-cat-intro-card 1.8s cubic-bezier(.2,.85,.3,1.05) forwards',
        transformOrigin: '50% 60%',
      }}
    >
      <div style={{ textAlign: 'center', padding: '0 28px' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          Neues Feld
        </div>
        <div
          className="pq-display-tight"
          style={{
            marginTop: 8,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-.04em',
            animation: 'pq-cat-title 1s cubic-bezier(.2,.9,.3,1.1)',
          }}
        >
          {cat.label}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            fontWeight: 600,
            opacity: 0.9,
            maxWidth: 220,
            margin: '12px auto 0',
          }}
        >
          {categoryBlurb(cat.id)}
        </div>
      </div>
    </div>
  );
}

// ─── Action buttons (bottom row) ─────────────────────────────────
function ActionBtn({
  label,
  tone,
  hint,
  onClick,
}: {
  label: string;
  tone: 'ja' | 'nein' | 'neutral';
  hint?: boolean;
  onClick: () => void;
}) {
  const palette = {
    ja: { bg: '#2E9F5D', fg: '#FFFFFF', sh: '#166B3A', glyph: '✓' },
    nein: { bg: '#D81E26', fg: '#FFFFFF', sh: '#9B1219', glyph: '✕' },
    neutral: { bg: '#F4ECD6', fg: '#1F1D17', sh: '#C9BFA3', glyph: '~' },
  }[tone];
  const big = tone !== 'neutral';
  return (
    <button
      onClick={onClick}
      className="pq-press"
      style={{
        width: big ? 64 : 52,
        height: big ? 64 : 52,
        borderRadius: 999,
        border: 0,
        cursor: 'pointer',
        background: palette.bg,
        color: palette.fg,
        fontFamily: '"Bricolage Grotesque", system-ui',
        fontSize: big ? 26 : 20,
        fontWeight: 800,
        display: 'grid',
        placeItems: 'center',
        boxShadow: hint
          ? `inset 0 -4px 0 ${palette.sh}, 0 0 0 4px rgba(31,29,23,.12)`
          : `inset 0 -4px 0 ${palette.sh}`,
        transition: 'box-shadow .15s, transform .15s',
        transform: hint ? 'scale(1.08)' : 'scale(1)',
        position: 'relative',
      }}
    >
      <span aria-hidden>{palette.glyph}</span>
      <span
        style={{
          position: 'absolute',
          bottom: -18,
          fontFamily: 'inherit',
          fontSize: 10,
          fontWeight: 800,
          color: '#1F1D17',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </button>
  );
}
