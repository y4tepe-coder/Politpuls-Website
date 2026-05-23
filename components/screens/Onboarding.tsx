'use client';

// Onboarding — multi-step flow:
//   0  Welcome (Ferdi)
//   1  Charakter wählen (Preset)
//   2  Name
//   3  Kernthemen
//   4  Partei wählen
//   5  Wahlkampf-Intro → start game
//
// Coalition is determined AFTER the election (Tag 6+), not before — you
// have to win first. Output via onDone({ role, name, character, party }).

import React from 'react';
import type { Character } from '@/lib/types';
import { PoliAvatar } from '@/components/PoliAvatar';
import { Bundesadler } from '@/components/Mascot';
import { PressButton, Icons, ProgressBar, FlagStripe } from '@/components/ui';
import {
  CHARACTER_PRESETS,
  defaultCharacter,
  KERNTHEMEN_CATALOGUE,
  partiesForOnboarding,
} from '@/lib/onboardingData';

type OnboardingParty = ReturnType<typeof partiesForOnboarding>[number];

export default function Onboarding({
  onDone,
}: {
  onDone: (data: {
    role: string;
    name: string;
    character: Character;
    party: string | null;
    kernthemen: string[];
  }) => void;
}) {
  const [step, setStep] = React.useState(0);
  const role = 'kandidat';
  const [name, setName] = React.useState('');
  const [character, _setCharacter] = React.useState<Character>(defaultCharacter());
  const [kernthemen, setKernthemen] = React.useState<string[]>([]); // up to 3 theme ids
  const [party, setParty] = React.useState<OnboardingParty | null>(null);
  const setCharacter = (next: Character) => _setCharacter(next);

  const TOTAL = 6;
  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () =>
    onDone({
      role,
      name: name.trim() || 'Kandidat:in',
      character,
      party: party?.id || null,
      kernthemen,
    });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: '#FBF6E9',
        color: '#1F1D17',
      }}
    >
      <OnboardingHeader step={step} total={TOTAL} onBack={step > 0 ? back : null} />
      <div style={{ flex: 1, padding: '4px 16px 0', display: 'flex', flexDirection: 'column' }}>
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && <CharacterStep value={character} onChange={setCharacter} onNext={next} />}
        {step === 2 && (
          <NameStep name={name} setName={setName} character={character} onNext={next} />
        )}
        {step === 3 && <KernthemenStep value={kernthemen} onChange={setKernthemen} onNext={next} />}
        {step === 4 && <PartyStep value={party} onChange={setParty} onNext={next} />}
        {step === 5 && (
          <WahlkampfIntroStep
            party={party}
            character={character}
            kernthemen={kernthemen}
            onStart={finish}
          />
        )}
      </div>
    </div>
  );
}

function OnboardingHeader({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack: (() => void) | null;
}) {
  return (
    <div style={{ padding: '14px 16px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: '#fff',
            border: '1.5px solid #E8E2D2',
            padding: 0,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          {Icons.chevron('left', '#1F1D17')}
        </button>
      ) : (
        <div style={{ width: 36, height: 36 }} />
      )}
      <div style={{ flex: 1 }}>
        <ProgressBar value={step + 1} max={total} color="var(--pq-gold)" height={10} />
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: '#807A6A',
          minWidth: 36,
          textAlign: 'right',
          fontWeight: 700,
        }}
      >
        {step + 1}/{total}
      </div>
    </div>
  );
}

// ─── Step 0: Welcome ─────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        paddingTop: 12,
      }}
    >
      <div>
        <FlagStripe height={4} style={{ width: 80, borderRadius: 999, margin: '0 auto 18px' }} />
        <div style={{ animation: 'pq-rise .5s ease-out backwards' }}>
          <Bundesadler variant="bold" size={160} mood="happy" />
        </div>
        <div
          className="pq-display-tight"
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginTop: 14,
            lineHeight: 1,
            letterSpacing: '-.02em',
          }}
        >
          Hallo, ich bin <span style={{ color: '#D81E26' }}>Ferdi</span>.
        </div>
        <div
          style={{
            fontSize: 15,
            color: '#4A463C',
            marginTop: 12,
            lineHeight: 1.4,
            maxWidth: 290,
            margin: '12px auto 0',
          }}
        >
          5 Minuten am Tag.
          <br />
          Politik wird verständlich, weil du sie spielst.
        </div>
      </div>

      <StickyCTA>
        <PressButton variant="primary" size="lg" full onClick={onNext}>
          Los geht&apos;s
        </PressButton>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#807A6A' }}>
          Werbefrei · keine echten Politiker:innen verletzt
        </div>
      </StickyCTA>
    </div>
  );
}

// ─── Step 1: Charakter wählen (4 Presets) ─────────────────────────
// Vier vorgefertigte Persönlichkeits-Archetypen. Tap zur Auswahl. Die Namen
// sind frei erfunden — keine echten Politiker:innen.
function CharacterStep({
  value,
  onChange,
  onNext,
}: {
  value: Character;
  onChange: (next: Character) => void;
  onNext: () => void;
}) {
  const selectedId = value?.presetId || 'p1';
  const pickPreset = (preset: (typeof CHARACTER_PRESETS)[number]) =>
    onChange({
      ...preset.char,
      presetId: preset.id,
      kind: 'avatar',
    });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Schritt 2 von 7"
        title="Wähle deinen Charakter"
        sub="Vier Stil-Avatare. Du kannst Details später noch anpassen."
      />

      {/* Big preview of the selected character */}
      <div
        style={{
          marginTop: 14,
          alignSelf: 'center',
          background: '#FFFFFF',
          boxShadow: '0 0 0 1.5px #E8E2D2, 0 12px 30px -16px rgba(0,0,0,.2)',
          borderRadius: 22,
          padding: 14,
          width: 168,
          height: 168,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
      >
        <PoliAvatar character={value} size={140} />
      </div>

      {/* Section label: Stil-Avatare */}
      <div
        style={{
          marginTop: 22,
          fontSize: 10,
          fontWeight: 800,
          color: '#807A6A',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        Stil-Avatar
      </div>

      {/* 4 SVG presets in a horizontal row */}
      <div
        style={{
          marginTop: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        {CHARACTER_PRESETS.map((p) => {
          const on = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => pickPreset(p)}
              style={{
                padding: 4,
                border: 0,
                cursor: 'pointer',
                background: '#FFFFFF',
                borderRadius: 14,
                textAlign: 'center',
                boxShadow: on
                  ? '0 0 0 2.5px #000, inset 0 -3px 0 #E8E2D2'
                  : '0 0 0 1.5px #E8E2D2, inset 0 -3px 0 #E8E2D2',
                fontFamily: 'inherit',
              }}
            >
              <div
                style={{
                  background: '#F4ECD6',
                  borderRadius: 10,
                  width: '100%',
                  aspectRatio: '1',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <PoliAvatar character={p.char as Character} size={62} />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
      <PressButton variant="primary" size="lg" full onClick={onNext} style={{ marginTop: 16 }}>
        Weiter
      </PressButton>
    </div>
  );
}

// ─── Step 2: Name ────────────────────────────────────────────────
function NameStep({
  name,
  setName,
  character,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  character: Character;
  onNext: () => void;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Schritt 3 von 7"
        title="Wie sollen wir dich nennen?"
        sub="Vorname, Spitzname — was sich für dich richtig anfühlt."
      />

      <div
        style={{
          marginTop: 18,
          alignSelf: 'center',
          background: '#FFFFFF',
          boxShadow: '0 0 0 1.5px #E8E2D2',
          borderRadius: 20,
          padding: 12,
          width: 130,
          height: 130,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <PoliAvatar character={character} size={106} />
      </div>

      <div
        style={{
          marginTop: 18,
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '0 16px',
          boxShadow: '0 0 0 1.5px #E8E2D2, inset 0 -4px 0 #E8E2D2',
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Jana"
          maxLength={20}
          style={{
            width: '100%',
            border: 0,
            outline: 0,
            background: 'transparent',
            height: 54,
            fontSize: 18,
            fontFamily: 'inherit',
            color: '#1F1D17',
            fontWeight: 600,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          color: '#807A6A',
        }}
      >
        Kein Konto nötig — alles bleibt auf deinem Gerät.
      </div>

      <div style={{ flex: 1 }} />
      <StickyCTA>
        <PressButton
          variant={name.trim() ? 'primary' : 'ghost'}
          size="lg"
          full
          disabled={!name.trim()}
          onClick={onNext}
        >
          Weiter
        </PressButton>
      </StickyCTA>
    </div>
  );
}

// ─── Step 4: Partei ──────────────────────────────────────────────
// Parteien werden aus der Foundation geladen, damit Namen
// und Farben über alle Schritte konsistent bleiben.
function PartyStep({
  value,
  onChange,
  onNext,
}: {
  value: OnboardingParty | null;
  onChange: (p: OnboardingParty) => void;
  onNext: () => void;
}) {
  const PARTIES = partiesForOnboarding();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Schritt 4 von 6"
        title="Für welche Partei trittst du an?"
        sub="Such dir die Partei aus, hinter der du stehst — oder gründe eine eigene Bewegung."
      />
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {PARTIES.map((p) => {
          const on = value?.id === p.id;
          const bright = p.color === '#FFCC00' || p.color === '#F6C414';
          return (
            <button
              key={p.id}
              onClick={() => onChange(p)}
              style={{
                padding: 0,
                border: 0,
                cursor: 'pointer',
                background: p.color,
                color: bright ? '#1F1D17' : '#FFFFFF',
                borderRadius: 14,
                textAlign: 'left',
                fontFamily: 'inherit',
                position: 'relative',
                boxShadow: on
                  ? '0 0 0 3px #1F1D17, inset 0 -3px 0 rgba(0,0,0,.18)'
                  : 'inset 0 -3px 0 rgba(0,0,0,.18)',
                transition: 'box-shadow .1s',
              }}
            >
              <div style={{ padding: '14px 12px' }}>
                <div
                  className="pq-display-tight"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    opacity: 0.85,
                    marginTop: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  {p.sub}
                </div>
              </div>
              {on && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: bright ? '#1F1D17' : '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {Icons.check(bright ? '#F6C414' : '#1F1D17')}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <StickyCTA>
        <PressButton
          variant={value ? 'primary' : 'ghost'}
          size="lg"
          full
          disabled={!value}
          onClick={onNext}
        >
          Weiter
        </PressButton>
      </StickyCTA>
    </div>
  );
}

// ─── Step 5: Wahlkampf-Intro (role-aware) ─────────────────────────
function WahlkampfIntroStep({
  party,
  character,
  kernthemen,
  onStart,
}: {
  party: OnboardingParty | null;
  character: Character;
  kernthemen: string[];
  onStart: () => void;
}) {
  const catalogue = KERNTHEMEN_CATALOGUE;
  const themenCards = (kernthemen || [])
    .map((id) => catalogue.find((c) => c.id === id))
    .filter(Boolean) as (typeof KERNTHEMEN_CATALOGUE)[number][];

  const plan = [
    {
      num: 1,
      kind: 'briefing',
      title: 'Lagekarte & Antrittsrede',
      sub: 'Lage checken — dann deine erste große Entscheidung.',
    },
    { num: 2, kind: 'meeting', title: 'Wahlplakat', sub: 'Foto, Slogan, Farbe.' },
    { num: 3, kind: 'tv', title: 'TV-Triell', sub: 'Drei Themen, drei Antworten live.' },
    { num: 4, kind: 'decision', title: 'Marktbesuch', sub: 'Bürgerkontakt vor der Wahl.' },
    {
      num: 5,
      kind: 'vote',
      title: 'Wahlsonntag',
      sub: 'Wirst du Kanzler:in, Minister:in oder Opposition?',
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Bereit"
        title="Es geht los: Wahlkampf"
        sub="5 Tage Wahlkampf entscheiden alles. Was du danach wirst, hängt von Performance, Volk und Partei ab."
      />

      <div
        style={{
          marginTop: 14,
          background: '#1F1D17',
          color: '#FBF6E9',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <FlagStripe height={3} animated />
        <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: '#F6C414',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: 'inset 0 -3px 0 #C48A05',
            }}
          >
            <PoliAvatar character={character} size={60} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#F6C414',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              Bundestags-Kandidat:in
            </div>
            <div
              className="pq-display-tight"
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginTop: 2,
                lineHeight: 1.05,
              }}
            >
              {party?.name || '—'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(251,246,233,.7)', marginTop: 4 }}>
              Dein Wahlkampf entscheidet, was du am Sonntag wirst.
            </div>
            {themenCards.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {themenCards.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,.12)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(251,246,233,.85)',
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: c.catColor,
                      }}
                    />
                    {c.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#807A6A',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 8,
          }}
        >
          Deine Wahlkampf-Tage
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.map((d) => (
            <PhaseRow key={d.num} num={d.num} kind={d.kind} title={d.title} sub={d.sub} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <StickyCTA>
        <PressButton variant="primary" size="lg" full onClick={onStart}>
          Wahlkampf starten
        </PressButton>
      </StickyCTA>
    </div>
  );
}

function PhaseRow({
  num,
  title,
  sub,
}: {
  num: number;
  kind: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 0 0 1.5px #E8E2D2',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: '#F6C414',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 800,
          color: '#1F1D17',
          fontSize: 12,
          boxShadow: 'inset 0 -2px 0 #C48A05',
        }}
      >
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1F1D17' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#807A6A', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────
function Headline({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
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

// ─── StickyCTA: sticky bottom CTA with safe-area padding ─────────────
function StickyCTA({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        paddingTop: 12,
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        background: 'linear-gradient(to bottom, transparent, #FBF6E9 28%)',
        zIndex: 5,
      }}
    >
      {children}
    </div>
  );
}

// ─── KernthemenStep ───────────────────────────────────────────────────
function KernthemenStep({
  value,
  onChange,
  onNext,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
}) {
  const MAX = 3;
  const [openInfoId, setOpenInfoId] = React.useState<string | null>(null);

  const toggle = (card: (typeof KERNTHEMEN_CATALOGUE)[number]) => {
    if (value.includes(card.id)) onChange(value.filter((id) => id !== card.id));
    else if (value.length < MAX) onChange([...value, card.id]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Headline
        kicker="Schritt 3 von 6"
        title="Deine 3 Kernthemen"
        sub="Was liegt dir wirklich am Herzen? Wähle 3 Themen — sie prägen deinen Wahlkampf."
      />

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: value.length === MAX ? '#1F1D17' : '#FFFFFF',
            color: value.length === MAX ? '#F6C414' : '#807A6A',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: '"JetBrains Mono", monospace',
            boxShadow:
              value.length === MAX ? 'inset 0 -2px 0 #000' : 'inset 0 0 0 1.5px #E8E2D2',
            transition: 'all .2s',
          }}
        >
          {value.length}/{MAX} gewählt
          {value.length === MAX && (
            <span style={{ marginLeft: 6, fontSize: 9, letterSpacing: '.1em' }}>✓ FERTIG</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {KERNTHEMEN_CATALOGUE.map((card) => {
          const on = value.includes(card.id);
          const disabled = !on && value.length >= MAX;
          const infoOpen = openInfoId === card.id;
          return (
            <div key={card.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  background: on ? '#1F1D17' : '#FFFFFF',
                  borderRadius: infoOpen ? '14px 14px 0 0' : 14,
                  overflow: 'hidden',
                  boxShadow: on
                    ? `inset 0 -3px 0 #000, 0 0 0 2.5px ${card.catColor}`
                    : '0 0 0 1.5px #E8E2D2',
                  opacity: disabled ? 0.35 : 1,
                  transition: 'opacity .15s, box-shadow .12s',
                }}
              >
                <button
                  onClick={() => !disabled && toggle(card)}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 14px',
                    border: 0,
                    background: 'transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: card.catColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: on ? card.catColor : '#807A6A',
                        marginBottom: 2,
                      }}
                    >
                      {card.cat}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: on ? '#FBF6E9' : '#1F1D17',
                      }}
                    >
                      {card.text}
                    </div>
                  </div>
                  {on && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: card.catColor,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11">
                        <path
                          d="M4 12 l 5 5 L 20 6"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>

                {/* ⓘ info toggle */}
                <button
                  onClick={() => setOpenInfoId(infoOpen ? null : card.id)}
                  aria-label={`Info zu: ${card.text}`}
                  style={{
                    width: 42,
                    border: 0,
                    borderLeft: `1px solid ${on ? 'rgba(255,255,255,.1)' : '#F0EADB'}`,
                    background: infoOpen
                      ? on
                        ? 'rgba(255,255,255,.1)'
                        : '#F4ECD6'
                      : 'transparent',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    color: infoOpen
                      ? on
                        ? '#FBF6E9'
                        : '#1F1D17'
                      : on
                        ? 'rgba(251,246,233,.4)'
                        : '#C9BFA3',
                    fontFamily: '"Bricolage Grotesque", serif',
                    fontSize: 15,
                    fontWeight: 800,
                    fontStyle: 'italic',
                    transition: 'background .12s, color .12s',
                  }}
                >
                  i
                </button>
              </div>

              {/* Inline info expansion */}
              {infoOpen && (
                <div
                  style={{
                    padding: '10px 14px 12px',
                    background: on ? '#2A2720' : '#F4ECD6',
                    borderRadius: '0 0 14px 14px',
                    boxShadow: on
                      ? `0 0 0 2.5px ${card.catColor}, inset 0 1px 0 rgba(255,255,255,.06)`
                      : '0 0 0 1.5px #E8E2D2, inset 0 1px 0 #FBF6E9',
                    animation: 'pq-rise .15s ease-out',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      color: on ? 'rgba(251,246,233,.82)' : '#4A463C',
                    }}
                  >
                    {card.info}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <StickyCTA>
        <PressButton
          variant={value.length > 0 ? 'primary' : 'ghost'}
          size="lg"
          full
          disabled={value.length === 0}
          onClick={onNext}
        >
          {value.length === 0
            ? '3 Themen wählen'
            : value.length < MAX
              ? `${value.length} gewählt — noch ${MAX - value.length}`
              : 'Weiter'}
        </PressButton>
      </StickyCTA>
    </div>
  );
}
