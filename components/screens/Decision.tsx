'use client';

// Daily decision flow. 3 steps:
//   1) Briefing  — newspaper cover + Tagesschau clip thumbnail
//   2) Decision  — Mix mechanic (Tinder-swipe scenario card → choice buttons → free-text Chat reply)
//   3) Feedback  — consequences (poll deltas, coalition mood, XP gain)
//
// The "mix" mood comes from changing the question type each step so the same
// flow feels varied: read → pick → write.

import React from "react";
import type { Skin } from "@/lib/types";
import type { SkinTokens } from "@/lib/tokens";
import type { Dossier, DossierChoice } from "@/lib/types";
import { skinTokens, PARTY_COLORS } from "@/lib/tokens";
import { loadProgress, loadSession } from "@/lib/storage";
import { completeDailyMission } from "@/lib/wahlkampf";
import { dossierForDay } from "@/lib/kiRedaktion";
import { Bundesadler } from "@/components/Mascot";
import { PressButton, Icons, ProgressBar } from "@/components/ui";

/* Minimal Web Speech API typing — not part of the standard DOM lib. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export default function Decision({
  skin: skinName = "clean",
  onClose,
  onComplete,
}: {
  skin?: Skin;
  onClose: () => void;
  onComplete: () => void;
}) {
  const skin = skinTokens(skinName);
  const [step, setStep] = React.useState(0);
  const [choice, setChoice] = React.useState<string | null>(null); // 'A' | 'B' | 'C' | 'D' | 'X' (eigener)
  const [customText, setCustomText] = React.useState("");
  const [chatReply, setChatReply] = React.useState("");
  const stepsTotal = 4;

  // Day + role from the foundation stores.
  const progress = loadProgress();
  const day = progress.currentDay;
  const role = loadSession().profile?.role || "kanzler";

  // ── KI-Redaktion dossier — gives us the topic, article, video, outlet,
  //    press officer and per-choice content for *this* day. Rotates so the
  //    user does not get the same topic + same press question every day.
  const dossier = dossierForDay(day);

  // When the user finishes the flow, mark the day done in the progress store
  // and notify Home so it picks the change up immediately.
  const finalize = () => {
    completeDailyMission();
    onComplete();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: skin.bg,
        color: skin.text,
        position: "relative",
      }}
    >
      <DecisionHeader
        skin={skin}
        step={step}
        stepsTotal={stepsTotal}
        onClose={onClose}
        day={day}
      />

      <div style={{ flex: 1, padding: "4px 0 100px" }}>
        {step === 0 && (
          <BriefingStep
            skin={skin}
            dossier={dossier}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <div style={{ padding: "0 16px" }}>
            <ChoiceStep
              role={role}
              dossier={dossier}
              choice={choice}
              customText={customText}
              onCustomChange={setCustomText}
              onChoose={(c) => {
                setChoice(c);
                setTimeout(() => setStep(2), 350);
              }}
              onSubmitCustom={() => {
                setChoice("X");
                setTimeout(() => setStep(2), 250);
              }}
            />
          </div>
        )}
        {step === 2 && (
          <div style={{ padding: "0 16px" }}>
            <ChatReplyStep
              dossier={dossier}
              choice={choice}
              value={chatReply}
              onChange={setChatReply}
              onNext={() => setStep(3)}
            />
          </div>
        )}
        {step === 3 && (
          <div style={{ padding: "0 16px" }}>
            <FeedbackStep
              dossier={dossier}
              choice={choice}
              onDone={finalize}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionHeader({
  skin,
  step,
  stepsTotal,
  onClose,
  day,
}: {
  skin: SkinTokens;
  step: number;
  stepsTotal: number;
  onClose: () => void;
  day: number;
}) {
  return (
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
        <ProgressBar
          value={step + 1}
          max={stepsTotal}
          color="var(--pq-gold)"
          height={10}
        />
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: skin.textMuted,
          minWidth: 50,
          textAlign: "right",
          fontWeight: 700,
        }}
      >
        Tag {day}
      </div>
    </div>
  );
}

// ─── Step 0: Briefing — swipeable carousel ────────────────────────────
// Three pages the user can swipe through horizontally:
//   1. Newspaper article (KI-Redaktion-generiert)
//   2. Tagesschau-Style Video (mocked thumbnail)
//   3. Quick facts list
// Snap to each page with native CSS scroll-snap; dots underneath show position.
function BriefingStep({
  skin,
  dossier,
  onNext,
}: {
  skin: SkinTokens;
  dossier: Dossier;
  onNext: () => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setPage(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const gotoPage = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Pointer-drag swipe: drag horizontally to flip between Artikel/Video/Fakten.
  // Native touch-swipe already works via scroll-snap; this adds mouse/trackpad
  // drag support so the gesture is also discoverable in the preview.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let startPageIdx = 0;
    let pointerId: number | null = null;
    let dragging = false;
    let moved = 0;

    const onDown = (e: PointerEvent) => {
      // Only react to mouse / pen; let native touch handle finger swipes.
      if (e.pointerType === "touch") return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      startPageIdx = Math.round(el.scrollLeft / el.clientWidth);
      dragging = true;
      moved = 0;
      el.style.scrollSnapType = "none";
      el.style.cursor = "grabbing";
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startScroll - dx;
    };
    const finish = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const dx = e && e.pointerId === pointerId ? e.clientX - startX : 0;
      const w = el.clientWidth;
      // Snap one page per gesture if the drag is meaningful (>10% of width
      // or >40px). Otherwise return to the original page.
      let target = startPageIdx;
      if (Math.abs(dx) > Math.max(40, w * 0.1)) {
        target = startPageIdx + (dx < 0 ? 1 : -1);
      }
      target = Math.max(0, Math.min(2, target));
      el.style.scrollSnapType = "x mandatory";
      el.style.cursor = "";
      el.scrollTo({ left: target * w, behavior: "smooth" });
      try {
        if (pointerId != null) el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      pointerId = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("pointerleave", finish);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
      el.removeEventListener("pointerleave", finish);
    };
  }, []);

  // Article / video / facts now come from the KI-Redaktion dossier for
  // today's day. Rotates by day, so consecutive days don't repeat.
  const article = dossier.article;
  const facts = dossier.facts;
  const video = dossier.video;
  const dateStr = dossier.date;

  return (
    <div>
      {/* Intro */}
      <div style={{ padding: "4px 16px 12px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: skin.textDim,
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}
        >
          KI-Redaktion · {dateStr} · 18:00 Uhr
        </div>
        <div
          className="pq-display-tight"
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: skin.text,
            marginTop: 4,
            lineHeight: 1.1,
          }}
        >
          Was ist heute los?
        </div>
        <div style={{ fontSize: 14, color: skin.textMuted, marginTop: 4 }}>
          Wische zwischen Artikel, Video und den wichtigsten Fakten.
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          gap: 12,
          padding: "0 16px 4px",
          scrollPadding: "0 16px",
          cursor: "grab",
          touchAction: "pan-y",
        }}
        className="pq-scroll"
      >
        {/* Page 1: Article */}
        <CarouselCard>
          <NewspaperLarge
            skin={skin}
            article={article}
            day={dossier.day}
            dateStr={dateStr}
          />
        </CarouselCard>
        {/* Page 2: Video */}
        <CarouselCard>
          <TagesschauPlayer skin={skin} video={video} />
        </CarouselCard>
        {/* Page 3: Facts */}
        <CarouselCard>
          <FactsCard skin={skin} facts={facts} />
        </CarouselCard>
      </div>

      {/* Page indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          padding: "14px 16px 8px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => gotoPage(i)}
            aria-label={`Seite ${i + 1}`}
            style={{
              width: page === i ? 22 : 8,
              height: 8,
              borderRadius: 999,
              background: page === i ? skin.text : skin.divider,
              border: 0,
              padding: 0,
              cursor: "pointer",
              transition: "width .2s, background .2s",
            }}
          />
        ))}
      </div>

      {/* Page labels (so the swipe is discoverable) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          padding: "0 16px 12px",
          fontSize: 11,
          fontWeight: 700,
          color: skin.textDim,
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        <span style={{ color: page === 0 ? skin.text : skin.textDim }}>
          📰 Artikel
        </span>
        <span style={{ color: page === 1 ? skin.text : skin.textDim }}>
          📺 Video
        </span>
        <span style={{ color: page === 2 ? skin.text : skin.textDim }}>
          📌 Fakten
        </span>
      </div>

      <div style={{ padding: "0 16px" }}>
        <PressButton variant="primary" size="lg" full onClick={onNext}>
          Briefing gelesen
        </PressButton>
      </div>
    </div>
  );
}

// Each carousel card fills the viewport width minus side padding, snaps in place.
function CarouselCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "0 0 calc(100% - 0px)",
        minWidth: "calc(100% - 0px)",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
      }}
    >
      {children}
    </div>
  );
}

// ─── Card 1: Newspaper — large & readable ─────────────────────────────
function NewspaperLarge({
  skin,
  article,
  day,
  dateStr,
}: {
  skin: SkinTokens;
  article: Dossier["article"];
  day: number;
  dateStr: string;
}) {
  return (
    <div
      style={{
        background: "#FAF1DD",
        border: "1.5px solid #D6CCB1",
        borderRadius: 18,
        padding: "18px 18px 20px",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 1px 0 #fff inset, 0 12px 24px -16px rgba(20,19,15,.18)",
        fontFamily: '"Bricolage Grotesque", system-ui',
        color: "#1F1D17",
        minHeight: 460,
      }}
    >
      {/* mast */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #1F1D17",
          paddingBottom: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            letterSpacing: ".02em",
            fontWeight: 800,
            fontSize: 20,
            color: "#1F1D17",
          }}
        >
          DER REDAKTEUR
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            color: "#4A463C",
          }}
        >
          Tag {day} · {dateStr || ""}
        </div>
      </div>
      <div
        style={{
          display: "inline-block",
          background: "#D81E26",
          color: "#FBF6E9",
          padding: "3px 10px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        {article.kicker}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 30,
          lineHeight: 1,
          marginTop: 10,
          color: "#1F1D17",
          letterSpacing: "-.02em",
        }}
      >
        {article.headline.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div
        style={{
          fontSize: 16,
          fontFamily: '"Schibsted Grotesk", system-ui',
          color: "#1F1D17",
          marginTop: 10,
          lineHeight: 1.4,
          fontWeight: 500,
        }}
      >
        {article.deck}
      </div>

      {/* two-col lede */}
      <div
        style={{
          marginTop: 16,
          fontFamily: '"Schibsted Grotesk", system-ui',
          fontSize: 14,
          lineHeight: 1.45,
          color: "#3A3528",
        }}
      >
        <span
          style={{
            float: "left",
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 0.8,
            marginRight: 6,
            marginTop: 4,
            color: "#D81E26",
          }}
        >
          B
        </span>
        {article.lede}
      </div>

      {/* pull quote */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 0 10px 12px",
          borderLeft: "4px solid #D81E26",
          fontSize: 15,
          lineHeight: 1.35,
          fontStyle: "italic",
          color: "#1F1D17",
          fontWeight: 600,
        }}
      >
        {article.pull}
      </div>

      <div
        style={{
          marginTop: 14,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          color: "#807A6A",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          {article.byline}
          {dateStr ? ` · ${dateStr}` : ""}
        </span>
        <span>S. 1 · weiter S. 3</span>
      </div>
    </div>
  );
}

// ─── Card 2: Tagesschau-style player (mock) ──────────────────────────
function TagesschauPlayer({
  skin,
  video,
}: {
  skin: SkinTokens;
  video: Dossier["video"];
}) {
  const v = video || ({} as Dossier["video"]);
  return (
    <div
      style={{
        background: skin.surface,
        border: skin.surfaceBorder,
        borderRadius: 18,
        overflow: "hidden",
        minHeight: 460,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          background: "linear-gradient(135deg, #003770 0%, #001a3a 100%)",
        }}
      >
        {/* faux studio gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            background:
              "radial-gradient(ellipse at 28% 40%, rgba(246,196,20,.45), transparent 55%)",
          }}
        />
        {/* faux anchor silhouette */}
        <div
          style={{
            position: "absolute",
            left: "18%",
            top: "35%",
            width: 70,
            height: 90,
            borderRadius: "50% 50% 8px 8px / 60% 60% 12px 12px",
            background: "rgba(0,0,0,.45)",
          }}
        />
        {/* ticker */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "#1F1D17",
            color: "#FBF6E9",
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#D81E26",
              padding: "2px 7px",
              borderRadius: 2,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".1em",
            }}
          >
            LIVE
          </div>
          <div style={{ flex: 1 }}>
            {v.ticker ||
              "BÜRGERGELD · Koalitionsausschuss tagt im Kanzleramt"}
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
            }}
          >
            {v.time || "18:42"}
          </div>
        </div>
        {/* play button */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,.96)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M7 5 L 20 12 L 7 19 Z" fill="#1F1D17" />
            </svg>
          </div>
        </div>
        {/* logo */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "#1F1D17",
            color: "#FBF6E9",
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".04em",
            borderRadius: 4,
          }}
        >
          {v.channel || "tagesschau"}
        </div>
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,.5)",
            color: "#FBF6E9",
            padding: "3px 7px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 4,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {v.runtime || "2:14"}
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: skin.textDim,
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}
        >
          {v.channel || "Tagesschau"} · ARD · vor 18 Min
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: skin.text,
            marginTop: 4,
            lineHeight: 1.25,
          }}
        >
          {v.title ||
            '„Koalition im Streit": Schalte live aus Berlin zum Bürgergeld'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: skin.textMuted,
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          {v.blurb ||
            "Reporterin Lisa Berger fasst die Stimmung im Kanzleramt zusammen: vier Stunden Verhandlung, Pressekonferenz für 19 Uhr angekündigt."}
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: skin.tagBg,
            borderRadius: 10,
            fontSize: 12,
            color: skin.textMuted,
            lineHeight: 1.4,
          }}
        >
          💡 In der echten App: Tages­aktueller Clip wird automatisch um{" "}
          <b>17:45 Uhr</b> aus dem ARD-Pool gezogen und mit der KI-Redaktion
          verlinkt.
        </div>
      </div>
    </div>
  );
}

// ─── Card 3: Quick facts ────────────────────────────────────────────
function FactsCard({
  skin,
  facts,
}: {
  skin: SkinTokens;
  facts: string[];
}) {
  return (
    <div
      style={{
        background: skin.surface,
        border: skin.surfaceBorder,
        borderRadius: 18,
        padding: "20px 18px",
        minHeight: 460,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: skin.textDim,
          letterSpacing: ".1em",
          textTransform: "uppercase",
        }}
      >
        Kurz erklärt
      </div>
      <div
        className="pq-display-tight"
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: skin.text,
          marginTop: 4,
          lineHeight: 1.1,
        }}
      >
        Das musst du wissen
      </div>

      <ul
        style={{
          marginTop: 18,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          flex: 1,
        }}
      >
        {facts.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#F6C414",
                color: "#1F1D17",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 14,
                boxShadow: "inset 0 -2px 0 #C48A05",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: 15,
                color: skin.text,
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      <div
        style={{
          marginTop: 18,
          padding: "10px 12px",
          borderRadius: 10,
          background: skin.tagBg,
          fontSize: 12,
          color: skin.textMuted,
          lineHeight: 1.4,
        }}
      >
        🛟 Hinweis: Die Fakten kommen aus geprüften Quellen (Statistisches
        Bundesamt, BMAS).
      </div>
    </div>
  );
}

// ─── Step 1: Choice — four preset options + own proposal w/ voice ──────
// Visual rule: very calm. Each card shows only a headline + tiny tone-dot.
// Tap to expand → see what the position actually means. From inside the
// expanded panel, "Diese Position wählen" commits the choice.
function ChoiceStep({
  role,
  dossier,
  choice,
  customText,
  onCustomChange,
  onChoose,
  onSubmitCustom,
}: {
  role: string;
  dossier: Dossier;
  choice: string | null;
  customText: string;
  onCustomChange: (v: string) => void;
  onChoose: (c: string) => void;
  onSubmitCustom: () => void;
}) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  // Choices come from the day's dossier — each one is fully self-contained:
  // headline, tag, tone, bullets, deltas, BILD-question and presets.
  const opts = dossier.choices;
  const prompt =
    dossier.prompt?.[role] ||
    dossier.prompt?.kanzler ||
    "Welchen Vorschlag legst du morgen vor?";

  return (
    <div>
      <SpeakerBubble>
        Vier Stunden Verhandlung, alle schauen auf dich.{" "}
        <b>Jetzt entscheidest du.</b>
      </SpeakerBubble>

      <div
        className="pq-display-tight"
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 16,
          lineHeight: 1.2,
          color: "var(--pq-ink)",
        }}
      >
        {prompt}
      </div>
      <div style={{ fontSize: 12, color: "var(--pq-ink-mute)", marginTop: 4 }}>
        Tippe auf eine Position, um Details zu sehen.
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {opts.map((o) => (
          <ChoiceCard
            key={o.id}
            option={o}
            selected={choice === o.id}
            expanded={expandedId === o.id}
            onToggle={() =>
              setExpandedId(expandedId === o.id ? null : o.id)
            }
            onSelect={() => onChoose(o.id)}
          />
        ))}
      </div>

      {/* ─ "Or write/speak your own answer" ─ */}
      <OwnAnswerBlock
        value={customText}
        onChange={onCustomChange}
        onSubmit={onSubmitCustom}
        selected={choice === "X"}
      />

      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "var(--pq-ink-mute)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "var(--pq-line)",
            color: "var(--pq-ink-soft)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          i
        </span>
        Deine Antwort fließt in dein politisches Profil ein.
      </div>
    </div>
  );
}

// ─── "Eigener Vorschlag" with voice (Web Speech API) ────────────────────
// Lets the user dictate or type their own position. Falls back gracefully if
// SpeechRecognition isn't available in the browser.
function OwnAnswerBlock({
  value,
  onChange,
  onSubmit,
  selected,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  selected: boolean;
}) {
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const recogRef = React.useRef<SpeechRecognitionLike | null>(null);
  const baseRef = React.useRef("");

  React.useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSupported(false);
      return;
    }
  }, []);

  const startVoice = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSupported(false);
      return;
    }
    try {
      const r = new SR();
      r.lang = "de-DE";
      r.interimResults = true;
      r.continuous = true;
      baseRef.current = value ? value.trim() + " " : "";
      r.onresult = (e: SpeechRecognitionEventLike) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final) baseRef.current += final;
        onChange((baseRef.current + interim).replace(/\s+/g, " ").trimStart());
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      r.start();
      recogRef.current = r;
      setListening(true);
    } catch {
      setListening(false);
    }
  };
  const stopVoice = () => {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const ready = value.trim().length > 4;

  return (
    <div style={{ marginTop: 18 }}>
      {/* divider with label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--pq-ink-mute)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--pq-line)" }} />
        <span>Oder eigene Position</span>
        <div style={{ flex: 1, height: 1, background: "var(--pq-line)" }} />
      </div>

      <div
        style={{
          marginTop: 10,
          background: selected ? "#FBF6E9" : "#FFFFFF",
          borderRadius: 14,
          border: selected
            ? "1.5px solid var(--pq-ink-soft)"
            : "1px solid var(--pq-line)",
          padding: 14,
          position: "relative",
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            listening
              ? "Hört zu… sprich los."
              : "Schreib oder diktiere deine Position…"
          }
          rows={3}
          style={{
            width: "100%",
            border: 0,
            outline: 0,
            background: "transparent",
            resize: "none",
            fontFamily: "inherit",
            fontSize: 15,
            lineHeight: 1.4,
            color: "var(--pq-ink)",
            padding: 0,
          }}
        />

        {/* voice + submit row */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={listening ? stopVoice : startVoice}
            disabled={!supported}
            aria-label={
              listening ? "Aufnahme stoppen" : "Per Sprache diktieren"
            }
            style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 999,
              background: !supported
                ? "#F0EADB"
                : listening
                  ? "#FBF6E9"
                  : "#FFFFFF",
              border: listening
                ? "1.5px solid var(--pq-ink-soft)"
                : "1px solid var(--pq-line)",
              cursor: supported ? "pointer" : "not-allowed",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {/* mic glyph — ink, not red */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect
                x="9"
                y="3"
                width="6"
                height="11"
                rx="3"
                fill={listening ? "var(--pq-ink)" : "var(--pq-ink-soft)"}
              />
              <path
                d="M6 11 a 6 6 0 0 0 12 0 M 12 17 v 4 M 9 21 h 6"
                stroke={listening ? "var(--pq-ink)" : "var(--pq-ink-soft)"}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {listening && (
              <span
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: 999,
                  border: "1.5px solid var(--pq-ink-soft)",
                  animation: "pq-pulse 1.6s ease-out infinite",
                }}
              />
            )}
          </button>

          <div
            style={{
              flex: 1,
              fontSize: 12,
              color: "var(--pq-ink-mute)",
              lineHeight: 1.3,
            }}
          >
            {listening ? (
              <span style={{ color: "var(--pq-ink)", fontWeight: 600 }}>
                ● Aufnahme läuft
              </span>
            ) : supported ? (
              "Mikro tippen, um zu sprechen."
            ) : (
              "Sprache nicht verfügbar — bitte tippen."
            )}
          </div>

          <button
            onClick={ready ? onSubmit : undefined}
            disabled={!ready}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 999,
              background: ready ? "var(--pq-ink)" : "transparent",
              color: ready ? "#FBF6E9" : "var(--pq-ink-mute)",
              border: ready ? 0 : "1px solid var(--pq-line)",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 13,
              cursor: ready ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}

// Soft, headline-only card. Tap to expand and reveal details + commit button.
function ChoiceCard({
  option,
  selected,
  expanded,
  onToggle,
  onSelect,
}: {
  option: DossierChoice;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  // very muted tone dots — palette-tinted but never loud
  const dot =
    option.tone === "red"
      ? "#B8595E"
      : option.tone === "dark"
        ? "#5F5A50"
        : option.tone === "blue"
          ? "#7A93B2"
          : "#C39E4A";

  return (
    <div
      style={{
        background: selected ? "#FBF6E9" : "#FFFFFF",
        borderRadius: 14,
        border: selected
          ? "1.5px solid var(--pq-ink-soft)"
          : "1px solid var(--pq-line)",
        overflow: "hidden",
        transition: "background .15s, border-color .15s",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          textAlign: "left",
          border: 0,
          background: "transparent",
          cursor: "pointer",
          padding: "14px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: dot,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--pq-ink-mute)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {option.tag}
          </div>
          <div
            className="pq-display-tight"
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--pq-ink)",
              lineHeight: 1.25,
              marginTop: 4,
            }}
          >
            {option.label}
          </div>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform .2s ease",
            flexShrink: 0,
            color: "var(--pq-ink-mute)",
          }}
        >
          <path
            d="M6 9 l 6 6 l 6 -6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        style={{
          maxHeight: expanded ? 320 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height .25s ease, opacity .2s ease",
        }}
      >
        <div style={{ padding: "0 16px 14px 36px" }}>
          {option.bullets && (
            <ul
              style={{
                margin: "2px 0 12px",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {option.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "var(--pq-ink-soft)",
                    lineHeight: 1.4,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span
                    style={{ color: "var(--pq-ink-mute)", flexShrink: 0 }}
                  >
                    —
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            style={{
              border: 0,
              background: selected ? "var(--pq-ink)" : "transparent",
              color: selected ? "#FBF6E9" : "var(--pq-ink)",
              boxShadow: selected
                ? "none"
                : "inset 0 0 0 1.5px var(--pq-ink-soft)",
              padding: "8px 14px",
              borderRadius: 999,
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {selected ? (
              <>
                <span>✓</span> Ausgewählt
              </>
            ) : (
              "Diese Position wählen"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Mascot speech bubble used in flow
function SpeakerBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 6,
      }}
    >
      <div style={{ flexShrink: 0, marginTop: -6 }}>
        <Bundesadler size={64} variant="bold" mood="happy" />
      </div>
      <div
        style={{
          position: "relative",
          background: "#fff",
          border: "1.5px solid var(--pq-line)",
          borderRadius: 16,
          padding: "10px 14px",
          fontSize: 14,
          color: "var(--pq-ink)",
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -8,
            top: 16,
            width: 12,
            height: 12,
            background: "#fff",
            borderLeft: "1.5px solid var(--pq-line)",
            borderBottom: "1.5px solid var(--pq-line)",
            transform: "rotate(45deg)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

// ─── Step 2: Chat reply (write to Pressesprecherin) ──────────────────
// The BILD-Frage is a *concrete*, pointed question on today's topic — no
// generic "O-Ton bitte". Both the question and the preset replies are
// tailored to whichever position the user just picked, so the chat feels
// like a real follow-up, not filler.
function ChatReplyStep({
  dossier,
  choice,
  value,
  onChange,
  onNext,
}: {
  dossier: Dossier;
  choice: string | null;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  // Look up the dossier choice that matches the user's pick, then read its
  // press question + presets. Falls back to the first choice for the freeform
  // "X" path (the user wrote their own answer — dossier still has a question).
  const pickedChoice =
    dossier.choices.find((o) => o.id === choice) || dossier.choices[0];
  const bildQuestion = pickedChoice.bildQuestion;
  const presets = pickedChoice.presets;
  const outlet = dossier.outlet;
  const press = dossier.press;
  return (
    <div>
      <SpeakerBubble>
        Stark. Jetzt brauchen wir noch eine Antwort an{" "}
        {press.role === "Pressesprecherin"
          ? "deine Pressesprecherin"
          : press.role === "Regierungssprecher"
            ? "deinen Regierungssprecher"
            : press.role === "Stabschef"
              ? "deinen Stabschef"
              : "deine Sprecherin"}
        .
      </SpeakerBubble>

      <div
        className="pq-display-tight"
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginTop: 14,
          lineHeight: 1.2,
          color: "var(--pq-ink)",
        }}
      >
        Was sagst du zur Presse? (max. 1 Satz)
      </div>

      {/* chat-style message bubble — incoming from the day's press officer */}
      <div
        style={{
          marginTop: 14,
          padding: 14,
          background: "#fff",
          border: "1.5px solid var(--pq-line)",
          borderRadius: 18,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: press.gradient,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {press.initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--pq-ink-mute)",
              }}
            >
              <span>
                {press.name} · {press.role}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--pq-ink-mute)",
                marginTop: 2,
              }}
            >
              leitet eine Frage aus der {outlet.name}-Redaktion weiter
            </div>
            <div
              style={{
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 14,
                background: "#F4ECD6",
                color: "var(--pq-ink)",
                fontSize: 14,
                lineHeight: 1.35,
                borderTopLeftRadius: 4,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: outlet.dot,
                  color: "#FBF6E9",
                  padding: "2px 7px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {outlet.name} · {outlet.kicker}
              </div>
              <div style={{ fontWeight: 600 }}>„{bildQuestion}"</div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--pq-ink-mute)",
                  fontStyle: "italic",
                }}
              >
                Chef:in, ich brauch einen Satz. Was geb ich raus?
              </div>
            </div>
          </div>
        </div>

        {/* user reply box */}
        <div
          style={{
            marginTop: 12,
            background: "#FBF6E9",
            borderRadius: 12,
            border: "1.5px solid var(--pq-line)",
            padding: 8,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Schreib eine Antwort…"
            rows={2}
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: "transparent",
              resize: "none",
              fontFamily: "inherit",
              fontSize: 14,
              color: "var(--pq-ink)",
              minHeight: 36,
            }}
          />
          <button
            onClick={value.trim() ? onNext : undefined}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: value.trim() ? "var(--pq-gold)" : "#E8E2D2",
              border: 0,
              cursor: value.trim() ? "pointer" : "default",
              display: "grid",
              placeItems: "center",
              boxShadow: value.trim()
                ? "inset 0 -3px 0 var(--pq-gold-deep)"
                : "none",
            }}
          >
            {Icons.send("#1F1D17")}
          </button>
        </div>

        {/* preset chips */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => onChange(p)}
              style={{
                background: "#fff",
                border: "1.5px solid var(--pq-line)",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                color: "var(--pq-ink-soft)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <PressButton
          variant={value.trim() ? "primary" : "ghost"}
          size="lg"
          full
          onClick={value.trim() ? onNext : undefined}
          disabled={!value.trim()}
        >
          Absenden
        </PressButton>
      </div>
    </div>
  );
}

// ─── Step 3: Feedback ─────────────────────────────────────────────────
function FeedbackStep({
  dossier,
  choice,
  onDone,
}: {
  dossier: Dossier;
  choice: string | null;
  onDone: () => void;
}) {
  // Deltas come from the day's dossier per-choice. If the user wrote their
  // own answer (X), invent a mild "profile shift" stand-in so the screen
  // still feels like it acknowledges them.
  const pickedChoice =
    dossier.choices.find((o) => o.id === choice) || dossier.choices[0];
  const deltas =
    choice === "X"
      ? [
          {
            label: "Eigene Linie",
            delta: +4,
            unit: "%",
            good: true,
            note: "authentischer Auftritt",
          },
          { label: "Profil­schärfe", delta: +6, unit: "%", good: true },
          {
            label: "Verhandlungsmasse",
            delta: -2,
            unit: "%",
            good: false,
            note: "Partner überrascht",
          },
        ]
      : pickedChoice.deltas;

  return (
    <div>
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <Bundesadler size={120} variant="bold" mood="happy" winking={true} />
        <div
          className="pq-display-tight"
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--pq-ink)",
            marginTop: 6,
          }}
        >
          Entscheidung getroffen!
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#1F1D17",
            color: "#F6C414",
            padding: "6px 14px",
            borderRadius: 999,
            marginTop: 10,
            fontWeight: 800,
            letterSpacing: ".05em",
            boxShadow: "inset 0 -3px 0 #000",
          }}
        >
          {Icons.bolt()} <span>+50 XP</span>
        </div>
      </div>

      {/* deltas card */}
      <div
        style={{
          marginTop: 20,
          background: "#fff",
          border: "1.5px solid var(--pq-line)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "#FBF6E9",
            borderBottom: "1.5px solid var(--pq-line)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--pq-ink-soft)",
          }}
        >
          Auswirkungen heute
        </div>
        <div style={{ padding: "4px 14px" }}>
          {deltas.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 0",
                borderBottom:
                  i < deltas.length - 1
                    ? "1px solid var(--pq-line-soft)"
                    : 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--pq-ink)",
                  }}
                >
                  {d.label}
                </div>
                {d.note && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--pq-ink-mute)",
                    }}
                  >
                    {d.note}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 700,
                  fontSize: 14,
                  color: d.good
                    ? "var(--pq-green-deep)"
                    : "var(--pq-red-deep)",
                  background: d.good
                    ? "var(--pq-green-soft)"
                    : "var(--pq-red-soft)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                {d.delta > 0 ? "+" : ""}
                {d.delta}
                {d.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* mini party-match preview */}
      <div
        style={{
          marginTop: 14,
          background: "#fff",
          border: "1.5px solid var(--pq-line)",
          borderRadius: 20,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--pq-ink-soft)",
          }}
        >
          Dein Profil verschiebt sich
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          <PartyDot label="SPD" color={PARTY_COLORS.SPD} />
          <div style={{ flex: 1, position: "relative" }}>
            <ProgressBar value={62} color={PARTY_COLORS.SPD} height={10} />
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              color: PARTY_COLORS.SPD,
              fontWeight: 700,
              minWidth: 40,
              textAlign: "right",
            }}
          >
            62%
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--pq-ink-mute)",
            marginTop: 6,
          }}
        >
          Tippe später auf <b>Spektrum</b>, um deinen vollen Match zu sehen.
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <PressButton variant="secondary" size="lg" style={{ flex: 1 }}>
          Teilen
        </PressButton>
        <PressButton
          variant="primary"
          size="lg"
          style={{ flex: 2 }}
          onClick={onDone}
        >
          Weiter zum Pfad
        </PressButton>
      </div>
    </div>
  );
}

function PartyDot({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: color,
          border:
            color === "#FFED00" || color === "#F6C414"
              ? "1px solid #C48A05"
              : "0",
        }}
      />
      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--pq-ink)" }}>
        {label}
      </span>
    </div>
  );
}
