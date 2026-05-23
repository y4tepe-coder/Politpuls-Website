'use client';

// Wahlkampf-Wizard — Übersicht über die 9 Schritte.
//
// • Tag 1: alle 9 Schritte verfügbar (Intensiv-Tutorial)
// • Tag 29/30/31: heute 3 Schritte verfügbar; die anderen 6 sind erst
//                 an den anderen Wahlkampf-Tagen freigeschaltet
// • Jeder Schritt öffnet die zugehörige Mission. Beim Mission-Done
//   wird der Schritt als „erledigt" gespeichert und man landet wieder
//   hier. Wenn alle Schritte des Tages durch sind und (bei 29-31) die
//   Tagesmission, wird der Tag im PQProgress vorgerückt.

import React from "react";
import type { Skin, WahlkampfStep, WahlkampfStepId } from "@/lib/types";
import type { SkinTokens } from "@/lib/tokens";
import { skinTokens } from "@/lib/tokens";
import { loadProgress, PQ_EVENTS } from "@/lib/storage";
import { WK_STEPS, wahlkampfFor, getStepsDone } from "@/lib/wahlkampf";
import { useGameSync } from "@/lib/hooks";
import { Icons } from "@/components/ui";

type StepStatus = "done" | "today" | "locked";

export default function Wahlkampf({
  skin: skinName = "clean",
  onClose,
  onOpenStep,
}: {
  skin?: Skin;
  onClose: () => void;
  onOpenStep: (stepId: WahlkampfStepId) => void;
}) {
  return (
    <ScreenWahlkampf skin={skinName} onClose={onClose} onOpenStep={onOpenStep} />
  );
}

function ScreenWahlkampf({
  skin: skinName = "clean",
  onClose,
  onOpenStep,
}: {
  skin?: Skin;
  onClose: () => void;
  onOpenStep: (stepId: WahlkampfStepId) => void;
}) {
  const skin = skinTokens(skinName);
  useGameSync([PQ_EVENTS.progress, PQ_EVENTS.wahlkampf]);

  const progress = loadProgress();
  const todayDay = progress.currentDay;
  const wk = wahlkampfFor(todayDay);
  const STEPS = WK_STEPS;
  const done = getStepsDone(wk.electionDay);
  const stepsToday = new Set(wk.stepsToday || []);

  const total = STEPS.length;
  const totalDone = done.length;
  const todayList = wk.stepsToday || [];
  const todayDoneCount = todayList.filter((id) => done.includes(id)).length;
  const allTodayDone = todayDoneCount === todayList.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: skin.bg,
        color: skin.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: skin.surface,
            border: skin.surfaceBorder,
            cursor: "pointer",
            padding: 0,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
          aria-label="Schließen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M6 6 L 18 18 M 18 6 L 6 18"
              stroke={skin.text}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#D81E26",
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            {wk.intensive
              ? "Wahlkampf-Intensiv · Tag 1"
              : `Wahlkampf · Tag ${wk.dayInPhase}/${wk.totalPhaseDays}`}
          </div>
          <div
            className="pq-display-tight"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: skin.text,
              lineHeight: 1.1,
            }}
          >
            So läuft ein Wahlkampf
          </div>
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "#D81E26",
            fontWeight: 800,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          {totalDone}/{total}
        </div>
      </div>

      {/* Banner: Intro / Heutige Aufgabe */}
      <div style={{ padding: "4px 16px 0" }}>
        <div
          style={{
            background: skin.heroBg,
            color: skin.heroFg,
            borderRadius: 18,
            padding: "14px 16px",
            boxShadow: "0 12px 28px -16px rgba(20,19,15,.25)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "rgba(251,246,233,.6)",
            }}
          >
            {wk.intensive ? "Bildungs-Modul" : "Tagesplan"}
          </div>
          <div
            className="pq-display-tight"
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginTop: 4,
              lineHeight: 1.2,
              letterSpacing: "-.01em",
            }}
          >
            {wk.intensive
              ? "Lerne in 9 Schritten, was ein:e Spitzenkandidat:in heute wirklich macht."
              : `Heute ${todayList.length} Schritte. ${
                  allTodayDone ? "Geschafft!" : "Du bestimmst die Reihenfolge."
                }`}
          </div>
          {wk.intensive && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "rgba(251,246,233,.6)",
                lineHeight: 1.4,
              }}
            >
              Du kannst jederzeit aussteigen und später weitermachen. Am Ende
              steht der Wahlsonntag — deine Performance bestimmt deine Rolle.
            </div>
          )}
        </div>
      </div>

      {/* Schritt-Liste */}
      <div
        style={{
          padding: "12px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {STEPS.map((step, i) => {
          const isDone = done.includes(step.id);
          const isToday = stepsToday.has(step.id);
          const status: StepStatus = isDone
            ? "done"
            : isToday
              ? "today"
              : "locked";
          return (
            <StepRow
              key={step.id}
              skin={skin}
              num={i + 1}
              step={step}
              status={status}
              onClick={
                isToday && !isDone ? () => onOpenStep?.(step.id) : undefined
              }
            />
          );
        })}
      </div>

      {/* Footer status */}
      <div style={{ padding: "0 16px 32px", marginTop: "auto" }}>
        {allTodayDone && !wk.intensive && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: skin.surface,
              border: skin.surfaceBorder,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#2E9F5D",
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, fontWeight: 800, color: skin.text }}
              >
                Heutige Wahlkampf-Schritte erledigt
              </div>
              <div
                style={{ fontSize: 11, color: skin.textDim, marginTop: 1 }}
              >
                Morgen geht's mit Schritt{" "}
                {todayList.length * (wk.dayInPhase || 0) + 1} weiter.
              </div>
            </div>
          </div>
        )}
        {wk.intensive && totalDone === total && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#F6C414",
              color: "#1F1D17",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#1F1D17",
                color: "#F6C414",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontWeight: 800,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              9/9
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
              Alle 9 Schritte abgeschlossen. Du weißt jetzt, wie Wahlkampf
              läuft.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Eine Schritt-Zeile ───────────────────────────────────────────
function StepRow({
  skin,
  num,
  step,
  status,
  onClick,
}: {
  skin: SkinTokens;
  num: number;
  step: WahlkampfStep;
  status: StepStatus;
  onClick?: () => void;
}) {
  const isDone = status === "done";
  const isToday = status === "today";
  const isLocked = status === "locked";

  const numBg = isDone ? "#2E9F5D" : isToday ? "#F6C414" : skin.nodeRest;
  const numFg = isDone ? "#FFFFFF" : isToday ? "#1F1D17" : skin.nodeRestText;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: "100%",
        padding: "12px 14px",
        background: skin.surface,
        border: 0,
        boxShadow: isToday
          ? `0 0 0 1.5px #F6C414, inset 0 -3px 0 #C48A05`
          : `0 0 0 1.5px ${skin.divider}`,
        borderRadius: 14,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        opacity: isLocked ? 0.55 : 1,
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "transform .12s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: numBg,
          color: numFg,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontWeight: 800,
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          boxShadow: isToday ? "inset 0 -2px 0 #C48A05" : "none",
        }}
      >
        {isDone ? "✓" : isLocked ? <LockSvg color={numFg} /> : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: skin.text,
              lineHeight: 1.15,
            }}
          >
            {step.label}
          </div>
          {isToday && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#D81E26",
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              Heute
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: skin.textDim,
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {step.desc}
        </div>
      </div>
      {isToday && !isDone && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "#1F1D17",
            color: "#F6C414",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {Icons.chevron("right", "#F6C414")}
        </div>
      )}
    </button>
  );
}

function LockSvg({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="9" rx="2" fill={color} />
      <path
        d="M8 11 V 8 a 4 4 0 0 1 8 0 V 11"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
