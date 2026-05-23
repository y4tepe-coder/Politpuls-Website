'use client';

// Spectrum screen — "Welche Partei passt zu dir?"
// Parteien-Match-Liste as the user requested. Also includes:
//   - a top hero with the best match
//   - per-topic breakdown so it doesn't feel like one number
// Real-data-aware: if the user has completed the Werte-Check, the matches
// are computed from profile.alignment; otherwise it shows the mock list.

import React from 'react';
import { PARTY_COLORS } from '@/lib/tokens';
import { loadSession } from '@/lib/storage';
import { PQ_PARTIES_LIVE } from '@/lib/onboardingData';
import {
  PressButton,
  SectionLabel,
  ProgressBar,
  FlagStripe,
} from '@/components/ui';

interface SpectrumMatch {
  party: string;
  pct: number;
  color: string;
  delta: number;
  tagline: string;
}

// Short per-party taglines for the live (Werte-Check) view.
const PARTY_TAGLINES: Record<string, string> = {
  cdu: 'Mitte-rechts, Wirtschaft, innere Sicherheit.',
  spd: 'Soziale Marktwirtschaft, Klimaschutz mit Augenmaß.',
  gruene: 'Ökologie, Bürgerrechte, EU.',
  fdp: 'Marktliberal, Bürgerrechte.',
  linke: 'Soziale Gerechtigkeit, Friedenspolitik.',
  afd: 'Rechtspopulistisch, EU-skeptisch.',
  bsw: 'Soziale Themen, Migrationskritik.',
};

export default function Spectrum({
  onOpenValuesCheck,
}: {
  onOpenValuesCheck?: () => void;
}) {
  const profile = loadSession().profile || {};
  const alignment = profile.alignment;
  const hasAlignment = !!alignment && Object.keys(alignment).length > 0;

  // computed match per Bundestag party
  const mockMatches: SpectrumMatch[] = [
    { party: 'SPD',   pct: 62, color: PARTY_COLORS.SPD,   delta: +4,
      tagline: 'Soziale Marktwirtschaft, Klimaschutz mit Augenmaß.' },
    { party: 'Grüne', pct: 54, color: PARTY_COLORS['Grüne'], delta: +2,
      tagline: 'Ökologie, Bürgerrechte, EU.' },
    { party: 'CDU',   pct: 41, color: PARTY_COLORS.CDU,   delta: -3,
      tagline: 'Mitte-rechts, Wirtschaft, innere Sicherheit.' },
    { party: 'Linke', pct: 38, color: PARTY_COLORS.Linke, delta: +1,
      tagline: 'Soziale Gerechtigkeit, Friedenspolitik.' },
    { party: 'FDP',   pct: 28, color: PARTY_COLORS.FDP,   delta: -2,
      tagline: 'Marktliberal, Bürgerrechte.' },
    { party: 'BSW',   pct: 22, color: PARTY_COLORS.BSW,   delta: +0,
      tagline: 'Soziale Themen, Migrationskritik.' },
    { party: 'AfD',   pct: 9,  color: PARTY_COLORS.AfD,   delta: -1,
      tagline: 'Rechtspopulistisch, EU-skeptisch.' },
  ];

  const matches: SpectrumMatch[] = hasAlignment
    ? [...PQ_PARTIES_LIVE]
        .map((p) => ({
          party: p.short,
          pct: Math.round((alignment![p.id] || 0) * 100),
          color: p.color,
          delta: 0,
          tagline: PARTY_TAGLINES[p.id] || '',
        }))
        .sort((a, b) => b.pct - a.pct)
    : mockMatches;

  const topics = [
    { id: 'social', label: 'Sozialstaat',     value: 72, you: 'Mitte-links' },
    { id: 'climate', label: 'Klima & Energie', value: 65, you: 'progressiv' },
    { id: 'security', label: 'Sicherheit',    value: 48, you: 'pragmatisch' },
    { id: 'economy', label: 'Wirtschaft',     value: 40, you: 'sozial' },
    { id: 'eu', label: 'Europapolitik',       value: 78, you: 'pro-EU' },
    { id: 'migration', label: 'Migration',    value: 52, you: 'liberal' },
  ];

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '14px 16px 0' }}>
        <FlagStripe height={3} style={{ borderRadius: 999, marginBottom: 12, opacity: .9 }}/>
        <div style={{
          fontSize: 11, fontWeight: 800, color: 'var(--pq-ink-mute)',
          textTransform: 'uppercase', letterSpacing: '.08em',
        }}>Dein Politik-Spektrum</div>
        <div className="pq-display-tight" style={{
          fontSize: 30, fontWeight: 800, color: 'var(--pq-ink)', marginTop: 2,
        }}>Welche Partei passt zu dir?</div>
        <div style={{ fontSize: 13, color: 'var(--pq-ink-soft)', marginTop: 6 }}>
          {hasAlignment
            ? <>Berechnet aus <b>deinem Werte-Check.</b></>
            : <>Mach den <b>Werte-Check</b>, damit dein Spektrum echt wird.</>}
        </div>
      </div>

      {/* CTA — Werte-Check */}
      <div style={{ padding: '14px 16px 0' }}>
        {hasAlignment ? (
          <PressButton
            variant="secondary"
            size="md"
            full
            onClick={onOpenValuesCheck}
          >
            Werte-Check wiederholen
          </PressButton>
        ) : (
          <PressButton
            variant="gold"
            size="lg"
            full
            onClick={onOpenValuesCheck}
          >
            Werte-Check starten
          </PressButton>
        )}
      </div>

      {/* Hero best-match card */}
      <div style={{ padding: '16px 16px 0' }}>
        <BestMatchHero best={matches[0]} />
      </div>

      {/* Match list */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--pq-ink-mute)' }}>Δ seit letzter Woche</span>}>
          Alle Parteien
        </SectionLabel>
        <div style={{
          background: '#fff', border: '1.5px solid var(--pq-line)', borderRadius: 18,
          overflow: 'hidden',
        }}>
          {matches.map((m, i) => (
            <MatchRow key={m.party} match={m} isLast={i === matches.length - 1} rank={i + 1}/>
          ))}
        </div>
      </div>

      {/* Topics breakdown */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel>Nach Themenfeldern</SectionLabel>
        <div style={{
          background: '#fff', border: '1.5px solid var(--pq-line)', borderRadius: 18,
          padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {topics.map((t) => <TopicRow key={t.id} t={t} />)}
        </div>
      </div>

      {/* Compass mini-card */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel>Politische Verortung</SectionLabel>
        <CompassCard />
      </div>

      {/* Disclaimer */}
      <div style={{
        margin: '20px 16px 0', padding: 12,
        background: 'var(--pq-blue-soft)',
        borderRadius: 14, fontSize: 12, color: '#0F3D78', lineHeight: 1.35,
      }}>
        ℹ️ Spielerisches Ergebnis — kein Wahl-O-Mat. Erst nach 30 Tagen aussagekräftig.
      </div>
    </div>
  );
}

function BestMatchHero({ best }: { best: SpectrumMatch }) {
  return (
    <div style={{
      background: '#1F1D17', borderRadius: 22, overflow: 'hidden', color: '#FBF6E9',
      position: 'relative',
    }}>
      <FlagStripe height={4} style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: .9 }}/>
      <div style={{ padding: '18px 16px 16px' }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: '#F6C414',
          textTransform: 'uppercase', letterSpacing: '.1em',
        }}>Größte Übereinstimmung</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginTop: 8,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: best.color,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            border: best.color === '#FFED00' ? '1px solid #C48A05' : '0',
          }}>
            <div className="pq-display-tight" style={{
              fontSize: 24, fontWeight: 800, color: best.color === '#FFED00' ? '#1F1D17' : '#fff',
            }}>{best.party}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="pq-display-tight" style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>
              {best.pct}<span style={{ fontSize: 22, opacity: .7 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(251,246,233,.7)', marginTop: 2 }}>
              {best.tagline}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <PressButton variant="primary" style={{ flex: 1 }} size="md">Vergleichen</PressButton>
          <PressButton variant="secondary" style={{ flex: 1 }} size="md">Programm lesen</PressButton>
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  match,
  isLast,
  rank,
}: {
  match: SpectrumMatch;
  isLast: boolean;
  rank: number;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: isLast ? 0 : '1px solid var(--pq-line-soft)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: match.color,
        display: 'grid', placeItems: 'center', flexShrink: 0,
        border: match.color === '#FFED00' ? '1px solid #C48A05' : '0',
      }}>
        <div className="pq-display-tight" style={{
          fontSize: 14, fontWeight: 800, color: match.color === '#FFED00' ? '#1F1D17' : '#fff',
        }}>{match.party}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--pq-ink)' }}>{match.party}</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 14,
            color: 'var(--pq-ink)', fontWeight: 700,
          }}>{match.pct}%</div>
        </div>
        <div style={{ marginTop: 4 }}>
          <ProgressBar value={match.pct} color={match.color} height={8} />
        </div>
      </div>
      <div style={{
        flexShrink: 0,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
        color: match.delta > 0 ? 'var(--pq-green-deep)' : match.delta < 0 ? 'var(--pq-red-deep)' : 'var(--pq-ink-mute)',
        minWidth: 32, textAlign: 'right', fontWeight: 700,
      }}>
        {match.delta > 0 ? '+' : ''}{match.delta}
      </div>
    </div>
  );
}

function TopicRow({
  t,
}: {
  t: { id: string; label: string; value: number; you: string };
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--pq-ink)' }}>{t.label}</div>
        <div style={{
          fontSize: 11, color: 'var(--pq-ink-mute)',
        }}>du: <b style={{ color: 'var(--pq-ink)' }}>{t.you}</b></div>
      </div>
      <div style={{ marginTop: 6, position: 'relative' }}>
        <div style={{
          height: 10, borderRadius: 999, background: '#EFE7D2', position: 'relative',
        }}>
          {/* center marker */}
          <div style={{
            position: 'absolute', top: -2, bottom: -2, left: '50%', width: 1.5,
            background: 'var(--pq-ink-mute)', opacity: .35,
          }}/>
          {/* dot at value */}
          <div style={{
            position: 'absolute', top: '50%', left: `${t.value}%`,
            transform: 'translate(-50%,-50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#1F1D17', boxShadow: 'inset 0 -2px 0 #000',
            border: '2px solid var(--pq-gold)',
          }}/>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 4,
          fontSize: 10, color: 'var(--pq-ink-mute)', textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          <span>links</span><span>Mitte</span><span>rechts</span>
        </div>
      </div>
    </div>
  );
}

function CompassCard() {
  // 2-axis political compass mini-plot; reads as decoration but is meaningful.
  // Axes: x = wirtschaftlich (links/rechts), y = gesellschaftlich (libertär/autoritär)
  // User dot at (-15, -22) relative to center (so left-libertarian).
  return (
    <div style={{
      background: '#fff', border: '1.5px solid var(--pq-line)', borderRadius: 18,
      padding: 14,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 130, height: 130, flexShrink: 0 }}>
          <Compass />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: 'var(--pq-ink-mute)',
            textTransform: 'uppercase', letterSpacing: '.08em',
          }}>Du bist</div>
          <div className="pq-display-tight" style={{
            fontSize: 22, fontWeight: 800, color: 'var(--pq-ink)', marginTop: 2,
            lineHeight: 1.1,
          }}>Mitte-links,<br/>libertär</div>
          <div style={{ fontSize: 12, color: 'var(--pq-ink-soft)', marginTop: 6, lineHeight: 1.35 }}>
            Du wertest soziale Sicherung höher als steuerliche Entlastung — und Bürger­rechte über Härte des Staates.
          </div>
        </div>
      </div>
    </div>
  );
}

function Compass() {
  const userX = 40, userY = 38; // in 0-100, slightly left + slightly top
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {/* quadrant tint */}
      <rect x="0" y="0" width="50" height="50" fill="#D8F0DE"/>
      <rect x="50" y="0" width="50" height="50" fill="#FFE9A0"/>
      <rect x="0" y="50" width="50" height="50" fill="#DCEAF7"/>
      <rect x="50" y="50" width="50" height="50" fill="#FCE0DF"/>
      {/* axes */}
      <line x1="50" y1="2" x2="50" y2="98" stroke="#807A6A" strokeWidth=".7"/>
      <line x1="2" y1="50" x2="98" y2="50" stroke="#807A6A" strokeWidth=".7"/>
      {/* axis arrows */}
      <text x="50" y="6" textAnchor="middle" fontSize="6" fill="#1F1D17" fontWeight="700">libertär</text>
      <text x="50" y="98" textAnchor="middle" fontSize="6" fill="#1F1D17" fontWeight="700">autoritär</text>
      <text x="2" y="52" fontSize="6" fill="#1F1D17" fontWeight="700">links</text>
      <text x="98" y="52" textAnchor="end" fontSize="6" fill="#1F1D17" fontWeight="700">rechts</text>
      {/* user dot */}
      <circle cx={userX} cy={userY} r="6" fill="#1F1D17"/>
      <circle cx={userX} cy={userY} r="3" fill="#F6C414"/>
    </svg>
  );
}
