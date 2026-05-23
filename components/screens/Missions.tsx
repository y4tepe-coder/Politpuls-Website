'use client';

// Wahlkampf-Missionen — fünf eigenständige Mini-Spiele.
// Jede Mission ist eine andere Mechanik, damit sich der Wahlkampf nicht
// jeden Tag gleich anfühlt.

import React from 'react';
import type { Skin, ElectionResult } from '@/lib/types';
import { skinTokens } from '@/lib/tokens';
import type { SkinTokens } from '@/lib/tokens';
import { loadSession, saveSession } from '@/lib/storage';
import {
  recordMission,
  loadCampaign,
  totalScore,
  popularAlignment,
  POPULAR_THEMES,
  computeElectionResult,
  determineRole,
  regierungsParteien,
} from '@/lib/campaign';
import {
  REDE_THEMES,
  TV_QUESTIONS,
  PRESSE_QUESTIONS,
  ENCOUNTERS,
  ENCOUNTER_WEIGHTS,
  LAGE_POLLS,
  REDE_EROEFFNUNG,
  HAUSHALT_KATEGORIEN,
  HAUSHALT_FESTBLOCK,
  STEUEREINNAHMEN,
  KAT_STEP,
  KAT_DELTA_MAX,
  SCHULDEN_OPTIONEN,
  PROGRAMM_THEMEN,
  WAHLVERSPRECHEN_BY_ID,
  VERSPRECHEN_BUDGET_HINT,
  PLATTFORMEN,
  SOCIAL_TONALITAET,
  WAHL_PARTY_META,
  toneDescriptor,
  speechLineFor,
  speechOpener,
  reactionFor,
  avgSegments,
  fallbackAnalysis,
} from '@/lib/missionsData';
import type { RedeTheme, Segments } from '@/lib/missionsData';
import { KERNTHEMEN_CATALOGUE } from '@/lib/onboardingData';
import { PressButton, ProgressBar } from '@/components/ui';
import Plakat, { loadPlakat } from '@/components/screens/Plakat';

// Computed locally — Summe der IST-Beträge + Festblock (≈ 490 Mrd).
const HAUSHALT_IST_TOTAL =
  HAUSHALT_KATEGORIEN.reduce((s, k) => s + k.ist, 0) + HAUSHALT_FESTBLOCK.betrag;

// Shared mission-component prop contract.
interface MissionProps {
  skin?: Skin;
  day: number;
  role: string;
  onClose: () => void;
  onDone: (xp?: number) => void;
}

// ─── Shared chrome: header w/ progress + close ─────────────────────
function MissionShell({
  skin,
  step,
  total,
  onClose,
  children,
}: {
  skin: SkinTokens;
  day?: number;
  role?: string;
  step: number;
  total: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: skin.bg, color: skin.text, position: 'relative',
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 12, background: skin.surface,
          border: skin.surfaceBorder, cursor: 'pointer', padding: 0,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }} aria-label="Schließen">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6 L 18 18 M 18 6 L 6 18" stroke={skin.text} strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <ProgressBar value={step} max={total} color="#D81E26" height={10}/>
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 800,
          color: '#D81E26', minWidth: 70, textAlign: 'right',
        }}>WAHLKAMPF · {step}/{total}</div>
      </div>
      <div style={{ flex: 1, padding: '4px 16px 32px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function MissionHeadline({
  kicker,
  title,
  sub,
  skin,
}: {
  kicker: string;
  title: string;
  sub?: string;
  skin: SkinTokens;
}) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: '#D81E26',
        textTransform: 'uppercase', letterSpacing: '.1em',
      }}>{kicker}</div>
      <div className="pq-display-tight" style={{
        fontSize: 26, fontWeight: 800, marginTop: 4, lineHeight: 1.05, letterSpacing: '-.02em',
      }}>{title}</div>
      {sub && (
        <div style={{ fontSize: 13, color: skin.textMuted, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>
      )}
    </div>
  );
}

function WahlDot({ delay }: { delay: number }) {
  return <span style={{
    width: 8, height: 8, borderRadius: '50%', background: '#807A6A',
    animation: `pq-bounce 1s ${delay}ms infinite`,
  }}/>;
}

// ────────────────────────────────────────────────────────────────────
// MISSION 1 · Antrittsrede / Bundestagsrede
// Pick up to 3 themes + a tone, then see your speech preview.
// ────────────────────────────────────────────────────────────────────
export function MissionRede({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [step, setStep] = React.useState(0);    // 0 themes, 1 tone, 2 preview
  const [themes, setThemes] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState(50);   // 0 sachlich, 100 kämpferisch
  const themePool = REDE_THEMES[role] || REDE_THEMES.kanzler;

  const toggleTheme = (id: string) => {
    if (themes.includes(id)) setThemes(themes.filter((t) => t !== id));
    else if (themes.length < 3) setThemes([...themes, id]);
  };

  return (
    <MissionShell skin={skin} day={day} role={role} step={step + 1} total={3} onClose={onClose}>
      {step === 0 && (
        <>
          <MissionHeadline skin={skin}
            kicker={role === 'opposition' ? 'Bundestagsrede' : 'Antrittsrede'}
            title="Wähle bis zu 3 Themen"
            sub="Worum geht's? Die Wähler erinnern sich an drei Sätze. Nicht mehr."/>
          <div style={{
            marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {themePool.map((t) => {
              const on = themes.includes(t.id);
              const idx = themes.indexOf(t.id);
              return (
                <button key={t.id} onClick={() => toggleTheme(t.id)}
                  disabled={!on && themes.length >= 3}
                  style={{
                    padding: '14px 12px', border: 0, borderRadius: 14,
                    background: on ? '#000' : skin.surface,
                    color: on ? '#F6C414' : skin.text,
                    cursor: !on && themes.length >= 3 ? 'default' : 'pointer',
                    opacity: !on && themes.length >= 3 ? 0.4 : 1,
                    boxShadow: on ? 'inset 0 -3px 0 #1a1a1a'
                                  : '0 0 0 1.5px ' + skin.divider,
                    fontFamily: 'inherit', textAlign: 'left',
                    position: 'relative',
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.15 }}>{t.label}</div>
                  {on && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 22, height: 22, borderRadius: 999, background: '#F6C414', color: '#000',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 800, fontSize: 11,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>{idx + 1}</div>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{
            fontSize: 11, color: skin.textDim, textAlign: 'center', marginBottom: 8,
          }}>{themes.length} / 3 Themen gewählt</div>
          <PressButton
            variant={themes.length > 0 ? 'primary' : 'ghost'}
            size="lg" full
            disabled={themes.length === 0}
            onClick={() => setStep(1)}>Weiter</PressButton>
        </>
      )}

      {step === 1 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Tonalität"
            title="Wie willst du klingen?"
            sub={role === 'opposition'
              ? 'Sachlich-analytisch oder volle Attacke?'
              : 'Visionär und versöhnend oder hart und konfrontativ?'}/>
          <div style={{
            marginTop: 24, padding: '16px 14px',
            background: skin.surface, border: skin.surfaceBorder, borderRadius: 16,
          }}>
            {/* Big tone slider */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, fontWeight: 700, color: skin.textDim,
              textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10,
            }}>
              <span>Sachlich</span><span>Kämpferisch</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              style={{
                width: '100%', appearance: 'none', height: 8, borderRadius: 999,
                background: `linear-gradient(90deg, #1B5FAE 0%, #F6C414 50%, #D81E26 100%)`,
                outline: 'none',
              }}/>
            <div style={{
              marginTop: 14, fontSize: 16, color: skin.text, fontWeight: 700, textAlign: 'center',
            }}>
              {toneDescriptor(tone)}
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setStep(2)}>
            Rede vorbereiten
          </PressButton>
        </>
      )}

      {step === 2 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Vorschau"
            title="So klingt deine Rede"/>
          <SpeechPreview skin={skin}
            themes={themes.map((id) => themePool.find((t) => t.id === id)).filter(Boolean) as RedeTheme[]}
            tone={tone} role={role}/>
          <div style={{ flex: 1 }}/>
          <PressButton variant="success" size="lg" full onClick={() => {
            // Score: Anteil populärer Themen + leichter Bonus für mittleren Ton
            const popHits = themes.filter((id) => POPULAR_THEMES.has(id)).length;
            const themeScore = themes.length ? popHits / themes.length : 0;
            // Tonalität: zu lasch (<20) oder zu krass (>85) zieht runter
            const toneScore =
              tone < 20 ? 0.4 :
              tone < 35 ? 0.7 :
              tone < 70 ? 1.0 :
              tone < 85 ? 0.75 : 0.5;
            const score = themeScore * 0.7 + toneScore * 0.3;
            recordMission('rede', score, { themes, tone, popHits });
            onDone(70);
          }}>
            Rede halten · +70 XP
          </PressButton>
        </>
      )}
    </MissionShell>
  );
}

interface SpeechData {
  opener: string;
  lines: { label: string; text: string }[];
}

function SpeechPreview({
  themes,
  tone,
  role,
}: {
  skin: SkinTokens;
  themes: RedeTheme[];
  tone: number;
  role: string;
}) {
  const themeIds = themes.filter(Boolean).map((t) => t.id).join(',');
  const cacheKey = `${themeIds}|${tone}`;

  const [data, setData] = React.useState<SpeechData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const cleanThemes = themes.filter(Boolean);
    if (cleanThemes.length === 0) { setLoading(false); return; }

    setLoading(true);
    setData(null);
    // Kurze "KI schreibt"-Animation, danach die vorgefertigten Sätze.
    const timer = setTimeout(() => {
      if (cancelled) return;
      setData({
        opener: speechOpener(cleanThemes.length, tone, role),
        lines: cleanThemes.map((x) => ({ label: x.label, text: speechLineFor(x.id, tone) })),
      });
      setLoading(false);
    }, 900);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return (
    <div style={{
      marginTop: 16, background: '#FAF1DD', color: '#1F1D17',
      borderRadius: 14, padding: '16px 18px',
      fontFamily: '"Bricolage Grotesque", system-ui',
      boxShadow: '0 12px 28px -16px rgba(20,19,15,.25)',
      position: 'relative', minHeight: 180,
    }}>
      {loading ? (
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center', minHeight: 100,
          color: '#807A6A',
        }}>
          <WahlDot delay={0}/><WahlDot delay={150}/><WahlDot delay={300}/>
          <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>
            KI schreibt deine Rede…
          </span>
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 16, lineHeight: 1.4, fontWeight: 600, fontStyle: 'italic',
          }}>{data?.opener || '—'}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.lines || []).map((ln, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, background: '#D81E26',
                  color: '#fff', display: 'grid', placeItems: 'center',
                  fontWeight: 800, fontSize: 12, flexShrink: 0,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>{i + 1}</div>
                <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                  <b>{ln.label}.</b> {ln.text}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 2 · Wahlplakat (opens the existing editor)
// ────────────────────────────────────────────────────────────────────
export function MissionPlakat({ skin = "clean", onDone }: MissionProps) {
  return <Plakat skin={skin}
    onClose={() => {
      // Score: hat der Spieler ein Plakat gespeichert? (Slogan vorhanden?)
      const p = loadPlakat();
      let score = 0.5;
      if (p?.saved) score = 0.8;
      if (p?.slogan && p.slogan.trim().length > 6) score = Math.min(1, score + 0.1);
      recordMission('plakat', score, { saved: !!p?.saved });
      onDone(50);
    }}
  />;
}

// ────────────────────────────────────────────────────────────────────
// MISSION 3 · TV-Triell (3 timed questions)
// ────────────────────────────────────────────────────────────────────
export function MissionTV({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [q, setQ] = React.useState(0);
  const [reactions, setReactions] = React.useState<Segments[]>([]); // per-question reaction snapshots
  const [showResult, setShowResult] = React.useState(false);

  const pick = (s: string) => {
    // Compute Bevölkerungs-Reaktion: 3 demographic segments per answer.
    // No grades — just how 3 groups felt, on a -50..+50 scale.
    const reaction = reactionFor(q, s);
    const next = [...reactions, reaction];
    setReactions(next);
    if (q < TV_QUESTIONS.length - 1) setQ(q + 1);
    else setShowResult(true);
  };

  // Average across all questions for the final barometer
  const overall: Segments = reactions.length > 0
    ? avgSegments(reactions)
    : { jung: 0, mitte: 0, senioren: 0 };

  if (showResult) {
    // Score = wie wohlwollend reagiert die Bevölkerung im Durchschnitt?
    // overall.jung/mitte/senioren bewegen sich -50..+50.
    const avg = (overall.jung + overall.mitte + overall.senioren) / 3;
    const tvScore = (avg + 50) / 100;  // 0..1
    return (
      <MissionShell skin={skin} day={day} role={role} step={3} total={3} onClose={onClose}>
        <MissionHeadline skin={skin}
          kicker="TV-Triell · Reaktion"
          title="So reagiert das Land"
          sub="Live-Stimmungsbild, ausgewertet aus Social-Media + Umfragen."/>
        <BevoelkerungsBarometer skin={skin} overall={overall}/>

        <div style={{ flex: 1 }}/>
        <PressButton variant="primary" size="lg" full onClick={() => {
          recordMission('tv', tvScore, { overall });
          onDone(80);
        }}>
          Weiter
        </PressButton>
      </MissionShell>
    );
  }

  const cur = TV_QUESTIONS[q];
  return (
    <MissionShell skin={skin} day={day} role={role} step={q + 1} total={3} onClose={onClose}>
      {/* Two-people TV-frame: moderator + user, with a "ON AIR" banner */}
      <div style={{
        marginTop: 4, borderRadius: 14, overflow: 'hidden',
        background: 'linear-gradient(135deg, #003770 0%, #001a3a 100%)',
        color: '#fff', position: 'relative', minHeight: 140,
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: .35,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(246,196,20,.45), transparent 55%)',
        }}/>
        <div style={{
          position: 'absolute', top: 8, left: 10,
          background: '#D81E26', color: '#fff',
          padding: '2px 7px', borderRadius: 2,
          fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
        }}>LIVE · ARD</div>

        {/* Two anchor silhouettes — speaking animation toggle */}
        <div style={{
          position: 'absolute', top: 36, left: '12%', width: 60, height: 80,
          borderRadius: '40% 40% 6px 6px / 55% 55% 12px 12px',
          background: 'rgba(0,0,0,.5)',
          animation: 'pq-bob 1.4s ease-in-out infinite',
        }}/>
        <div style={{
          position: 'absolute', top: 36, right: '12%', width: 60, height: 80,
          borderRadius: '40% 40% 6px 6px / 55% 55% 12px 12px',
          background: 'rgba(0,0,0,.5)',
          animation: 'pq-bob 1.4s 0.7s ease-in-out infinite',
        }}/>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 8,
          textAlign: 'center', fontSize: 10, fontWeight: 700, opacity: .85, letterSpacing: '.08em',
        }}>{q === 0 ? 'Moderation: Frau Lehmann' : q === 1 ? 'Moderation: Herr Klar' : 'Moderation: Frau Yilmaz'}</div>
      </div>

      <div style={{
        marginTop: 14, padding: '14px 16px', background: skin.surface,
        border: skin.surfaceBorder, borderRadius: 14,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: '#D81E26',
          letterSpacing: '.1em', textTransform: 'uppercase',
        }}>Frage {q + 1} von {TV_QUESTIONS.length}</div>
        <div style={{ fontSize: 15, lineHeight: 1.35, marginTop: 4, fontWeight: 600, color: skin.text }}>
          {cur.q}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cur.a.map((ans) => (
          <button key={ans.id} onClick={() => pick(ans.id)} style={{
            background: skin.surface, border: 0, padding: '14px 16px',
            boxShadow: '0 0 0 1.5px ' + skin.divider + ', inset 0 -3px 0 ' + skin.divider,
            borderRadius: 14, textAlign: 'left', cursor: 'pointer',
            color: skin.text, fontFamily: 'inherit',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, background: '#000', color: '#F6C414',
                display: 'grid', placeItems: 'center',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 800,
                flexShrink: 0,
              }}>{ans.id}</div>
              <div style={{ fontSize: 14, lineHeight: 1.35, fontWeight: 500 }}>{ans.text}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Live mini-barometer between rounds */}
      {reactions.length > 0 && (
        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: skin.surface, border: skin.surfaceBorder, borderRadius: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: skin.textDim,
            letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8,
          }}>Live-Reaktion bisher</div>
          <BarometerMini skin={skin} overall={avgSegments(reactions)}/>
        </div>
      )}
    </MissionShell>
  );
}

// Full barometer (final screen) — 3 demographic groups vertical bars
function BevoelkerungsBarometer({ skin, overall }: { skin: SkinTokens; overall: Segments }) {
  const groups = [
    { id: 'jung',    label: 'Junge (18–34)', val: overall.jung },
    { id: 'mitte',   label: 'Mitte (35–59)', val: overall.mitte },
    { id: 'senioren',label: 'Senioren (60+)', val: overall.senioren },
  ];
  const verdict = (v: number) =>
    v > 30 ? 'Begeistert'  : v > 10 ? 'Wohlwollend' :
    v > -10 ? 'Gespalten'   : v > -30 ? 'Kritisch'    : 'Empört';
  return (
    <div style={{
      marginTop: 16, background: skin.surface, border: skin.surfaceBorder, borderRadius: 16,
      padding: '18px 16px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map((g) => {
          // map -50..+50 → 0..100% on a left-red / right-green scale
          const pct = Math.max(0, Math.min(100, 50 + g.val));
          const positive = g.val > 0;
          return (
            <div key={g.id}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12, fontWeight: 700, color: skin.text, marginBottom: 6,
              }}>
                <span>{g.label}</span>
                <span style={{
                  color: positive ? '#2E9F5D' : g.val < 0 ? '#D81E26' : skin.textDim,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>{verdict(g.val)}</span>
              </div>
              <div style={{
                position: 'relative', height: 12,
                background: 'linear-gradient(90deg, #D81E26 0%, #F6C414 50%, #2E9F5D 100%)',
                opacity: .25, borderRadius: 999,
              }}/>
              <div style={{
                position: 'relative', marginTop: -12, height: 12, pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: `${pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 18, height: 18, borderRadius: 999,
                  background: '#1F1D17',
                  border: '3px solid #F6C414',
                  transition: 'left 1s cubic-bezier(.3,.7,.4,1)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 14, fontSize: 11, color: skin.textDim, textAlign: 'center', lineHeight: 1.4,
      }}>
        🤖 In der echten App: KI analysiert Social-Media-Posts und Umfragen live während der Sendung.
      </div>
    </div>
  );
}

// Compact mini-barometer used between rounds inside the TV mission
function BarometerMini({ skin, overall }: { skin: SkinTokens; overall: Segments }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {([{ id: 'jung', l: '18–34' }, { id: 'mitte', l: '35–59' }, { id: 'senioren', l: '60+' }] as const).map((g) => {
        const v = overall[g.id];
        const pct = Math.max(0, Math.min(100, 50 + v));
        const c = v > 10 ? '#2E9F5D' : v < -10 ? '#D81E26' : '#F6C414';
        return (
          <div key={g.id} style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, color: skin.textDim, marginBottom: 3, fontWeight: 700,
              textAlign: 'center',
            }}>{g.l}</div>
            <div style={{
              height: 8, background: skin.tagBg, borderRadius: 999, position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '50%',
                width: Math.abs(v) + '%', maxWidth: '50%',
                transform: v < 0 ? 'translateX(-100%)' : 'none',
                background: c,
              }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 4 · Pressekonferenz (Q&A mit Reportern, Anti-Regierungs-Setting)
// ────────────────────────────────────────────────────────────────────
export function MissionPresse({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [q, setQ] = React.useState(0);
  const [picked, setPicked] = React.useState<number[]>([]);

  if (q >= PRESSE_QUESTIONS.length) {
    // Antwort 0 ist meistens die schärfste, 1 die diplomatischste, 2 die schwächste.
    // Wir belohnen die mittlere Antwort am stärksten — Pressekonferenzen kippen
    // sonst schnell ins Lächerliche.
    const tier = [0.8, 1.0, 0.5];
    const pScore = picked.length
      ? picked.reduce((s, p) => s + (tier[p] ?? 0.5), 0) / picked.length
      : 0.5;
    return (
      <MissionShell skin={skin} day={day} role={role} step={3} total={3} onClose={onClose}>
        <MissionHeadline skin={skin}
          kicker="Pressekonferenz · Fertig"
          title="Du hast den Saal überlebt."
          sub="Schlagzeilen morgen — du hast geliefert."/>
        <div style={{ flex: 1 }}/>
        <PressButton variant="primary" size="lg" full onClick={() => {
          recordMission('presse', pScore, { picked });
          onDone(65);
        }}>
          Weiter
        </PressButton>
      </MissionShell>
    );
  }
  const cur = PRESSE_QUESTIONS[q];
  return (
    <MissionShell skin={skin} day={day} role={role} step={q + 1} total={3} onClose={onClose}>
      <MissionHeadline skin={skin}
        kicker={`Frage ${q + 1} / 3`}
        title={cur.reporter}/>
      <div style={{
        marginTop: 14, background: '#FFFFFF', color: '#1F1D17',
        border: '1.5px solid ' + skin.divider, borderRadius: 14,
        padding: '14px 16px', fontSize: 15, lineHeight: 1.4, fontWeight: 600,
      }}>„{cur.q}"</div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cur.a.map((ans, i) => (
          <button key={i} onClick={() => { setPicked([...picked, i]); setQ(q + 1); }}
            style={{
              background: skin.surface, border: 0, padding: '14px 16px',
              boxShadow: '0 0 0 1.5px ' + skin.divider,
              borderRadius: 14, textAlign: 'left', cursor: 'pointer',
              fontFamily: 'inherit', color: skin.text,
              fontSize: 14, lineHeight: 1.35, fontWeight: 500,
            }}>{ans}</button>
        ))}
      </div>
    </MissionShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 5 · Marktbesuch / Wahlkreis-Tour — quick citizen encounters
// ────────────────────────────────────────────────────────────────────
export function MissionMarkt({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [i, setI] = React.useState(0);
  const [picks, setPicks] = React.useState<number[]>([]);

  if (i >= ENCOUNTERS.length) {
    // Score: empathische, konkrete Antworten (Index 0 oder 2) > vage (Index 1).
    // Pro Begegnung leicht andere Gewichtung.
    const mScore = picks.length
      ? picks.reduce((s, p, idx) => s + (ENCOUNTER_WEIGHTS[idx]?.[p] ?? 0.5), 0) / picks.length
      : 0.5;
    return (
      <MissionShell skin={skin} day={day} role={role} step={4} total={4} onClose={onClose}>
        <MissionHeadline skin={skin}
          kicker="Bürgergespräche"
          title="4 Gespräche, viel mitgenommen."
          sub="Die Wähler erinnern sich an dein Gesicht."/>
        <div style={{
          marginTop: 18, background: skin.surface, border: skin.surfaceBorder,
          borderRadius: 16, padding: '16px 14px',
        }}>
          {ENCOUNTERS.map((e, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderTop: idx === 0 ? 0 : '1px solid ' + skin.divider,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#F6C414',
                display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0,
              }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: skin.text }}>{e.name} · {e.age}</div>
                <div style={{ fontSize: 11, color: skin.textDim, marginTop: 1 }}>Antwort {picks[idx] + 1} gegeben</div>
              </div>
              <span style={{ color: '#2E9F5D' }}>✓</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <PressButton variant="primary" size="lg" full onClick={() => {
          recordMission('markt', mScore, { picks });
          onDone(80);
        }}>Weiter</PressButton>
      </MissionShell>
    );
  }

  const e = ENCOUNTERS[i];
  return (
    <MissionShell skin={skin} day={day} role={role} step={i + 1} total={4} onClose={onClose}>
      <MissionHeadline skin={skin}
        kicker={role === 'opposition' ? 'Wahlkreis-Tour' : 'Marktbesuch'}
        title={`Begegnung ${i + 1} / 4`}/>
      <div style={{
        marginTop: 14, display: 'flex', gap: 12, alignItems: 'center',
        background: skin.surface, border: skin.surfaceBorder, borderRadius: 14, padding: '14px 14px',
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%', background: '#F6C414',
          display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0,
        }}>👤</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: skin.text }}>{e.name}</div>
          <div style={{ fontSize: 12, color: skin.textDim }}>{e.age} Jahre</div>
        </div>
      </div>
      <div style={{
        marginTop: 14, padding: '14px 16px', background: '#FAF1DD', color: '#1F1D17',
        borderRadius: 14, fontSize: 15, lineHeight: 1.4, fontWeight: 600,
      }}>{e.q}</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {e.a.map((ans, k) => (
          <button key={k} onClick={() => { setPicks([...picks, k]); setI(i + 1); }}
            style={{
              background: skin.surface, border: 0, padding: '12px 14px',
              boxShadow: '0 0 0 1.5px ' + skin.divider, borderRadius: 12,
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              color: skin.text, fontSize: 14, lineHeight: 1.35, fontWeight: 500,
            }}>{ans}</button>
        ))}
      </div>
    </MissionShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 6 · Wahlsonntag — DYNAMISCH
//
// Hier zahlt sich alles aus, was der Spieler die Woche gemacht hat:
//   • Mission-Scores (rede / plakat / tv / presse / markt)
//   • Volks-Match aus den 18 Aussagen
//   • Partei-Basis
//
// 4 Phasen:
//   1. "Wahllokale schließen" → Pulse, CTA
//   2. KI-Analyse — kommentiert deinen Wahlkampf
//   3. Hochrechnung — animierte Balken, deine Partei farbig
//   4. Folgekarte: Kanzler:in / Minister:in / Opposition
// ────────────────────────────────────────────────────────────────────
type WahlPhase = 'idle' | 'analyzing' | 'results' | 'verdict';

export function MissionWahl({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);

  // Phase: 'idle' → 'analyzing' → 'results' → 'verdict'
  const [phase, setPhase] = React.useState<WahlPhase>('idle');
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);

  // Session lesen
  const session = loadSession();
  const profile     = session?.profile || {};
  const ownPartyId  = profile.party || 'eigen';
  const positions   = profile.positions || {};
  const ownPartyMeta = WAHL_PARTY_META[ownPartyId] || WAHL_PARTY_META.eigen;

  // Wahlergebnis berechnen (deterministisch aus Performance)
  const results = React.useMemo<ElectionResult[]>(
    () => computeElectionResult(ownPartyId, positions) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ownPartyId]
  );
  const mineIdx     = results.findIndex((r) => r.id === ownPartyId);
  const mine        = results[mineIdx];
  const resolvedRole = determineRole(results, ownPartyId) || 'opposition';
  const regParteien  = regierungsParteien(results, ownPartyId) || [];

  // Beim Wechsel auf "analyzing" → Auswertung berechnen
  const runAnalysis = () => {
    setPhase('analyzing');
    const campaign = loadCampaign() || { missions: {}, aiAnalysis: null };
    const total    = totalScore(positions) ?? 0.5;
    const popMatch = popularAlignment(positions) ?? 0.5;
    void campaign;
    const analysis = fallbackAnalysis(total, popMatch, mine?.pct, ownPartyMeta.name);
    setAiAnalysis(analysis);
    // Nach kurzer Lesedauer in die Ergebnisanzeige
    setTimeout(() => setPhase('results'), 2400);
  };

  // Beim Eintritt in "verdict" → Rolle in der Session speichern,
  // sodass Home / Telefon ab Tag 6 anders aussehen.
  React.useEffect(() => {
    if (phase !== 'verdict') return;
    const s = loadSession();
    saveSession({
      ...s,
      profile: {
        ...(s.profile || {}),
        role: resolvedRole,
        electedRole: resolvedRole,
        electionResults: results,
        coalitionParties: regParteien,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <MissionShell skin={skin} day={day} role={role} step={5} total={5} onClose={onClose}>
      {/* ─── PHASE 1 · Idle ─── */}
      {phase === 'idle' && (
        <>
          <MissionHeadline skin={skin}
            kicker="Wahlsonntag · 18:00 Uhr"
            title="Sonntagabend. Die Wahllokale schließen."
            sub={'Drück „Live-Hochrechnung" um deine Auswertung zu starten.'}/>
          <div style={{
            marginTop: 18, padding: '24px 16px',
            background: '#1F1D17', color: '#FBF6E9', borderRadius: 18,
            display: 'grid', placeItems: 'center', minHeight: 200,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, animation: 'pq-pulse 1.8s ease-out infinite' }}>📺</div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: .7 }}>Tagesschau · 18:00</div>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant="primary" size="lg" full onClick={runAnalysis}>
            Live-Hochrechnung
          </PressButton>
        </>
      )}

      {/* ─── PHASE 2 · KI-Analyse ─── */}
      {phase === 'analyzing' && (
        <>
          <MissionHeadline skin={skin}
            kicker="KI-Analyse · Wahlabend"
            title="Auswertung läuft…"
            sub={'Eine KI bewertet deine Mission-Performance und die Stimmung im Land.'}/>
          <div style={{
            marginTop: 18, background: skin.surface, border: skin.surfaceBorder,
            borderRadius: 18, padding: '18px 18px', minHeight: 160, position: 'relative',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: '#D81E26',
              letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999, background: '#D81E26',
                animation: 'pq-pulse 1s ease-out infinite',
              }}/>
              Live · KI-Auswertung
            </div>
            {aiAnalysis ? (
              <div style={{
                fontSize: 16, lineHeight: 1.4, color: skin.text, fontWeight: 500,
                animation: 'pq-rise .35s ease-out',
              }}>{aiAnalysis}</div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: skin.textDim }}>
                <WahlDot delay={0}/><WahlDot delay={150}/><WahlDot delay={300}/>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>KI denkt nach…</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}/>
        </>
      )}

      {/* ─── PHASE 3 · Hochrechnung ─── */}
      {phase === 'results' && (
        <>
          <MissionHeadline skin={skin}
            kicker={`Hochrechnung · ${ownPartyMeta.name}`}
            title={mine ? `${mine.pct.toFixed(1)} % — Platz ${mineIdx + 1}` : 'Kein Ergebnis'}
            sub={aiAnalysis || undefined}/>

          <div style={{
            marginTop: 14, background: skin.surface, border: skin.surfaceBorder,
            borderRadius: 14, padding: '12px 14px',
          }}>
            {results.map((r) => {
              const meta = WAHL_PARTY_META[r.id] || WAHL_PARTY_META.eigen;
              const isMine = r.mine;
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                }}>
                  <div style={{
                    width: 60, fontWeight: 800, fontSize: 12,
                    color: isMine ? '#D81E26' : skin.text,
                  }}>{meta.name}</div>
                  <div style={{ flex: 1, height: 14, background: skin.tagBg, borderRadius: 999, position: 'relative' }}>
                    <div style={{
                      width: `${Math.min(100, r.pct * 2.8)}%`, height: '100%',
                      background: meta.color, borderRadius: 999,
                      transition: 'width 1.2s cubic-bezier(.3,.7,.4,1)',
                      boxShadow: isMine ? '0 0 0 1.5px #D81E26' : 'none',
                    }}/>
                  </div>
                  <div style={{
                    width: 48, textAlign: 'right',
                    fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 12,
                    color: isMine ? '#D81E26' : skin.text,
                  }}>{r.pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setPhase('verdict')}>
            Was bedeutet das für dich?
          </PressButton>
        </>
      )}

      {/* ─── PHASE 4 · Verdict (Rolle) ─── */}
      {phase === 'verdict' && (
        <>
          <VerdictCard
            skin={skin}
            role={resolvedRole}
            ownPartyMeta={ownPartyMeta}
            mine={mine}
            results={results}
            coalition={regParteien}
          />
          <div style={{ flex: 1 }}/>
          <PressButton variant="success" size="lg" full onClick={() => onDone(120)}>
            {resolvedRole === 'kanzler' ? 'Vereidigung starten · +120 XP'
              : resolvedRole === 'minister' ? 'In die Koalition · +120 XP'
              : 'In die Opposition · +120 XP'}
          </PressButton>
        </>
      )}
    </MissionShell>
  );
}

// ─── Verdict-Karte: das Spielergebnis erklärt ──────────────────────
function VerdictCard({
  role,
  ownPartyMeta,
  mine,
  results,
  coalition,
}: {
  skin: SkinTokens;
  role: string;
  ownPartyMeta: { name: string; color: string; fg: string };
  mine: ElectionResult | undefined;
  results: ElectionResult[];
  coalition: string[];
}) {
  const isKanzler = role === 'kanzler';
  const isMinister = role === 'minister';

  const titleLine = isKanzler   ? 'Du wirst Bundeskanzler:in.'
                  : isMinister  ? 'Du gehst als Minister:in mit in die Regierung.'
                  :               'Du gehst in die Opposition.';

  const subLine = isKanzler
    ? `${ownPartyMeta.name} ist stärkste Kraft mit ${mine?.pct.toFixed(1)}% — du bildest die Regierung.`
    : isMinister
      ? `Eure Koalition: ${coalition.map((id) => WAHL_PARTY_META[id]?.name || id).join(' + ')}.`
      : `${ownPartyMeta.name} reicht es nicht — andere bilden die Regierung.`;

  const cardBg = isKanzler ? '#F6C414' : isMinister ? '#1AA037' : '#1F1D17';
  const cardFg = isKanzler ? '#1F1D17' : '#FFFFFF';

  return (
    <div style={{
      marginTop: 14, background: cardBg, color: cardFg,
      borderRadius: 18, padding: '20px 18px',
      boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.25), 0 16px 36px -16px rgba(20,19,15,.35)',
      animation: 'pq-rise .45s ease-out',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', opacity: .8,
      }}>{isKanzler ? 'Regierungs­chef:in' : isMinister ? 'Junior­partner:in' : 'Opposition'}</div>

      <div className="pq-display-tight" style={{
        fontSize: 26, fontWeight: 800, marginTop: 6, lineHeight: 1.05,
        letterSpacing: '-.02em',
      }}>{titleLine}</div>

      <div style={{
        fontSize: 13, marginTop: 8, lineHeight: 1.4, opacity: .92, fontWeight: 500,
      }}>{subLine}</div>

      {/* Koalitions-Strip */}
      {(isKanzler || isMinister) && coalition.length > 0 && (
        <div style={{
          marginTop: 14, display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 0 0 2px rgba(255,255,255,.25)',
        }}>
          {coalition.map((id) => {
            const r = results.find((x) => x.id === id);
            const meta = WAHL_PARTY_META[id] || WAHL_PARTY_META.eigen;
            return (
              <div key={id} style={{
                flex: r?.pct || 1, background: meta.color, color: meta.fg,
                display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
              }}>{meta.name}</div>
            );
          })}
        </div>
      )}

      {/* Tag-6-Teaser */}
      <div style={{
        marginTop: 14, padding: '10px 12px', borderRadius: 10,
        background: 'rgba(0,0,0,.18)', fontSize: 12, lineHeight: 1.4, fontWeight: 500,
      }}>
        {isKanzler
          ? 'Tag 6: Koalitions­verhandlung, dann Vereidigung im Bundestag.'
          : isMinister
            ? 'Tag 6: Ressort­wahl und Vereidigung als Minister:in.'
            : 'Tag 6: Du übernimmst die Fraktion. Bundestag, aktuelle Stunde, Untersuchung.'}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 7 · Themen-Setzung
// Lernmodul + Auswahl: 3 Kernthemen, die deinen Wahlkampf tragen sollen.
// ────────────────────────────────────────────────────────────────────
export function MissionThemen({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [phase, setPhase] = React.useState(0); // 0: Lagekarte, 1: Antrittsrede
  const [choice, setChoice] = React.useState<string | null>(null);

  const kernthemen = React.useMemo<string[]>(
    () => loadSession()?.profile?.kernthemen || [],
    []
  );
  const themenCards = kernthemen
    .map((id) => KERNTHEMEN_CATALOGUE.find((c) => c.id === id))
    .filter(Boolean) as (typeof KERNTHEMEN_CATALOGUE)[number][];

  if (phase === 0) {
    return (
      <MissionShell skin={skin} day={day} role={role} step={1} total={2} onClose={onClose}>
        <MissionHeadline skin={skin}
          kicker="Tag 1 · Lagekarte"
          title="Die politische Lage"
          sub="Bevor du deine erste Rede hältst — ein Blick auf das Schlachtfeld."/>

        <div style={{
          marginTop: 14, background: skin.surface, border: skin.surfaceBorder,
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: skin.textDim,
            letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10,
          }}>Aktuelle Umfragen</div>
          {LAGE_POLLS.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 50, fontSize: 11, fontWeight: 700, color: skin.text, flexShrink: 0 }}>{p.name}</div>
              <div style={{ flex: 1, height: 10, background: skin.tagBg, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, p.pct * 3.3)}%`, height: '100%',
                  background: p.color, borderRadius: 999,
                  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.18)',
                }}/>
              </div>
              <div style={{
                width: 28, textAlign: 'right',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, fontWeight: 800, color: skin.text, flexShrink: 0,
              }}>{p.pct}%</div>
            </div>
          ))}
        </div>

        {themenCards.length > 0 && (
          <div style={{
            marginTop: 10, background: '#1F1D17', color: '#FBF6E9',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#F6C414',
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>Deine Kernthemen</div>
            {themenCards.map((card) => (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.catColor, flexShrink: 0 }}/>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{card.text}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 10, padding: '10px 12px',
          background: skin.surface, border: skin.surfaceBorder, borderRadius: 12,
          fontSize: 12, color: skin.textMuted, lineHeight: 1.45,
        }}>
          Die Koalitionsverhandlungen laufen. Alle Augen richten sich auf den Bundestag.
          Deine erste Rede ist deine erste Chance.
        </div>

        <div style={{ flex: 1, minHeight: 16 }}/>
        <PressButton variant="primary" size="lg" full onClick={() => setPhase(1)}>
          Zur Antrittsrede →
        </PressButton>
      </MissionShell>
    );
  }

  const picked2 = REDE_EROEFFNUNG.find((o) => o.id === choice);
  return (
    <MissionShell skin={skin} day={day} role={role} step={2} total={2} onClose={onClose}>
      <MissionHeadline skin={skin}
        kicker="Antrittsrede · Bundestag"
        title="Womit fängst du an?"
        sub="Deine ersten Worte im Plenum. Die Presse schreibt mit."/>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {REDE_EROEFFNUNG.map((opt) => {
          const on = choice === opt.id;
          return (
            <button key={opt.id} onClick={() => setChoice(opt.id)} style={{
              background: on ? '#1F1D17' : skin.surface,
              color: on ? '#FBF6E9' : skin.text,
              border: 0, borderRadius: 16, textAlign: 'left',
              padding: '16px 16px', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: on
                ? 'inset 0 -4px 0 #000, 0 0 0 2.5px #F6C414'
                : '0 0 0 1.5px ' + skin.divider,
              transition: 'all .12s',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800,
                color: on ? '#F6C414' : '#D81E26',
                letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6,
              }}>{opt.label}</div>
              <div style={{
                fontSize: 15, fontWeight: 600, lineHeight: 1.35, fontStyle: 'italic',
              }}>{opt.quote}</div>
              <div style={{
                marginTop: 8, fontSize: 12, lineHeight: 1.4,
                color: on ? 'rgba(251,246,233,.65)' : skin.textDim,
              }}>{opt.effect}</div>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 16 }}/>
      <PressButton
        variant={choice ? 'primary' : 'ghost'}
        size="lg" full disabled={!choice}
        onClick={() => {
          recordMission('themen', picked2?.score || 0.7, { opening: choice });
          onDone(picked2?.xp || 60);
        }}>
        {choice ? `Rede halten · +${picked2?.xp || 60} XP` : 'Eröffnung wählen'}
      </PressButton>
    </MissionShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 8 · Wahlprogramm — Accordion mit Partei-Optionen
// Pro Thema EINE Partei-Option wählen (oder keine). Volle Freiheit.
// ────────────────────────────────────────────────────────────────────
export function MissionProgramm({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [step, setStep] = React.useState(0); // 0 intro, 1 pick, 2 review
  // selections: { themaId: optionId | undefined }
  const [selections, setSelections] = React.useState<Record<string, string | undefined>>({});
  const [openThema, setOpenThema] = React.useState<string | null>(null);

  const allOptIds = Object.values(selections).filter(Boolean) as string[];
  const cost = allOptIds.reduce((s, id) => s + (WAHLVERSPRECHEN_BY_ID[id]?.cost || 0), 0);
  const pickedCount = allOptIds.length;

  const selectOption = (themaId: string, optId: string) => {
    // tap same option again → deselect
    setSelections((s) => ({ ...s, [themaId]: s[themaId] === optId ? undefined : optId }));
    setOpenThema(null); // auto-close after picking
  };
  const toggleThema = (id: string) => setOpenThema((cur) => cur === id ? null : id);

  return (
    <MissionShell skin={skin} day={day} role={role} step={step + 1} total={3} onClose={onClose}>

      {/* ─── STEP 0 · Intro ─── */}
      {step === 0 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Bildungs-Modul · Wahlprogramm"
            title="Was versprichst du?"
            sub="Pro Thema gibt es verschiedene Ansätze. Wähle den, der dir wichtig ist — oder lass es offen."/>
          <div style={{
            marginTop: 16, background: skin.surface, border: skin.surfaceBorder,
            borderRadius: 16, padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#D81E26',
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10,
            }}>So funktioniert's</div>
            {[
              { t: 'Thema aufklappen',    d: 'Sieh verschiedene Ansätze für dieses Thema.' },
              { t: 'Volle Freiheit',      d: 'Du kannst alles, eines oder nichts wählen — ganz wie du willst.' },
              { t: 'Konsequenzen folgen', d: 'Als Kanzler:in wirst du deine Versprechen einlösen müssen — wir sehen später, was passiert.' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: '#1F1D17', color: '#FBF6E9',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 11, marginTop: 1,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{row.t}</div>
                  <div style={{ fontSize: 11.5, color: skin.textDim, lineHeight: 1.4, marginTop: 2 }}>{row.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 12 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setStep(1)}>
            Programm zusammenstellen
          </PressButton>
        </>
      )}

      {/* ─── STEP 1 · Accordion-Picker ─── */}
      {step === 1 && (
        <>
          <MissionHeadline skin={skin}
            kicker={pickedCount === 0 ? 'Noch nichts gewählt' : `${pickedCount} Versprechen gewählt`}
            title="Was versprichst du?"
            sub={pickedCount === 0
              ? 'Klappe ein Thema auf und wähle einen Ansatz.'
              : pickedCount < 3
                ? 'Knapp gehalten — kein überladenes Programm.'
                : 'Ambitioniertes Programm. Mal sehen, wie es ankommt.'}/>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {PROGRAMM_THEMEN.map((t) => {
              const selectedId = selections[t.id];
              const selectedOpt = t.optionen.find((o) => o.id === selectedId);
              const isOpen = openThema === t.id;
              return (
                <div key={t.id} style={{
                  borderRadius: 14, overflow: 'hidden',
                  boxShadow: isOpen
                    ? '0 0 0 2px #1F1D17'
                    : selectedOpt
                      ? '0 0 0 1.5px #2E9F5D'
                      : '0 0 0 1.5px ' + skin.divider,
                  background: skin.surface,
                  transition: 'box-shadow .15s',
                }}>
                  {/* Header */}
                  <button onClick={() => toggleThema(t.id)} style={{
                    width: '100%', padding: '11px 13px', border: 0,
                    background: 'transparent', fontFamily: 'inherit',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ fontSize: 20, width: 26, textAlign: 'center', flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: skin.text, lineHeight: 1.15 }}>{t.label}</div>
                      {selectedOpt ? (
                        <div style={{
                          fontSize: 11.5, marginTop: 3, color: skin.textDim,
                          fontWeight: 600, lineHeight: 1.3,
                        }}>{selectedOpt.label}</div>
                      ) : (
                        <div style={{ fontSize: 11, color: skin.textDim, marginTop: 2 }}>Keine Auswahl</div>
                      )}
                    </div>
                    <div style={{
                      flexShrink: 0, width: 20, height: 20, display: 'grid', placeItems: 'center',
                      transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24">
                        <path d="M6 9 L12 15 L18 9" stroke={skin.textDim} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded options */}
                  {isOpen && (
                    <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {t.optionen.map((opt) => {
                        const on = selections[t.id] === opt.id;
                        return (
                          <button key={opt.id} onClick={() => selectOption(t.id, opt.id)} style={{
                            padding: '11px 13px', border: 0, borderRadius: 10,
                            background: on ? '#1F1D17' : '#F4EDD8',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            boxShadow: on ? 'inset 0 -2px 0 #000' : 'none',
                            display: 'flex', alignItems: 'center', gap: 10,
                            transition: 'background .1s',
                          }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                              border: on ? '4px solid #F6C414' : '1.5px solid ' + skin.divider,
                              background: on ? '#1F1D17' : 'transparent',
                              transition: 'all .12s',
                            }}/>
                            <div style={{
                              flex: 1, fontWeight: 700, fontSize: 13.5, lineHeight: 1.3,
                              color: on ? '#FBF6E9' : skin.text,
                            }}>{opt.label}</div>
                          </button>
                        );
                      })}
                      {selectedOpt && (
                        <button onClick={() => { setSelections((s) => ({ ...s, [t.id]: undefined })); }} style={{
                          padding: '6px', border: 0, background: 'transparent',
                          color: skin.textDim, fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                        }}>Auswahl aufheben</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 14 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setStep(2)}>
            {pickedCount === 0 ? 'Ohne Versprechen weiter →' : `Programm festlegen (${pickedCount}) →`}
          </PressButton>
        </>
      )}

      {/* ─── STEP 2 · Review ─── */}
      {step === 2 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Auswertung · Wahlprogramm"
            title="Dein Programm"
            sub={pickedCount > 0
              ? `${pickedCount} Versprechen — damit gehst du in den Wahlkampf.`
              : 'Kein einziges Versprechen — das Volk weiß nicht, wofür du stehst.'}/>

          <div style={{
            marginTop: 14, background: '#1F1D17', color: '#FBF6E9',
            borderRadius: 16, padding: '14px 16px',
          }}>
            {pickedCount === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(251,246,233,.55)', lineHeight: 1.5 }}>
                Leeres Programm. Klare Linie sieht anders aus.
              </div>
            )}
            {PROGRAMM_THEMEN.map((t, i) => {
              const optId = selections[t.id];
              const opt = t.optionen.find((o) => o.id === optId);
              if (!opt) return null;
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                  borderTop: i === 0 ? 0 : '1px solid rgba(251,246,233,.08)',
                }}>
                  <div style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 800, color: 'rgba(251,246,233,.4)',
                      letterSpacing: '.1em', textTransform: 'uppercase',
                    }}>{t.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 3, lineHeight: 1.3 }}>{opt.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, minHeight: 12 }}/>
          <PressButton variant="success" size="lg" full onClick={() => {
            const ambition = Math.min(1, pickedCount / 5);
            const realismus = cost <= VERSPRECHEN_BUDGET_HINT ? 1 :
                              Math.max(0.4, 1 - (cost - VERSPRECHEN_BUDGET_HINT) / 40);
            const score = ambition * 0.6 + realismus * 0.4;
            recordMission('programm', score, { picked: allOptIds, cost });
            onDone(60);
          }}>
            Programm beschließen · +60 XP
          </PressButton>
        </>
      )}
    </MissionShell>
  );
}

// ────────────────────────────────────────────────────────────────────
function HaushaltDonut({
  planned,
  total,
  saldo,
}: {
  planned: { id: string; color: string; neu: number }[];
  total: number;
  saldo: number;
}) {
  const size = 196;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  // include the locked "Zinsen & Verwaltung" block as a grey segment
  const segs = [
    ...planned,
    { id: '_fix', color: HAUSHALT_FESTBLOCK.color, neu: HAUSHALT_FESTBLOCK.betrag },
  ];
  let offset = 0;
  const segments = segs.map((k) => {
    const frac = k.neu / total;
    const dash = C * frac;
    const node = (
      <circle key={k.id} cx={size/2} cy={size/2} r={r} fill="none"
        stroke={k.color} strokeWidth={stroke}
        strokeDasharray={`${Math.max(dash - 1.6, 0)} ${C}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray .25s' }}/>
    );
    offset += dash;
    return node;
  });
  const balanceOK = saldo >= 0;
  return (
    <div style={{ marginTop: 4, marginBottom: 6 }}>
      <div className="pq-display-tight" style={{
        fontSize: 22, fontWeight: 800, lineHeight: 1.1,
        textAlign: 'center', letterSpacing: '-.02em',
      }}>Bundeshaushalt</div>
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginTop: 8, position: 'relative',
      }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="#F0EADB" strokeWidth={stroke}/>
          {segments}
        </svg>
        <div style={{
          position: 'absolute', textAlign: 'center', pointerEvents: 'none',
        }}>
          <div className="pq-display-tight" style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{total}<span style={{ fontSize: 16, marginLeft: 3 }}>Mrd</span></div>
          <div style={{
            marginTop: 8, padding: '4px 10px', borderRadius: 999,
            background: balanceOK ? '#D8F0DE' : '#FCE0DF',
            color: balanceOK ? '#166B3A' : '#9B1219',
            fontSize: 11, fontWeight: 800, display: 'inline-block',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {balanceOK
              ? `+${Math.round(saldo)} Mrd übrig`
              : `−${Math.round(-saldo)} Mrd fehlen`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category row: chunky − / + stepper, +5 Mrd per tap ─────────
function HaushaltRow({
  kat,
  value,
  onChange,
}: {
  kat: { id: string; label: string; ist: number; fest: number; desc: string; color: string };
  value: number;
  onChange: (v: number) => void;
}) {
  const min = kat.fest;
  const max = kat.ist + KAT_DELTA_MAX;
  const delta = value - kat.ist;
  const canDec = value > min;
  const canInc = value < max;
  const deltaColor = delta > 0 ? '#166B3A' : delta < 0 ? '#9B1219' : '#807A6A';
  return (
    <div style={{
      padding: '12px 14px', background: '#FFFFFF',
      borderRadius: 16, boxShadow: '0 0 0 1.5px #F0EADB',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 10, alignSelf: 'stretch', borderRadius: 4,
        background: kat.color, flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.15 }}>
          {kat.label}
        </div>
        <div style={{
          fontSize: 11, color: '#807A6A', marginTop: 2, lineHeight: 1.3,
        }}>{kat.desc}</div>
        <div style={{
          marginTop: 4,
          fontSize: 10, color: '#9B1219', fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {kat.fest} Mrd davon fest verplant
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      }}>
        <button onClick={() => canDec && onChange(Math.max(min, value - KAT_STEP))}
          disabled={!canDec} aria-label="kürzen"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 0,
            background: canDec ? '#1F1D17' : '#F0EADB',
            color: canDec ? '#FBF6E9' : '#C9C2AE',
            fontSize: 22, fontWeight: 800, lineHeight: 1,
            cursor: canDec ? 'pointer' : 'not-allowed',
            boxShadow: canDec ? '0 2px 0 #000' : 'none',
          }}>−</button>
        <div style={{
          minWidth: 64, textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          <div style={{
            fontWeight: 800, fontSize: 18, lineHeight: 1,
            color: '#1F1D17',
          }}>{value}</div>
          <div style={{ fontSize: 9, opacity: .55, marginTop: 2 }}>Mrd €</div>
          <div style={{
            fontSize: 10, fontWeight: 800, marginTop: 3,
            color: deltaColor, minHeight: 12,
          }}>{delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '·'}</div>
        </div>
        <button onClick={() => canInc && onChange(Math.min(max, value + KAT_STEP))}
          disabled={!canInc} aria-label="erhöhen"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 0,
            background: canInc ? '#F6C414' : '#F0EADB',
            color: canInc ? '#1F1D17' : '#C9C2AE',
            fontSize: 22, fontWeight: 800, lineHeight: 1,
            cursor: canInc ? 'pointer' : 'not-allowed',
            boxShadow: canInc ? '0 2px 0 #C48A05' : 'none',
          }}>+</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION · Bundeshaushalt (POST-Election, role = 'kanzler')
// Du hast die Wahl gewonnen. Jetzt musst du deine Wahlversprechen
// einlösen — oder brechen. Cuts, Schulden und Versprechensbrüche
// kosten Popularität.
// ────────────────────────────────────────────────────────────────────
export function MissionBundeshaushalt({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [step, setStep] = React.useState(0); // 0 intro, 1 budget, 2 review

  // Wahlversprechen aus dem Campaign-State laden
  const promises = React.useMemo(() => {
    const c = loadCampaign() || { missions: {}, aiAnalysis: null };
    const ids = (c.missions?.programm?.details?.picked as string[] | undefined) || [];
    return ids.map((id) => WAHLVERSPRECHEN_BY_ID[id]).filter(Boolean);
  }, []);

  // Versprechen-Status: 'erfuellt' | 'gebrochen' (Start: alle erfüllt)
  const [versprechen, setVersprechen] = React.useState<Record<string, 'erfuellt' | 'gebrochen'>>(
    () => Object.fromEntries(promises.map((p) => [p.id, 'erfuellt' as const]))
  );

  // Werte pro Kategorie. Start: ist + Summe der erfüllten Versprechen je Ressort.
  const [werte, setWerte] = React.useState<Record<string, number>>(() => {
    const w: Record<string, number> = Object.fromEntries(HAUSHALT_KATEGORIEN.map((k) => [k.id, k.ist]));
    promises.forEach((p) => { w[p.kat] = (w[p.kat] || 0) + p.cost; });
    return w;
  });

  const [schulden, setSchulden] = React.useState(0);
  const setKat = (id: string, v: number) => setWerte((w) => ({ ...w, [id]: v }));

  const togglePromise = (id: string) => {
    const p = WAHLVERSPRECHEN_BY_ID[id];
    if (!p) return;
    const wasErfuellt = versprechen[id] === 'erfuellt';
    setVersprechen((v) => ({ ...v, [id]: wasErfuellt ? 'gebrochen' : 'erfuellt' }));
    setWerte((w) => {
      const fest = HAUSHALT_KATEGORIEN.find((k) => k.id === p.kat)?.fest || 0;
      const cur = w[p.kat] || 0;
      const next = wasErfuellt ? Math.max(fest, cur - p.cost) : cur + p.cost;
      return { ...w, [p.kat]: next };
    });
  };

  const planned = HAUSHALT_KATEGORIEN.map((k) => ({ ...k, neu: werte[k.id] }));
  const ausgabenVeraenderbar = planned.reduce((s, k) => s + k.neu, 0);
  const ausgabenTotal = ausgabenVeraenderbar + HAUSHALT_FESTBLOCK.betrag;
  const einnahmenTotal = STEUEREINNAHMEN + schulden;
  const saldo = einnahmenTotal - ausgabenTotal;

  const schuldenObj = SCHULDEN_OPTIONEN.find((o) => o.v === schulden) || SCHULDEN_OPTIONEN[0];

  // ─── Popularität (0..100) ──────────────────────────────────────
  // Start 60. Versprechen einhalten +6, brechen −12.
  // Soziales/Gesundheit + erfreut Volk; Kürzungen verärgern es;
  // Schulden ärgert Volk in steigendem Maß.
  let pop = 60;
  promises.forEach((p) => {
    if (versprechen[p.id] === 'erfuellt') pop += 6;
    else                                  pop -= 12;
  });
  HAUSHALT_KATEGORIEN.forEach((k) => {
    const delta = (werte[k.id] || 0) - k.ist;
    if (delta < 0) {
      // Kürzungen ärgern, doppelt schlimm bei Soziales & Gesundheit
      const factor = (k.id === 'soziales' || k.id === 'gesundheit') ? 3 : 2;
      pop -= (-delta / 5) * factor;
    } else if (delta > 0) {
      // Soziales/Gesundheit-Aufstockung erfreut. Andere neutral.
      const factor = (k.id === 'soziales' || k.id === 'gesundheit') ? 1 : 0.3;
      pop += (delta / 5) * factor;
    }
  });
  if (schulden === 15)      pop -= 4;
  else if (schulden === 30) pop -= 9;
  else if (schulden === 50) pop -= 16;
  pop = Math.max(0, Math.min(100, Math.round(pop)));
  const popStimmung =
    pop >= 70 ? { label: 'Sehr beliebt',    color: '#166B3A' } :
    pop >= 55 ? { label: 'Stabil',          color: '#1F1D17' } :
    pop >= 35 ? { label: 'Angespannt',      color: '#807A6A' } :
                { label: 'Sauer',           color: '#9B1219' };

  const erfuelltCount  = promises.filter((p) => versprechen[p.id] === 'erfuellt').length;
  const gebrochenCount = promises.length - erfuelltCount;

  return (
    <MissionShell skin={skin} day={day} role={role} step={step + 1} total={3} onClose={onClose}>
      {step === 0 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Du hast die Wahl gewonnen"
            title="Erster Haushalt als Kanzler:in."
            sub={promises.length > 0
              ? `Du hast ${promises.length} Wahlversprechen gemacht. Jetzt zählt's: einlösen kostet Geld, brechen kostet Popularität.`
              : 'Du hast keine konkreten Versprechen gemacht. Trotzdem: 490 Mrd € müssen verteilt werden.'}/>

          <div style={{
            marginTop: 16, background: skin.surface, border: skin.surfaceBorder,
            borderRadius: 16, padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#1F1D17',
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10,
            }}>So funktioniert's</div>
            {[
              { t: 'Versprechen einlösen',
                d: 'Kostet dich Milliarden — aber das Volk findet das gut. Pro Versprechen rechnen wir die Mehrausgabe automatisch auf das richtige Ressort.' },
              { t: 'Versprechen brechen',
                d: 'Spart Geld — kostet dich aber heftig Popularität. Brichst du zu viel, regiert nächstes Mal jemand anderes.' },
              { t: 'Kürzen & Schulden',
                d: 'Du kannst überall kürzen — aber das Volk wird sauer, besonders bei Soziales. Schulden machen ist möglich, kostet aber auch Popularität.' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: '#1F1D17', color: '#FBF6E9',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 11,
                  marginTop: 1,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{row.t}</div>
                  <div style={{ fontSize: 11.5, color: skin.textDim, lineHeight: 1.4, marginTop: 2 }}>{row.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 12 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setStep(1)}>
            Haushalt aufstellen
          </PressButton>
        </>
      )}

      {step === 1 && (
        <>
          {/* Popularitäts-Streifen */}
          <div style={{
            background: '#FFFFFF', borderRadius: 14, boxShadow: '0 0 0 1.5px #F0EADB',
            padding: '10px 12px', marginBottom: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                textTransform: 'uppercase', color: '#807A6A',
              }}>Popularität · Volks-Stimmung</div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace', fontWeight: 800,
                fontSize: 14, color: popStimmung.color,
              }}>{pop} <span style={{ fontSize: 10, opacity: .55 }}>/ 100</span></div>
            </div>
            <div style={{
              height: 8, background: '#F0EADB', borderRadius: 4, overflow: 'hidden',
            }}>
              <div style={{
                width: `${pop}%`, height: '100%',
                background: popStimmung.color, transition: 'width .25s',
              }}/>
            </div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: popStimmung.color,
              marginTop: 5,
            }}>{popStimmung.label}</div>
          </div>

          <HaushaltDonut planned={planned} total={ausgabenTotal} saldo={saldo}/>

          {/* Wahlversprechen — einlösen oder brechen */}
          {promises.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#807A6A',
                letterSpacing: '.1em', textTransform: 'uppercase',
                marginTop: 12, marginBottom: 8,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Deine Wahlversprechen</span>
                <span style={{ color: gebrochenCount > 0 ? '#9B1219' : '#166B3A' }}>
                  {erfuelltCount}/{promises.length} einlösen
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {promises.map((p) => {
                  const erfuellt = versprechen[p.id] === 'erfuellt';
                  const kat = HAUSHALT_KATEGORIEN.find((k) => k.id === p.kat);
                  return (
                    <div key={p.id} style={{
                      padding: '10px 12px', background: '#FFFFFF',
                      borderRadius: 12, boxShadow: '0 0 0 1.5px #F0EADB',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 13, lineHeight: 1.2,
                          textDecoration: erfuellt ? 'none' : 'line-through',
                          opacity: erfuellt ? 1 : .55,
                        }}>{p.label}</div>
                        <div style={{
                          fontSize: 10.5, color: '#807A6A', marginTop: 2,
                          fontFamily: '"JetBrains Mono", monospace',
                        }}>{kat?.label} · {p.cost === 0 ? 'gratis' : `+${p.cost} Mrd`}</div>
                      </div>
                      <button onClick={() => togglePromise(p.id)}
                        style={{
                          padding: '6px 10px', border: 0, borderRadius: 999,
                          fontFamily: 'inherit', fontWeight: 800, fontSize: 11,
                          background: erfuellt ? '#1F1D17' : '#FCE0DF',
                          color: erfuellt ? '#FBF6E9' : '#9B1219',
                          cursor: 'pointer', flexShrink: 0,
                        }}>{erfuellt ? 'Einlösen' : 'Gebrochen'}</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Categories — chunky stepper rows */}
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#807A6A',
            letterSpacing: '.1em', textTransform: 'uppercase',
            marginTop: 14, marginBottom: 8,
          }}>Ressorts · Du kannst noch anpassen</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {planned.map((k) => (
              <HaushaltRow key={k.id} kat={k} value={k.neu}
                onChange={(v) => setKat(k.id, v)}/>
            ))}

            {/* Locked "Zinsen & Verwaltung" block */}
            <div style={{
              padding: '12px 14px', background: '#F0EADB',
              borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 10, alignSelf: 'stretch', borderRadius: 4,
                background: HAUSHALT_FESTBLOCK.color, flexShrink: 0,
                boxShadow: 'inset 0 0 0 1px #C9C2AE',
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 800, fontSize: 14, lineHeight: 1.15,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {HAUSHALT_FESTBLOCK.label}
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: '.12em',
                    background: '#D81E26', color: '#fff', padding: '2px 5px',
                    borderRadius: 4, textTransform: 'uppercase',
                  }}>fest</span>
                </div>
                <div style={{ fontSize: 11, color: '#807A6A', marginTop: 2, lineHeight: 1.3 }}>
                  {HAUSHALT_FESTBLOCK.desc}
                </div>
              </div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 800, fontSize: 18, color: '#1F1D17',
              }}>{HAUSHALT_FESTBLOCK.betrag}<span style={{ fontSize: 10, marginLeft: 2, opacity: .55 }}>Mrd</span></div>
            </div>
          </div>

          {/* Schulden — 4 preset chips */}
          <div style={{ height: 16 }}/>
          <div style={{
            background: '#1F1D17', color: '#FBF6E9',
            borderRadius: 16, padding: '14px 14px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: '#F6C414',
                textTransform: 'uppercase', letterSpacing: '.08em',
              }}>Neue Schulden aufnehmen?</div>
              {saldo < 0 && schulden < 50 && (
                <div style={{
                  fontSize: 10, fontWeight: 800, color: '#FCE0DF',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>{-saldo} Mrd fehlen</div>
              )}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            }}>
              {SCHULDEN_OPTIONEN.map((opt) => {
                const on = schulden === opt.v;
                return (
                  <button key={opt.v} onClick={() => setSchulden(opt.v)}
                    style={{
                      padding: '10px 10px', borderRadius: 12, border: 0,
                      background: on ? '#FBF6E9' : 'rgba(251,246,233,.07)',
                      color: on ? '#1F1D17' : '#FBF6E9',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      boxShadow: on ? 'inset 0 -3px 0 rgba(0,0,0,.15)' : '0 0 0 1.5px rgba(251,246,233,.12)',
                    }}>
                    <div style={{
                      fontWeight: 800, fontSize: 14,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>{opt.label}</div>
                    <div style={{
                      fontSize: 10, marginTop: 3, opacity: on ? .85 : .65,
                      lineHeight: 1.25,
                    }}>{opt.zone === 'kein' ? 'Schuldenbremse hält' :
                        opt.zone === 'umgangen' ? 'Knapp drüber' :
                        opt.zone === 'sondervermoegen' ? 'Sondervermögen' :
                                                  'Notlage nötig'}</div>
                  </button>
                );
              })}
            </div>
            <div style={{
              marginTop: 10, fontSize: 11, lineHeight: 1.4,
              color: 'rgba(251,246,233,.7)',
            }}>{schuldenObj.hint}</div>
            <div style={{
              marginTop: 6, fontSize: 10.5, fontWeight: 700, color: '#FCE0DF',
              lineHeight: 1.35,
            }}>⚠ Schulden musst du zurückzahlen — Zinsen fressen nächstes Jahr Bildung & Investitionen. Und das Volk findet's auch nicht toll.</div>
          </div>

          <div style={{ height: 14 }}/>
          <PressButton variant="primary" size="lg" full
            disabled={saldo < 0}
            onClick={() => setStep(2)}>
            {saldo < 0 ? `Haushalt geht nicht auf · ${-saldo} Mrd fehlen` : 'Haushalt einreichen'}
          </PressButton>
        </>
      )}

      {step === 2 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Auswertung · Erster Haushalt"
            title={pop >= 55 ? 'Das Volk steht hinter dir.' : 'Das Volk knurrt.'}
            sub={`Popularität ${pop}/100 · ${erfuelltCount}/${promises.length || 0} Versprechen eingelöst · Haushalt ${saldo >= 0 ? 'ausgeglichen' : `−${-saldo} Mrd`}`}/>

          <div style={{
            marginTop: 14, background: '#1F1D17', color: '#FBF6E9',
            borderRadius: 16, padding: '16px 16px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#F6C414',
              textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
            }}>Bilanz</div>

            {promises.filter((p) => versprechen[p.id] === 'erfuellt').map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0',
                borderTop: i === 0 ? 0 : '1px solid rgba(251,246,233,.08)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, background: '#FBF6E9', color: '#1F1D17',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontWeight: 800, fontSize: 11,
                }}>✓</div>
                <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{p.label}</div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 800,
                  fontSize: 12, color: '#F6C414',
                }}>+{p.cost} Mrd</div>
              </div>
            ))}
            {promises.filter((p) => versprechen[p.id] === 'gebrochen').map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0',
                borderTop: '1px solid rgba(251,246,233,.08)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, background: '#D81E26', color: '#fff',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontWeight: 800, fontSize: 11,
                }}>✗</div>
                <div style={{
                  flex: 1, fontSize: 12.5, fontWeight: 600,
                  textDecoration: 'line-through', opacity: .55,
                }}>{p.label}</div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 800,
                  fontSize: 12, color: '#FCE0DF',
                }}>gebrochen</div>
              </div>
            ))}
            {schulden > 0 && (
              <div style={{
                marginTop: 8, paddingTop: 8,
                borderTop: '1px solid rgba(251,246,233,.15)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: '#F6C414', color: '#1F1D17',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontWeight: 800, fontSize: 11,
                }}>€</div>
                <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>
                  Neue Schulden aufgenommen
                </div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 800,
                  fontSize: 12, color: '#F6C414',
                }}>+{schulden} Mrd</div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 12 }}/>
          <PressButton variant="success" size="lg" full onClick={() => {
            const balance = saldo >= 0 ? 1 : Math.max(0, 1 - (-saldo / 30));
            const popScore = pop / 100;
            const score = balance * 0.4 + popScore * 0.6;
            recordMission('haushalt', score, {
              werte, schulden, versprechen, popularitaet: pop, saldo,
            });
            onDone(70);
          }}>
            Haushalt beschließen · +70 XP
          </PressButton>
        </>
      )}
    </MissionShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// MISSION 9 · Social-Media-Strategie — Plattform-Mix + Tonalität
// ────────────────────────────────────────────────────────────────────
export function MissionSocial({ skin: skinName = "clean", day, role, onClose, onDone }: MissionProps) {
  const skin = skinTokens(skinName);
  const [step, setStep] = React.useState(0); // 0 intro, 1 plattform, 2 ton, 3 review
  const [plats, setPlats] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState<string | null>(null);

  const togglePlat = (id: string) => {
    if (plats.includes(id)) setPlats(plats.filter((x) => x !== id));
    else if (plats.length < 3) setPlats([...plats, id]);
  };
  const reach = plats.reduce((s, id) => s + (PLATTFORMEN.find((p) => p.id === id)?.reach || 0), 0);
  const risk  = plats.length ? plats.reduce((s, id) => s + (PLATTFORMEN.find((p) => p.id === id)?.risk || 0), 0) / plats.length : 0;
  const toneObj = SOCIAL_TONALITAET.find((t) => t.id === tone);
  const viralScore = (reach / 2.4) * (toneObj?.mod || 1) - risk * 0.2;

  return (
    <MissionShell skin={skin} day={day} role={role} step={step + 1} total={4} onClose={onClose}>
      {step === 0 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Bildungs-Modul · Social Media"
            title="Wahlkampf ist heute Social-Media-Kampf."
            sub="Jede:r Spitzenkandidat:in hat heute eine Plattform-Strategie — und Gen Z entscheidet mit."/>
          <div style={{
            marginTop: 14, background: skin.surface, border: skin.surfaceBorder,
            borderRadius: 16, padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#D81E26',
              letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>📲 Was du wissen solltest</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: skin.text }}>
              Du wählst gleich <b>bis zu 3 Plattformen</b> + eine <b>Tonalität</b>. TikTok = viel Reichweite bei Jungen, aber Sturzgefahr. X = klein, aber Politik-Multiplikator. Falscher Ton = Shitstorm.
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant="primary" size="lg" full onClick={() => setStep(1)}>
            Plattformen wählen
          </PressButton>
        </>
      )}

      {step === 1 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Schritt 1 · Plattform-Mix"
            title="Wo bist du aktiv?"
            sub="Wähle bis zu 3. Reach = wie viele du erreichst. Risiko = wie schnell ein Posting falsch ankommt."/>
          <div style={{
            marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {PLATTFORMEN.map((p) => {
              const on = plats.includes(p.id);
              const disabled = !on && plats.length >= 3;
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} disabled={disabled}
                  style={{
                    padding: '10px 12px', border: 0, borderRadius: 12,
                    background: on ? '#1F1D17' : skin.surface,
                    color: on ? '#F6C414' : skin.text,
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? .4 : 1,
                    boxShadow: on ? 'inset 0 -3px 0 #000000' : '0 0 0 1.5px ' + skin.divider,
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <div style={{ fontSize: 22, width: 28, textAlign: 'center', flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 11, opacity: .7, marginTop: 1 }}>{p.target}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 72 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 800, color: on ? '#F6C414' : skin.textDim,
                      fontFamily: '"JetBrains Mono", monospace',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>Reach</span><span>{Math.round(p.reach * 100)}</span>
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 800, color: on ? '#D81E26' : skin.textDim,
                      fontFamily: '"JetBrains Mono", monospace',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>Risiko</span><span>{Math.round(p.risk * 100)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ height: 12 }}/>
          <PressButton
            variant={plats.length > 0 ? 'primary' : 'ghost'}
            size="lg" full
            disabled={plats.length === 0}
            onClick={() => setStep(2)}>
            Weiter ({plats.length} Plattform{plats.length === 1 ? '' : 'en'})
          </PressButton>
        </>
      )}

      {step === 2 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Schritt 2 · Tonalität"
            title="Wie postest du?"
            sub="Tonalität bestimmt, wer dich liked und wer dich blockt."/>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SOCIAL_TONALITAET.map((t) => {
              const on = tone === t.id;
              return (
                <button key={t.id} onClick={() => setTone(t.id)}
                  style={{
                    padding: '14px 16px', border: 0, borderRadius: 14,
                    background: on ? '#1F1D17' : skin.surface,
                    color: on ? '#F6C414' : skin.text,
                    cursor: 'pointer',
                    boxShadow: on ? 'inset 0 -3px 0 #000000' : '0 0 0 1.5px ' + skin.divider,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{t.label}</div>
                  <div style={{ fontSize: 12, opacity: .75, marginTop: 3, lineHeight: 1.35 }}>{t.desc}</div>
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant={tone ? 'primary' : 'ghost'} disabled={!tone} size="lg" full
            onClick={() => setStep(3)}>
            Weiter
          </PressButton>
        </>
      )}

      {step === 3 && (
        <>
          <MissionHeadline skin={skin}
            kicker="Auswertung"
            title={`Viral-Score: ${Math.round(Math.max(0, Math.min(1, viralScore)) * 100)}`}
            sub={viralScore > 0.7 ? 'Stark — deine Postings reichen weit.' :
                 viralScore > 0.4 ? 'Solide. Du erreichst dein Publikum.' :
                                    'Schwach — wenig Reichweite oder hohes Risiko.'}/>
          <div style={{
            marginTop: 14, background: '#1F1D17', color: '#FBF6E9',
            borderRadius: 16, padding: '16px 16px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'rgba(251,246,233,.55)', marginBottom: 8,
            }}>Dein Setup</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {plats.map((id) => {
                const p = PLATTFORMEN.find((x) => x.id === id);
                return (
                  <div key={id} style={{
                    background: '#F6C414', color: '#1F1D17',
                    padding: '4px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>{p?.emoji} {p?.label}</div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(251,246,233,.7)' }}>
              Tonalität: <b style={{ color: '#FBF6E9' }}>{toneObj?.label}</b>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <PressButton variant="success" size="lg" full onClick={() => {
            const score = Math.max(0, Math.min(1, viralScore));
            recordMission('social', score, { plats, tone });
            onDone(55);
          }}>
            Strategie festlegen · +55 XP
          </PressButton>
        </>
      )}
    </MissionShell>
  );
}
