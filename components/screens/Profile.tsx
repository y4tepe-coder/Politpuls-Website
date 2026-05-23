'use client';

// Profile screen — clean, strict palette: only black, white, red, gold.
// Honest progress from the store, not hard-coded fake numbers.

import React from "react";
import type { Skin, Progress } from "@/lib/types";
import type { SkinTokens } from "@/lib/tokens";
import { skinTokens } from "@/lib/tokens";
import { loadProgress, loadSession, PQ_EVENTS } from "@/lib/storage";
import { useGameSync } from "@/lib/hooks";
import { Bundesadler } from "@/components/Mascot";
import { Icons } from "@/components/ui";

interface BadgeData {
  id: string;
  title: string;
  sub: string;
  unlocked: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  kandidat: 'Bundestags-Kandidat:in',
  kanzler: 'Bundeskanzler:in',
  minister: 'Minister:in',
  opposition: 'Opposition',
};

export default function Profile({
  skin: skinName = "clean",
  onRestartOnboarding,
  onOpenAuth,
}: {
  skin?: Skin;
  onRestartOnboarding: () => void;
  onOpenAuth: () => void;
}) {
  useGameSync([PQ_EVENTS.progress]);
  const skin = skinTokens(skinName);
  const isDark = skinName === 'dark';

  // Honest values from progress + session
  const progress = loadProgress();
  const session = loadSession();
  const name = session?.profile?.name || 'Du';
  const roleLabel = ROLE_LABELS[session?.profile?.role || 'kandidat'] || 'Kandidat:in';

  const completedCount = progress.completedDays.length;

  // Badge progression — strict palette: gold (achieved), white/black outline (locked)
  const badges: BadgeData[] = [
    { id: 'sworn',  title: 'Vereidigt',        sub: 'Tag 1 schaffen',         unlocked: progress.completedDays.includes(1) },
    { id: 's3',     title: '3-Tage-Streak',    sub: '3 Tage am Stück',        unlocked: progress.streak >= 3 },
    { id: 's7',     title: 'Woche durch',      sub: '7 Tage am Stück',        unlocked: progress.streak >= 7 },
    { id: 's30',    title: 'Marathon',         sub: '30 Tage am Stück',       unlocked: progress.streak >= 30 },
    { id: 'd10',    title: '10 Entscheidungen', sub: 'Stand halten',          unlocked: completedCount >= 10 },
    { id: 'd100',   title: '100 Tage Kanzler:in', sub: 'Volle Amtszeit',      unlocked: completedCount >= 100 },
  ];

  return (
    <div style={{ minHeight: '100%', background: skin.bg, color: skin.text, paddingBottom: 100 }}>
      {/* === Top: clean black hero (or white in dark skin) === */}
      <ProfileHero skin={skin} isDark={isDark} name={name} roleLabel={roleLabel} progress={progress}/>

      {/* === Three honest stat tiles === */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatTile skin={skin} value={progress.streak} label="Tage Streak" accent="red"/>
          <StatTile skin={skin} value={progress.xp} label="XP gesamt" accent="gold"/>
          <StatTile skin={skin} value={progress.currentDay} label="Aktueller Tag" accent="ink"/>
        </div>
      </div>

      {/* === Streak strip — pure black/gold/red === */}
      <div style={{ padding: '20px 16px 0' }}>
        <BlockLabel skin={skin}>Letzte 14 Tage</BlockLabel>
        <StreakStrip skin={skin} progress={progress}/>
      </div>

      {/* === Badges — gold for unlocked, hairline outline for locked === */}
      <div style={{ padding: '20px 16px 0' }}>
        <BlockLabel skin={skin}
          right={<span style={{ fontSize: 11, color: skin.textDim }}>
            {badges.filter(b => b.unlocked).length} / {badges.length}
          </span>}>
          Abzeichen
        </BlockLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {badges.map(b => <Badge key={b.id} skin={skin} badge={b}/>)}
        </div>
      </div>

      {/* === Settings list === */}
      <div style={{ padding: '20px 16px 0' }}>
        <BlockLabel skin={skin}>Einstellungen</BlockLabel>
        <div style={{
          background: skin.surface, border: skin.surfaceBorder, borderRadius: 14,
          overflow: 'hidden',
        }}>
          <SettingRow skin={skin} label="Erinnerung" right="18:00"/>
          <SettingRow skin={skin} label="Schwierigkeit" right="Standard"/>
          <SettingRow skin={skin} label="Sprache" right="Deutsch"/>
          <SettingRow skin={skin} label="Konto" right={session?.user?.provider === 'apple' ? '·· @icloud.com' : 'E-Mail'} onClick={onOpenAuth}/>
          <SettingRow skin={skin} label="Rolle neu wählen" right={roleLabel} onClick={onRestartOnboarding} last/>
        </div>
        <div style={{
          marginTop: 12, fontSize: 10, color: skin.textDim, textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.04em',
        }}>Politpuls · v0.6 · Tag {progress.currentDay} / 100</div>
      </div>
    </div>
  );
}

// ─── Hero block ────────────────────────────────────────────────────
function ProfileHero({
  skin,
  isDark,
  name,
  roleLabel,
  progress,
}: {
  skin: SkinTokens;
  isDark: boolean;
  name: string;
  roleLabel: string;
  progress: Progress;
}) {
  void skin;
  // Bold mono-tone block: black on light skins, white on dark skin.
  const blockBg = isDark ? '#FFFFFF' : '#000000';
  const blockFg = isDark ? '#000000' : '#FFFFFF';

  return (
    <div style={{
      margin: '4px 16px 0', background: blockBg, color: blockFg,
      borderRadius: 18, padding: '18px 18px 16px', position: 'relative',
      overflow: 'hidden',
    }}>
      {/* thin gold rule */}
      <div style={{
        position: 'absolute', left: 18, right: 18, top: 12,
        height: 2, background: '#F6C414', borderRadius: 1,
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: '#F6C414',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: 'inset 0 -3px 0 #C48A05',
        }}>
          <Bundesadler variant="bold" size={56}/>
        </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#F6C414',
              textTransform: 'uppercase', letterSpacing: '.12em',
            }}>{roleLabel}</div>
            <div className="pq-display-tight" style={{
              fontSize: 26, fontWeight: 800, marginTop: 2, lineHeight: 1,
              letterSpacing: '-.01em',
            }}>{name}</div>
            <div style={{
              fontSize: 12, color: blockFg === '#FFFFFF' ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)',
              marginTop: 4,
              fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.04em',
            }}>Tag {progress.currentDay} / 100</div>
          </div>
      </div>
    </div>
  );
}

// ─── Stat tiles ────────────────────────────────────────────────────
function StatTile({
  skin,
  value,
  label,
  accent,
}: {
  skin: SkinTokens;
  value: number;
  label: string;
  accent: 'red' | 'gold' | 'ink';
}) {
  const dim = value === 0;
  const accentColor =
    accent === 'red'  ? (dim ? skin.textDim : '#D81E26') :
    accent === 'gold' ? (dim ? skin.textDim : '#C48A05') :
                         (dim ? skin.textDim : skin.text);
  return (
    <div style={{
      background: skin.surface, border: skin.surfaceBorder, borderRadius: 14,
      padding: '14px 12px', textAlign: 'center',
    }}>
      <div className="pq-display-tight" style={{
        fontSize: 28, fontWeight: 800, color: accentColor,
        fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-.02em',
        lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 10, color: skin.textDim, marginTop: 6,
        textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700,
      }}>{label}</div>
    </div>
  );
}

// ─── Streak strip ──────────────────────────────────────────────────
function StreakStrip({ skin, progress }: { skin: SkinTokens; progress: Progress }) {
  // Honest day-1 empty state: when nothing's done yet, show a single explanatory
  // tile instead of 14 mostly-grey numbered boxes that look like data slop.
  if (progress.completedDays.length === 0) {
    return (
      <div style={{
        background: skin.surface, border: skin.surfaceBorder, borderRadius: 14,
        padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#F6C414',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: 'inset 0 -3px 0 #C48A05',
        }}>
          {Icons.flame('#000000')}
        </div>
        <div style={{ flex: 1 }}>
          <div className="pq-display-tight" style={{
            fontSize: 16, fontWeight: 800, color: skin.text, lineHeight: 1.1,
          }}>Noch keine Streak</div>
          <div style={{ fontSize: 12, color: skin.textMuted, marginTop: 4, lineHeight: 1.35 }}>
            Schließ heute deine erste Mission ab — jeder weitere Tag baut die Reihe auf.
          </div>
        </div>
      </div>
    );
  }
  // Show the most recent 14 days centered around currentDay.
  const start = Math.max(1, progress.currentDay - 13);
  const days  = Array.from({ length: 14 }, (_, i) => start + i);
  return (
    <div style={{
      background: skin.surface, border: skin.surfaceBorder, borderRadius: 14,
      padding: '12px 12px 14px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4 }}>
        {days.map(d => {
          const done = progress.completedDays.includes(d);
          const today = d === progress.currentDay;
          const future = d > progress.currentDay;
          let bg = skin.tagBg, fg = skin.textDim, ring = 'none';
          if (done)   { bg = '#F6C414'; fg = '#000'; ring = 'inset 0 -2px 0 #C48A05'; }
          if (today)  { bg = '#000';    fg = '#F6C414'; ring = 'inset 0 -2px 0 #1a1a1a'; }
          if (future) { bg = skin.tagBg; fg = skin.textDim; }
          return (
            <div key={d} style={{
              aspectRatio: '1', borderRadius: 6, background: bg, color: fg,
              display: 'grid', placeItems: 'center',
              fontSize: 9, fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              boxShadow: ring === 'none' ? undefined : ring,
            }}>{d}</div>
          );
        })}
      </div>
      <div style={{
        marginTop: 10, display: 'flex', gap: 12, fontSize: 10,
        color: skin.textDim, fontWeight: 700, letterSpacing: '.04em',
      }}>
        <LegendDot color="#F6C414" label="ERLEDIGT"/>
        <LegendDot color="#000000" label="HEUTE"/>
        <LegendDot color={skin.tagBg} label="OFFEN" outlined/>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  outlined,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: 2, background: color,
        border: outlined ? '1px solid rgba(0,0,0,.2)' : 0,
      }}/>
      <span>{label}</span>
    </div>
  );
}

// ─── Badge — only gold or black/white outline ────────────────────────
function Badge({ skin, badge }: { skin: SkinTokens; badge: BadgeData }) {
  const on = badge.unlocked;
  return (
    <div style={{
      background: on ? '#F6C414' : skin.surface,
      border: on ? 'none' : skin.surfaceBorder,
      borderRadius: 14, padding: '14px 8px 12px', textAlign: 'center',
      boxShadow: on ? 'inset 0 -3px 0 #C48A05' : undefined,
    }}>
      <div style={{
        width: 36, height: 36, margin: '0 auto', borderRadius: '50%',
        background: on ? '#000000' : skin.tagBg,
        color: on ? '#F6C414' : skin.textDim,
        display: 'grid', placeItems: 'center',
      }}>
        {on
          ? <svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 12 l 5 5 L 20 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : Icons.lock('currentColor')
        }
      </div>
      <div className="pq-display-tight" style={{
        fontSize: 12, fontWeight: 800, marginTop: 8,
        color: on ? '#000' : skin.text, lineHeight: 1.15,
      }}>{badge.title}</div>
      <div style={{
        fontSize: 10, marginTop: 2,
        color: on ? 'rgba(0,0,0,.55)' : skin.textDim,
      }}>{badge.sub}</div>
    </div>
  );
}

// ─── Settings row ──────────────────────────────────────────────────
function SettingRow({
  skin,
  label,
  right,
  onClick,
  last,
}: {
  skin: SkinTokens;
  label: string;
  right: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent', border: 0,
      borderBottom: last ? 0 : `1px solid ${skin.divider}`,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit',
      textAlign: 'left',
    }}>
      <span style={{ flex: 1, fontSize: 14, color: skin.text, fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 13, color: skin.textMuted,
        fontFamily: typeof right === 'string' && right.startsWith('··') ? '"JetBrains Mono", monospace' : 'inherit',
      }}>{right}</span>
      {Icons.chevron('right', skin.textDim)}
    </button>
  );
}

// ─── Small label used above sections ──────────────────────────────
function BlockLabel({
  skin,
  children,
  right,
}: {
  skin: SkinTokens;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 2px 8px',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 800, color: skin.textDim,
        textTransform: 'uppercase', letterSpacing: '.08em',
      }}>{children}</span>
      {right}
    </div>
  );
}
