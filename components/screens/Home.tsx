'use client';

// Home screen — strukturiert um den Monats-Wahlkampf.
//
//   • MONTH_LEN = 30. Wahlen an Tag 1, 31, 61, 91 …
//   • Tag 1   = Wahlkampf-Intensiv: alle 9 Lernschritte an einem Tag,
//               optional, jederzeit pausierbar. Keine Tagesmission.
//   • Tag 29/30/31, 59/60/61, … = 3-Tage-Wahlkampf-Phase parallel zur
//               Tagesmission, je 3 Schritte pro Tag.
//   • Sonstige Tage = klassische Tagesmission (tagespolitisch).
//
// Die Zyklus-Logik (WK_STEPS, wahlkampfFor, …) und die Skin-Tokens liegen
// in der Foundation — hier werden nur die React-Komponenten gerendert.

import React from "react";
import type { Skin } from "@/lib/types";
import type { SkinTokens } from "@/lib/tokens";
import { skinTokens } from "@/lib/tokens";
import type { Profile } from "@/lib/types";
import type { WahlkampfPhase } from "@/lib/types";
import { loadProgress, loadSession, PQ_EVENTS } from "@/lib/storage";
import {
  WK_STEP_BY_ID,
  TOTAL_DAYS,
  electionDayFor,
  wahlkampfFor,
  dailyFor,
  loadWKProgress,
  getStepsDone,
} from "@/lib/wahlkampf";
import { useGameSync } from "@/lib/hooks";
import { Bundesadler, AdlerMark } from "@/components/Mascot";
import { PoliAvatar } from "@/components/PoliAvatar";
import { Icons, FlagStripe } from "@/components/ui";

// ─── Zeit bis nächstes Briefing (16:00) ─────────────────────────────
function timeUntil1600() {
  const now = new Date();
  const target = new Date();
  target.setHours(16, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const ms = target.getTime() - now.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { h, m, total: ms };
}

// ─── Hauptscreen ────────────────────────────────────────────────────
export default function Home({
  skin: skinName = "clean",
  onOpenMission,
  onOpenWahlkampf,
  onOpenPlakat,
}: {
  skin?: Skin;
  onOpenMission: () => void;
  onOpenWahlkampf: () => void;
  onOpenPlakat: () => void;
}) {
  useGameSync([PQ_EVENTS.progress, PQ_EVENTS.wahlkampf, PQ_EVENTS.session]);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const skin = skinTokens(skinName);
  const progress = loadProgress();
  const session = loadSession();
  loadWKProgress();

  const profile = session?.profile || {};
  const todayDay = progress.currentDay;
  const wk = wahlkampfFor(todayDay);
  const daily = dailyFor(todayDay);
  const completed = new Set(progress.completedDays);

  const stepsDoneToday =
    wk.active && wk.stepsToday
      ? wk.stepsToday.filter((id) => getStepsDone(wk.electionDay).includes(id))
      : [];
  const wkDoneToday =
    wk.active && !!wk.stepsToday && stepsDoneToday.length === wk.stepsToday.length;
  const dailyDone = completed.has(todayDay);

  // Mini-Pfad ums Heute herum
  const start = Math.max(1, todayDay - 2);
  const end = Math.min(TOTAL_DAYS, todayDay + 4);
  const window_: number[] = [];
  for (let d = start; d <= end; d++) window_.push(d);

  return (
    <div
      style={{
        minHeight: "100%",
        background: skin.bg,
        color: skin.text,
        paddingBottom: 100,
      }}
    >
      <StatsBar
        skin={skin}
        streak={progress.streak}
        xp={progress.xp}
        day={todayDay}
        profile={profile}
      />

      {/* Wahlkampf-Strip: nur in der Wahlkampf-Phase */}
      {wk.active && (
        <WahlkampfStrip skin={skin} wk={wk} stepsDone={stepsDoneToday.length} />
      )}

      <div style={{ padding: "4px 16px 0" }}>
        {/* TAG 1 INTENSIV: nur die große Wahlkampf-Karte, keine Tagesmission */}
        {wk.intensive && (
          <WahlkampfIntensivHero
            skin={skin}
            wk={wk}
            stepsDone={stepsDoneToday.length}
            profile={profile}
            onOpen={() => onOpenWahlkampf?.()}
          />
        )}

        {/* MONATLICHE WAHLKAMPF-PHASE: zwei Karten (Tagesmission + Wahlkampf-heute) */}
        {wk.active && !wk.intensive && daily && (
          <>
            <TodayHero
              skin={skin}
              day={todayDay}
              daily={daily}
              dailyDone={dailyDone}
              profile={profile}
              onOpen={onOpenMission}
            />
            <div style={{ height: 12 }} />
            <WahlkampfHeuteCard
              skin={skin}
              wk={wk}
              stepsDone={stepsDoneToday.length}
              onOpen={() => onOpenWahlkampf?.()}
            />
          </>
        )}

        {/* NORMALER TAG: nur die Tagesmission */}
        {!wk.active && daily && (
          <TodayHero
            skin={skin}
            day={todayDay}
            daily={daily}
            dailyDone={dailyDone}
            profile={profile}
            onOpen={onOpenMission}
          />
        )}
      </div>

      {/* Wahl-Countdown an normalen Tagen */}
      {!wk.active && <NextElectionBanner skin={skin} todayDay={todayDay} />}

      {(dailyDone || (wk.intensive && wkDoneToday)) && (
        <NextBriefing skin={skin} key={tick} />
      )}

      {/* Mini-Pfad */}
      <div style={{ padding: "20px 0 0", position: "relative" }}>
        {window_.map((d, i) => {
          const dwk = wahlkampfFor(d);
          const isDoneDay = completed.has(d);
          const isToday = d === todayDay;
          const isLocked = d > todayDay;
          const state = isDoneDay
            ? "done"
            : isToday
              ? "today"
              : isLocked
                ? "locked"
                : "next";
          // Label: Wahlkampf-Tag oder Tagesmission
          let label: string;
          let k: string;
          if (dwk.active && dwk.stepsToday) {
            const stepId = dwk.stepsToday[0];
            label = dwk.intensive
              ? "Wahlkampf · 9 Schritte"
              : WK_STEP_BY_ID[stepId].label;
            k = WK_STEP_BY_ID[stepId].k;
          } else {
            const dl = dailyFor(d) || { k: "briefing", label: "Tagesmission" };
            label = dl.label;
            k = dl.k;
          }
          return (
            <PathNode
              key={d}
              skin={skin}
              item={{
                day: d,
                label,
                k,
                isWahlkampf: dwk.active,
                isElection:
                  d === dwk.electionDay && dwk.active && !dwk.intensive,
              }}
              index={i}
              state={state}
              onClick={
                isToday
                  ? dwk.active
                    ? onOpenWahlkampf
                    : onOpenMission
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Strip oben: Wahlkampf-Phase anzeigen ──────────────────────────
function WahlkampfStrip({
  skin,
  wk,
  stepsDone,
}: {
  skin: SkinTokens;
  wk: WahlkampfPhase;
  stepsDone: number;
}) {
  const total = wk.stepsToday?.length || 0;
  return (
    <div style={{ padding: "4px 16px 6px" }}>
      <div
        style={{
          background: "#D81E26",
          color: "#FFFFFF",
          borderRadius: 14,
          padding: "10px 14px",
          boxShadow: "inset 0 -3px 0 #9B1219",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            {wk.intensive
              ? "Wahlkampf "
              : `Wahlkampf-Phase · Tag ${wk.dayInPhase}/${wk.totalPhaseDays}`}
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {stepsDone}/{total}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: i < stepsDone ? "#F6C414" : "rgba(255,255,255,.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero für Tag 1 Intensiv ──────────────────────────────────────
function WahlkampfIntensivHero({
  skin,
  wk,
  stepsDone,
  profile,
  onOpen,
}: {
  skin: SkinTokens;
  wk: WahlkampfPhase;
  stepsDone: number;
  profile: Profile;
  onOpen: () => void;
}) {
  const total = wk.stepsToday?.length || 0;
  const allDone = stepsDone === total;
  const showAvatar = !!profile?.character;
  const nextStepId = wk.stepsToday?.find(
    (id) => !getStepsDone(wk.electionDay).includes(id),
  );

  return (
    <button
      onClick={allDone ? undefined : onOpen}
      style={{
        width: "100%",
        padding: 0,
        border: 0,
        cursor: allDone ? "default" : "pointer",
        background: skin.heroBg,
        color: skin.heroFg,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow:
          "0 12px 32px -16px rgba(20,19,15,.25), inset 0 -4px 0 rgba(0,0,0,.18)",
        animation: "pq-rise .5s ease-out",
      }}
    >
      <FlagStripe height={3} animated />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 18px 18px 20px",
          minHeight: 160,
          position: "relative",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 9px",
              borderRadius: 6,
              background: "#D81E26",
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#FFFFFF",
              }}
            />
            Wahlkampf-Intensiv · Schritt {Math.min(stepsDone + 1, total)}/{total}
          </div>

          <div
            className="pq-display-tight"
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginTop: 10,
              lineHeight: 1.02,
              letterSpacing: "-.02em",
              color: skin.heroFg,
            }}
          >
            {allDone
              ? "Wahlkampf abgeschlossen"
              : nextStepId
                ? WK_STEP_BY_ID[nextStepId]?.label || "Wahlkampf"
                : "Wahlkampf"}
          </div>

          {!allDone && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(251,246,233,.6)",
                marginTop: 4,
                lineHeight: 1.35,
              }}
            >
              {nextStepId ? WK_STEP_BY_ID[nextStepId]?.desc : ""} · ~ 2 Min
            </div>
          )}
          {allDone && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(251,246,233,.65)",
                marginTop: 6,
                lineHeight: 1.35,
              }}
            >
              Du kennst jetzt einen Spitzenkandidaten-Wahlkampf von innen.
            </div>
          )}

          {/* schlichte Fortschritts-Leiste, keine Schritt-Labels */}
          <div
            style={{
              marginTop: 12,
              height: 4,
              borderRadius: 999,
              background: "rgba(251,246,233,.15)",
              overflow: "hidden",
              maxWidth: 220,
            }}
          >
            <div
              style={{
                width: `${(stepsDone / total) * 100}%`,
                height: "100%",
                background: "#F6C414",
                transition: "width .4s cubic-bezier(.3,.7,.4,1)",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 999,
              background: allDone ? "rgba(46,159,93,.18)" : "#F6C414",
              color: allDone ? "#5DD08A" : "#1F1D17",
              boxShadow: allDone ? "none" : "inset 0 -3px 0 #C48A05",
              fontWeight: 800,
              letterSpacing: ".04em",
              fontSize: 13,
              border: allDone ? "1px solid rgba(93,208,138,.3)" : "none",
            }}
          >
            {allDone
              ? "✓ 9/9 geschafft"
              : stepsDone === 0
                ? "Jetzt starten"
                : "Weiter"}
            {!allDone && Icons.chevron("right", "#1F1D17")}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            width: 110,
            height: 110,
            animation: "pq-bob 3s ease-in-out infinite",
            transformOrigin: "center bottom",
            pointerEvents: "none",
          }}
        >
          {showAvatar && profile.character ? (
            <PoliAvatar character={profile.character} size={110} />
          ) : (
            <Bundesadler size={110} variant="bold" mood="happy" winking={allDone} />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Kleine Wahlkampf-heute-Karte für Tag 29/30/31 ─────────────────
function WahlkampfHeuteCard({
  skin,
  wk,
  stepsDone,
  onOpen,
}: {
  skin: SkinTokens;
  wk: WahlkampfPhase;
  stepsDone: number;
  onOpen: () => void;
}) {
  const total = wk.stepsToday?.length || 0;
  const allDone = stepsDone === total;
  const nextStepId = wk.stepsToday?.find(
    (id) => !getStepsDone(wk.electionDay).includes(id),
  );
  return (
    <button
      onClick={allDone ? undefined : onOpen}
      className="pq-press"
      style={{
        width: "100%",
        padding: 0,
        border: 0,
        cursor: allDone ? "default" : "pointer",
        background: "#FFFFFF",
        color: "#000",
        borderRadius: 14,
        overflow: "hidden",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow: `0 0 0 1.5px ${skin.divider}`,
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ width: 6, background: "#D81E26" }} />
        <div
          style={{
            flex: 1,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#F6C414",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "inset 0 -2px 0 #C48A05",
              fontSize: 18,
            }}
          >
            🗳️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#D81E26",
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              Wahlkampf · Tag {wk.dayInPhase}/{wk.totalPhaseDays} · {stepsDone}/
              {total}
            </div>
            <div
              className="pq-display-tight"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#000",
                marginTop: 2,
                lineHeight: 1.15,
              }}
            >
              {allDone
                ? "Heute fertig — gut gemacht."
                : nextStepId
                  ? WK_STEP_BY_ID[nextStepId]?.label || "Wahlkampf"
                  : "Wahlkampf"}
            </div>
            {!allDone && (
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(0,0,0,.55)",
                  marginTop: 2,
                }}
              >
                {nextStepId ? WK_STEP_BY_ID[nextStepId]?.desc : ""}
              </div>
            )}
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#000",
              color: "#F6C414",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {Icons.chevron("right", "#F6C414")}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Banner: Nächste Wahl in X Tagen (an normalen Tagen) ──────────
function NextElectionBanner({
  skin,
  todayDay,
}: {
  skin: SkinTokens;
  todayDay: number;
}) {
  const eDay = electionDayFor(todayDay);
  const daysOut = eDay - todayDay;
  const phaseStartsIn = Math.max(0, daysOut - 2);
  if (daysOut <= 0) return null;
  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: skin.surface,
          border: skin.surfaceBorder,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: skin.tagBg,
            color: "#D81E26",
            display: "grid",
            placeItems: "center",
            fontSize: 16,
          }}
        >
          🗳️
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: skin.textDim,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Monats-Wahlkampf
          </div>
          <div
            className="pq-display-tight"
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: skin.text,
              marginTop: 1,
              lineHeight: 1.15,
            }}
          >
            {phaseStartsIn === 0
              ? `Wahlkampf-Phase läuft · Wahl in ${daysOut} Tagen`
              : `Wahl in ${daysOut} Tagen`}
          </div>
          <div
            style={{
              fontSize: 11,
              color: skin.textDim,
              marginTop: 2,
            }}
          >
            {phaseStartsIn === 0
              ? "Tag 1 der Phase aktiv."
              : `Wahlkampf-Phase (3 Tage) startet in ${phaseStartsIn} Tag${
                  phaseStartsIn === 1 ? "" : "en"
                }.`}
          </div>
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            fontWeight: 700,
            color: skin.text,
            background: skin.tagBg,
            padding: "5px 9px",
            borderRadius: 8,
            textAlign: "center",
            minWidth: 56,
          }}
        >
          T-{daysOut}
        </div>
      </div>
    </div>
  );
}

// ─── Stats-Bar ─────────────────────────────────────────────────────
function StatsBar({
  skin,
  streak,
  xp,
  day,
  profile,
}: {
  skin: SkinTokens;
  streak: number;
  xp: number;
  day: number;
  profile: Profile;
}) {
  const showAvatar = !!profile?.character;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showAvatar && profile.character ? (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#F6C414",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "inset 0 -2px 0 #C48A05",
            }}
          >
            <PoliAvatar character={profile.character} size={34} />
          </div>
        ) : (
          <AdlerMark size={26} color={skin.heroAccent} />
        )}
        <div
          className="pq-display-tight"
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: skin.text,
            letterSpacing: "-.01em",
          }}
        >
          Polit<span style={{ color: skin.heroAccent }}>puls</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <PillStat
          skin={skin}
          icon={Icons.flame(streak > 0 ? "#D81E26" : skin.textDim)}
          value={streak}
          color={streak > 0 ? "#D81E26" : skin.textDim}
        />
        <PillStat
          skin={skin}
          icon={Icons.bolt(xp > 0 ? "#C48A05" : skin.textDim)}
          value={xp}
          color={xp > 0 ? "#C48A05" : skin.textDim}
        />
      </div>
    </div>
  );
}

function PillStat({
  skin,
  icon,
  value,
  color,
}: {
  skin: SkinTokens;
  icon: React.ReactNode;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        background: skin.tagBg,
        color,
        borderRadius: 999,
        fontWeight: 800,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
      }}
    >
      <span style={{ display: "inline-flex" }}>{icon}</span>
      {value}
    </div>
  );
}

// ─── Today Hero (Tagesmission, an normalen + Wahlkampf-Tagen 29-31) ─
function TodayHero({
  skin,
  day,
  daily,
  dailyDone,
  profile,
  onOpen,
}: {
  skin: SkinTokens;
  day: number;
  daily: { k: string; label: string };
  dailyDone: boolean;
  profile: Profile;
  onOpen: () => void;
}) {
  const showAvatar = !!profile?.character;
  const labelByK: Record<string, string> = {
    briefing: "Briefing",
    decision: "Entscheidung",
    tv: "TV-Auftritt",
    crisis: "Krise",
    meeting: "Sitzung",
    vote: "Abstimmung",
  };

  return (
    <button
      onClick={dailyDone ? undefined : onOpen}
      style={{
        width: "100%",
        padding: 0,
        border: 0,
        cursor: dailyDone ? "default" : "pointer",
        background: skin.heroBg,
        color: skin.heroFg,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        textAlign: "left",
        fontFamily: "inherit",
        boxShadow:
          "0 12px 32px -16px rgba(20,19,15,.25), inset 0 -4px 0 rgba(0,0,0,.18)",
        animation: "pq-rise .5s ease-out",
      }}
    >
      <FlagStripe height={3} animated />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 18px 18px 20px",
          minHeight: 132,
          position: "relative",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 9px",
              borderRadius: 6,
              background: "#F6C414",
              color: "#1F1D17",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#1F1D17",
              }}
            />
            {dailyDone ? "Erledigt" : `Tagesmission · Tag ${day}`}
          </div>

          <div
            className="pq-display-tight"
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 10,
              lineHeight: 1.05,
              letterSpacing: "-.02em",
              color: skin.heroFg,
            }}
          >
            {daily.label}
          </div>

          <div
            style={{
              fontSize: 11,
              color: "rgba(251,246,233,.6)",
              marginTop: 4,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              fontWeight: 700,
            }}
          >
            {labelByK[daily.k]} · ~ 4 Min · KI-Redaktion 16:00
          </div>

          {!dailyDone && (
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 999,
                background: "#F6C414",
                color: "#1F1D17",
                boxShadow: "inset 0 -3px 0 #C48A05",
                fontWeight: 800,
                letterSpacing: ".04em",
                fontSize: 13,
              }}
            >
              Jetzt starten
              {Icons.chevron("right", "#1F1D17")}
            </div>
          )}
          {dailyDone && (
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 999,
                background: "rgba(46,159,93,.18)",
                color: "#5DD08A",
                border: "1px solid rgba(93,208,138,.3)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ✓ Heute geschafft
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            width: 110,
            height: 110,
            animation: "pq-bob 3s ease-in-out infinite",
            transformOrigin: "center bottom",
            pointerEvents: "none",
          }}
        >
          {showAvatar && profile.character ? (
            <PoliAvatar character={profile.character} size={110} />
          ) : (
            <Bundesadler
              size={110}
              variant="bold"
              mood="happy"
              winking={dailyDone}
            />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Countdown bis zum nächsten Briefing (16:00) ────────────────────
function NextBriefing({ skin }: { skin: SkinTokens }) {
  const { h, m } = timeUntil1600();
  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: skin.surface,
          border: skin.surfaceBorder,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: skin.tagBg,
            color: skin.textMuted,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 7 V 12 L 16 14"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: skin.textDim,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            KI-Redaktion · Nächste Ausgabe
          </div>
          <div
            className="pq-display-tight"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: skin.text,
              marginTop: 1,
              lineHeight: 1.1,
            }}
          >
            Heute 16:00 Uhr
          </div>
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            fontWeight: 700,
            color: skin.text,
            background: skin.tagBg,
            padding: "5px 9px",
            borderRadius: 8,
            textAlign: "center",
            minWidth: 60,
          }}
        >
          {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m
        </div>
      </div>
    </div>
  );
}

// ─── Pfad-Knoten ──────────────────────────────────────────────────
function PathNode({
  skin,
  item,
  index,
  state,
  onClick,
}: {
  skin: SkinTokens;
  item: {
    day: number;
    label: string;
    k: string;
    isWahlkampf: boolean;
    isElection: boolean;
  };
  index: number;
  state: "done" | "today" | "locked" | "next";
  onClick?: () => void;
}) {
  const isToday = state === "today";
  const isDone = state === "done";
  const isLocked = state === "locked";
  const isNext = state === "next";

  const offset = [0, 32, 0, -32, 0, 32, 0][index] ?? 0;
  const NODE = isToday ? 84 : 66;
  const isElectionNode = item.isElection;
  const isWahlkampfNode = item.isWahlkampf;

  const fill = isToday
    ? isElectionNode
      ? "#D81E26"
      : "#F6C414"
    : isDone
      ? "#2E9F5D"
      : skin.nodeRest;
  const ring = isToday
    ? isElectionNode
      ? "#9B1219"
      : "#C48A05"
    : isDone
      ? "#166B3A"
      : skin.nodeRestRing;
  const iconColor = isLocked
    ? skin.nodeRestText
    : isDone
      ? "#FBF6E9"
      : isElectionNode && isToday
        ? "#FFFFFF"
        : isNext
          ? skin.nodeRestText
          : "#1F1D17";

  const gap = index === 0 ? 0 : isToday ? 44 : 28;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        marginTop: gap,
      }}
    >
      {index > 0 && (
        <div
          style={{
            position: "absolute",
            top: -gap,
            left: "50%",
            width: 3,
            height: gap,
            background: isLocked ? skin.pathLineLocked : skin.pathLine,
            transform: "translateX(-50%)",
            borderRadius: 999,
            backgroundImage: isLocked
              ? `repeating-linear-gradient(0deg, ${skin.pathLineLocked} 0 3px, transparent 3px 8px)`
              : undefined,
          }}
        />
      )}

      <div
        style={{ position: "relative", transform: `translateX(${offset}px)` }}
      >
        {isToday && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `3px solid ${isElectionNode ? "#D81E26" : "#F6C414"}`,
              animation: "pq-pulse 1.8s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        <button
          onClick={onClick}
          disabled={!isToday}
          aria-label={`Tag ${item.day} · ${item.label}`}
          style={{
            width: NODE,
            height: NODE,
            borderRadius: "50%",
            background: fill,
            border: 0,
            padding: 0,
            cursor: isToday ? "pointer" : "default",
            boxShadow: `inset 0 -5px 0 ${ring}`,
            display: "grid",
            placeItems: "center",
            position: "relative",
            zIndex: 2,
            opacity: isLocked ? 0.55 : 1,
            transition: "transform .12s",
            fontFamily: "inherit",
          }}
        >
          {isLocked
            ? Icons.lock(iconColor)
            : isDone
              ? Icons.check(iconColor)
              : nodeIcon(item.k, iconColor, isToday ? 34 : 24)}

          <span
            style={{
              position: "absolute",
              bottom: -3,
              right: -3,
              background: skin.text,
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 6px",
              borderRadius: 999,
              fontFamily: '"JetBrains Mono", monospace',
              opacity: isLocked ? 0.55 : 1,
            }}
          >
            {item.day}
          </span>

          {isWahlkampfNode && !isLocked && !isDone && (
            <span
              style={{
                position: "absolute",
                top: -6,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#D81E26",
                color: "#FFFFFF",
                fontSize: 8,
                fontWeight: 800,
                padding: "1px 5px",
                borderRadius: 4,
                letterSpacing: ".06em",
                fontFamily: '"JetBrains Mono", monospace',
                whiteSpace: "nowrap",
              }}
            >
              WAHLKAMPF
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function nodeIcon(k: string, color: string, size = 24) {
  switch (k) {
    case "tv":
      return (
        <div style={{ display: "grid", placeItems: "center" }}>
          {Icons.tv(color)}
        </div>
      );
    case "crisis":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path d="M12 2 L 22 20 H 2 Z" fill={color} />
          <rect x="11" y="9" width="2" height="6" fill="#FBF6E9" />
          <rect x="11" y="16" width="2" height="2" fill="#FBF6E9" />
        </svg>
      );
    case "vote":
      return (
        <div style={{ display: "grid", placeItems: "center" }}>
          {Icons.ballot(color)}
        </div>
      );
    case "meeting":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <circle cx="7" cy="9" r="3" fill={color} />
          <circle cx="17" cy="9" r="3" fill={color} />
          <path
            d="M2 20 a 5 5 0 0 1 10 0 M 12 20 a 5 5 0 0 1 10 0"
            fill={color}
          />
        </svg>
      );
    case "briefing":
      return (
        <div style={{ display: "grid", placeItems: "center" }}>
          {Icons.newspaper(color)}
        </div>
      );
    case "decision":
    default:
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path
            d="M12 3 L 21 9 V 19 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 V 9 Z"
            fill={color}
          />
          <path
            d="M3 9 L 12 14 L 21 9"
            stroke="#FBF6E9"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );
  }
}
