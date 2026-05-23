'use client';

// Wahlplakat-Editor — every quarter the user creates their own campaign
// poster. Live preview at top, simple form below. Photo gets dropped onto
// a real drag-&-drop upload zone (persists across reloads as a data-URL).
// Strict palette: schwarz, weiß, rot (#D81E26), gold (#F6C414).
//
// Three preset layouts (Klassisch / Modern / Bold) so the user can swipe
// between aesthetic options without designing from scratch.

import React from "react";
import type { Skin } from "@/lib/types";
import type { SkinTokens } from "@/lib/tokens";
import { skinTokens } from "@/lib/tokens";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { AdlerMark } from "@/components/Mascot";
import { PressButton } from "@/components/ui";

/* ─── Plakat state shape & storage ────────────────────────────────── */
export const PLAKAT_KEY = KEYS.plakat;

type PlakatLayout = "classic" | "modern" | "bold";
type PlakatAccent = "red" | "gold" | "black";
type PlakatPhotoMode = "upload" | "ki";
type PlakatKiStyle =
  | "silhouette"
  | "linocut"
  | "risograph"
  | "popart"
  | "aquarell";

interface PlakatState {
  slogan: string;
  subline: string;
  movement: string;
  candidate: string;
  role: string;
  layout: PlakatLayout;
  accent: PlakatAccent;
  photoMode: PlakatPhotoMode;
  kiStyle: PlakatKiStyle;
  kiSeed: number;
  photoData?: string;
  saved: boolean;
  savedAt?: number;
}

function plakatDefault(): PlakatState {
  return {
    slogan: "Für ein klares Deutschland.",
    subline: "Mut. Maß. Mehrheit.",
    movement: "Bürger:innen-Bewegung Mitte",
    candidate: "Jana Klein",
    role: "Spitzenkandidatin · Bundestagswahl 2027",
    layout: "classic", // classic | modern | bold
    accent: "red", // red | gold | black
    photoMode: "upload", // upload | ki
    kiStyle: "linocut", // silhouette | linocut | risograph | popart | aquarell
    kiSeed: 3, // determines tilt/scale/hue offset — "neu generieren" bumps it
    photoData: undefined,
    saved: false,
  };
}

export function loadPlakat(): PlakatState {
  return readJSON<PlakatState>(KEYS.plakat, plakatDefault());
}

// Tiny seeded PRNG — keeps KI-Porträts deterministic per seed so the user
// gets the same image back across reloads.
function pqRng(seed: number): () => number {
  let s = (seed * 9301 + 49297) | 0;
  return () => {
    s = (s * 1103515245 + 12345) | 0;
    return ((s >>> 16) & 0x7fff) / 0x7fff;
  };
}

function savePlakat(p: PlakatState) {
  writeJSON(KEYS.plakat, p);
}

export default function Plakat({
  skin: skinName = "clean",
  onClose,
}: {
  skin?: Skin;
  onClose: () => void;
}) {
  return <ScreenPlakat skin={skinName} onClose={onClose} />;
}

function ScreenPlakat({
  onClose,
  skin: skinName = "clean",
}: {
  onClose: () => void;
  skin?: Skin;
}) {
  const skin = skinTokens(skinName);
  const [p, setP] = React.useState<PlakatState>(loadPlakat);
  const update = <K extends keyof PlakatState>(k: K, v: PlakatState[K]) =>
    setP((s) => ({ ...s, [k]: v, saved: false }));

  const handleSave = () => {
    const next: PlakatState = { ...p, saved: true, savedAt: Date.now() };
    setP(next);
    savePlakat(next);
    // Don't strand the user with a saved poster + no obvious next step —
    // close right after the save state has rendered so they see the
    // "gespeichert" state for a beat, then return to the campaign overview.
    setTimeout(() => {
      onClose?.();
    }, 600);
  };

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
              color: skin.textDim,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Quartal · Wahlkampf
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
            Dein Wahlplakat
          </div>
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "#D81E26",
            fontWeight: 800,
          }}
        >
          14 TAGE
        </div>
      </div>

      {/* Live preview */}
      <div style={{ padding: "4px 16px 12px" }}>
        <PlakatPreview p={p} onPhoto={(d) => update("photoData", d)} />
      </div>

      {/* Layout selector — 3 presets */}
      <div style={{ padding: "4px 16px 0" }}>
        <FieldLabel skin={skin}>Layout</FieldLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          <LayoutChip
            skin={skin}
            active={p.layout === "classic"}
            onClick={() => update("layout", "classic")}
            label="Klassisch"
            preview={<MiniPreview layout="classic" accent={p.accent} />}
          />
          <LayoutChip
            skin={skin}
            active={p.layout === "modern"}
            onClick={() => update("layout", "modern")}
            label="Modern"
            preview={<MiniPreview layout="modern" accent={p.accent} />}
          />
          <LayoutChip
            skin={skin}
            active={p.layout === "bold"}
            onClick={() => update("layout", "bold")}
            label="Bold"
            preview={<MiniPreview layout="bold" accent={p.accent} />}
          />
        </div>
      </div>

      {/* Photo source — upload vs KI-Porträt */}
      <div style={{ padding: "16px 16px 0" }}>
        <FieldLabel skin={skin}>Foto</FieldLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            background: skin.surface,
            borderRadius: 12,
            padding: 4,
            border: skin.surfaceBorder,
          }}
        >
          <PhotoTab
            active={p.photoMode === "upload"}
            onClick={() => update("photoMode", "upload")}
            label="Eigenes Foto"
            sub="per Drag & Drop"
          />
          <PhotoTab
            active={p.photoMode === "ki"}
            onClick={() => update("photoMode", "ki")}
            label="KI-Porträt"
            sub="keine privaten Bilder nötig"
            badge="KI"
          />
        </div>

        {p.photoMode === "upload" && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: skin.textDim,
              lineHeight: 1.4,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            Foto direkt ins Plakat oben ziehen — oder klicken zum Auswählen.
          </div>
        )}

        {p.photoMode === "ki" && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
              }}
            >
              {KI_STYLES.map((s) => (
                <KIStyleChip
                  key={s.id}
                  style={s}
                  accent={p.accent}
                  seed={p.kiSeed}
                  active={p.kiStyle === s.id}
                  onClick={() => update("kiStyle", s.id)}
                />
              ))}
            </div>
            <button
              onClick={() => update("kiSeed", (p.kiSeed % 99) + 1)}
              style={{
                marginTop: 8,
                width: "100%",
                background: skin.surface,
                border: skin.surfaceBorder,
                borderRadius: 10,
                padding: "9px 10px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 12,
                color: skin.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 4v5h-5" />
              </svg>
              Neu generieren · Seed {String(p.kiSeed).padStart(2, "0")}
            </button>
          </div>
        )}
      </div>

      {/* Accent color */}
      <div style={{ padding: "16px 16px 0" }}>
        <FieldLabel skin={skin}>Akzent­farbe</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <ColorChip
            color="#D81E26"
            label="Rot"
            active={p.accent === "red"}
            onClick={() => update("accent", "red")}
          />
          <ColorChip
            color="#F6C414"
            label="Gold"
            active={p.accent === "gold"}
            onClick={() => update("accent", "gold")}
          />
          <ColorChip
            color="#000000"
            label="Schwarz"
            active={p.accent === "black"}
            onClick={() => update("accent", "black")}
          />
        </div>
      </div>

      {/* Text fields */}
      <div style={{ padding: "16px 16px 0" }}>
        <FieldLabel skin={skin}>Haupt­slogan</FieldLabel>
        <FormField
          skin={skin}
          value={p.slogan}
          maxLength={42}
          onChange={(v) => update("slogan", v)}
          placeholder="Für ein klares Deutschland."
        />

        <div style={{ height: 12 }} />
        <FieldLabel skin={skin}>Unter­zeile</FieldLabel>
        <FormField
          skin={skin}
          value={p.subline}
          maxLength={48}
          onChange={(v) => update("subline", v)}
          placeholder="Was du versprichst, in 3 Worten."
        />

        <div style={{ height: 12 }} />
        <FieldLabel skin={skin}>Bewegung / Partei</FieldLabel>
        <FormField
          skin={skin}
          value={p.movement}
          maxLength={42}
          onChange={(v) => update("movement", v)}
          placeholder="Name deiner Bewegung"
        />

        <div style={{ height: 12 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <div>
            <FieldLabel skin={skin}>Kandidat:in</FieldLabel>
            <FormField
              skin={skin}
              value={p.candidate}
              maxLength={28}
              onChange={(v) => update("candidate", v)}
            />
          </div>
          <div>
            <FieldLabel skin={skin}>Rolle</FieldLabel>
            <FormField
              skin={skin}
              value={p.role}
              maxLength={40}
              onChange={(v) => update("role", v)}
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "24px 16px 32px", marginTop: 8 }}>
        <PressButton
          variant={p.saved ? "success" : "primary"}
          size="lg"
          full
          disabled={p.saved}
          onClick={handleSave}
        >
          {p.saved ? "✓ Gespeichert — weiter" : "Plakat speichern & weiter"}
        </PressButton>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: skin.textDim,
            textAlign: "center",
          }}
        >
          {p.saved
            ? "Schließen …"
            : "Wird beim nächsten Wahltermin (in 14 Tagen) ausgespielt."}
        </div>
      </div>
    </div>
  );
}

// ─── Live preview ──────────────────────────────────────────────────
function PlakatPreview({
  p,
  onPhoto,
}: {
  p: PlakatState;
  onPhoto: (dataUrl: string) => void;
}) {
  // The poster is always rendered at the same large size; A1 portrait ratio
  // (594:841 ≈ 0.706). With ~340px width inside an iPhone, height ≈ 481.
  const W = 340;
  const H = Math.round(W / 0.706);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: W,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "0.706/1",
          background: "#FFFFFF",
          borderRadius: 8,
          boxShadow:
            "0 1px 0 rgba(0,0,0,.08) inset, 0 24px 60px -24px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {p.layout === "classic" && (
          <PlakatClassic p={p} W={W} H={H} onPhoto={onPhoto} />
        )}
        {p.layout === "modern" && (
          <PlakatModern p={p} W={W} H={H} onPhoto={onPhoto} />
        )}
        {p.layout === "bold" && (
          <PlakatBold p={p} W={W} H={H} onPhoto={onPhoto} />
        )}
      </div>

      {/* Faux tape corners — gives it physical poster feel */}
      <div
        style={{
          position: "absolute",
          top: -6,
          left: 26,
          width: 36,
          height: 14,
          background: "rgba(246,196,20,.5)",
          transform: "rotate(-6deg)",
          borderRadius: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -6,
          right: 26,
          width: 36,
          height: 14,
          background: "rgba(246,196,20,.5)",
          transform: "rotate(6deg)",
          borderRadius: 2,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function accentColor(a: PlakatAccent): string {
  return a === "red" ? "#D81E26" : a === "gold" ? "#F6C414" : "#000000";
}

// ─── Layout 1: Klassisch — photo top, color block, slogan ─────────
function PlakatClassic({
  p,
  onPhoto,
}: {
  p: PlakatState;
  W: number;
  H: number;
  onPhoto: (dataUrl: string) => void;
}) {
  const ac = accentColor(p.accent);
  const acFg = p.accent === "gold" ? "#000" : "#fff";
  return (
    <>
      {/* photo region — top 55% */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "54%",
        }}
      >
        <PortraitSurface
          p={p}
          shape="rect"
          placeholder="Foto hier ablegen"
          onPhoto={onPhoto}
        />
      </div>
      {/* color block */}
      <div
        style={{
          position: "absolute",
          top: "54%",
          left: 0,
          right: 0,
          bottom: 0,
          background: ac,
          color: acFg,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-.02em",
          }}
        >
          {p.slogan}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: 600,
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {p.subline}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            paddingTop: 8,
            borderTop: `1px solid ${
              p.accent === "gold" ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.2)"
            }`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".04em",
              }}
            >
              {p.candidate}
            </div>
            <div
              style={{
                fontSize: 8,
                opacity: 0.75,
                marginTop: 1,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {p.role}
            </div>
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              textAlign: "right",
            }}
          >
            {p.movement}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Layout 2: Modern — half/half split with photo right ──────────
function PlakatModern({
  p,
  onPhoto,
}: {
  p: PlakatState;
  W: number;
  H: number;
  onPhoto: (dataUrl: string) => void;
}) {
  const ac = accentColor(p.accent);
  const acFg = p.accent === "gold" ? "#000" : "#fff";
  return (
    <>
      {/* left: color block */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "55%",
          background: ac,
          color: acFg,
          padding: "24px 16px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {p.movement}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-.03em",
          }}
        >
          {p.slogan}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {p.subline}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            paddingTop: 10,
            borderTop: `2px solid ${p.accent === "gold" ? "#000" : "#fff"}`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800 }}>{p.candidate}</div>
          <div
            style={{
              fontSize: 8,
              opacity: 0.8,
              marginTop: 1,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {p.role}
          </div>
        </div>
      </div>
      {/* right: photo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "45%",
        }}
      >
        <PortraitSurface
          p={p}
          shape="rect"
          placeholder="Foto ablegen"
          onPhoto={onPhoto}
        />
      </div>
    </>
  );
}

// ─── Layout 3: Bold — slogan dominates, photo small badge ─────────
function PlakatBold({
  p,
  onPhoto,
}: {
  p: PlakatState;
  W: number;
  H: number;
  onPhoto: (dataUrl: string) => void;
}) {
  const ac = accentColor(p.accent);
  const acFg = p.accent === "gold" ? "#000" : "#fff";
  return (
    <>
      {/* full bg block */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ac,
          color: acFg,
          padding: "22px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              opacity: 0.85,
              maxWidth: 140,
            }}
          >
            {p.movement}
          </div>
          {/* small circular photo */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${p.accent === "gold" ? "#000" : "#fff"}`,
              flexShrink: 0,
            }}
          >
            <PortraitSurface
              p={p}
              shape="circle"
              placeholder="Foto"
              onPhoto={onPhoto}
            />
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 0.9,
            letterSpacing: "-.04em",
            textTransform: "uppercase",
          }}
        >
          {p.slogan}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 600,
            opacity: 0.85,
            lineHeight: 1.25,
            maxWidth: "85%",
          }}
        >
          {p.subline}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: p.accent === "gold" ? "#000" : "#F6C414",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <AdlerMark
              size={20}
              color={p.accent === "gold" ? "#F6C414" : "#000"}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
              {p.candidate}
            </div>
            <div
              style={{
                fontSize: 8,
                opacity: 0.75,
                marginTop: 2,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {p.role}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Mini preview for layout chips ────────────────────────────────
function MiniPreview({
  layout,
  accent,
}: {
  layout: PlakatLayout;
  accent: PlakatAccent;
}) {
  const ac = accentColor(accent);
  const acFg = accent === "gold" ? "#000" : "#fff";
  if (layout === "classic") {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "0.706/1",
          overflow: "hidden",
          borderRadius: 4,
        }}
      >
        <div
          style={{ height: "54%", background: "#807A6A", position: "relative" }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,.05)",
            }}
          />
        </div>
        <div style={{ height: "46%", background: ac, padding: 4 }}>
          <div
            style={{
              height: 4,
              width: "80%",
              background: acFg,
              marginBottom: 3,
            }}
          />
          <div
            style={{ height: 3, width: "60%", background: acFg, opacity: 0.6 }}
          />
        </div>
      </div>
    );
  }
  if (layout === "modern") {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "0.706/1",
          display: "flex",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "55%", background: ac, padding: 4 }}>
          <div
            style={{ height: 4, width: "90%", background: acFg, marginTop: 18 }}
          />
          <div
            style={{
              height: 3,
              width: "70%",
              background: acFg,
              opacity: 0.6,
              marginTop: 3,
            }}
          />
        </div>
        <div style={{ width: "45%", background: "#807A6A" }} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "0.706/1",
        borderRadius: 4,
        overflow: "hidden",
        background: ac,
        padding: 4,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          alignSelf: "flex-end",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#807A6A",
          border: `1.5px solid ${acFg}`,
        }}
      />
      <div style={{ flex: 1 }} />
      <div style={{ height: 5, width: "90%", background: acFg }} />
      <div
        style={{ height: 5, width: "70%", background: acFg, marginTop: 2 }}
      />
    </div>
  );
}

// ─── form helpers ─────────────────────────────────────────────────
function FieldLabel({
  skin,
  children,
}: {
  skin: SkinTokens;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: skin.textDim,
        textTransform: "uppercase",
        letterSpacing: ".08em",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function FormField({
  skin,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  skin: SkinTokens;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div
      style={{
        background: skin.surface,
        border: skin.surfaceBorder,
        borderRadius: 12,
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          flex: 1,
          border: 0,
          outline: 0,
          background: "transparent",
          height: 44,
          fontSize: 14,
          fontFamily: "inherit",
          color: skin.text,
          minWidth: 0,
        }}
      />
      {maxLength && (
        <span
          style={{
            fontSize: 10,
            color: skin.textDim,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {(value || "").length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function LayoutChip({
  skin,
  active,
  onClick,
  label,
  preview,
}: {
  skin: SkinTokens;
  active: boolean;
  onClick: () => void;
  label: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: skin.surface,
        border: 0,
        borderRadius: 12,
        padding: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "center",
        boxShadow: active
          ? "0 0 0 2px #000"
          : `inset 0 0 0 1.5px ${skin.divider}`,
      }}
    >
      {preview}
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 700,
          color: skin.text,
        }}
      >
        {label}
      </div>
    </button>
  );
}

function ColorChip({
  color,
  label,
  active,
  onClick,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: color,
        color: color === "#F6C414" ? "#000" : "#fff",
        border: 0,
        borderRadius: 12,
        padding: "12px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        boxShadow: active
          ? "inset 0 0 0 3px #fff, inset 0 0 0 5px #000"
          : "inset 0 -3px 0 rgba(0,0,0,.18)",
      }}
    >
      {label}
    </button>
  );
}

// ─── KI-Porträt ────────────────────────────────────────────────────────────────
// Five generated portrait styles. We use deliberately simple geometry
// (head ellipse + shoulder shape) so each style reads as an *illustrated*
// portrait, not a fake photo. The user picks a style + seed; everything
// else is derived. No private photo needed.

interface KIStyleDef {
  id: PlakatKiStyle;
  label: string;
}

const KI_STYLES: KIStyleDef[] = [
  { id: "linocut", label: "Linol" },
  { id: "silhouette", label: "Solid" },
  { id: "risograph", label: "Riso" },
  { id: "popart", label: "Pop" },
  { id: "aquarell", label: "Aquarell" },
];

function PhotoTab({
  active,
  onClick,
  label,
  sub,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#1F1D17" : "transparent",
        color: active ? "#FBF6E9" : "#1F1D17",
        border: 0,
        borderRadius: 9,
        padding: "8px 8px 7px",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "relative",
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: "-.01em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {label}
        {badge && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: ".08em",
              padding: "1px 4px",
              borderRadius: 3,
              background: active ? "#F6C414" : "#1F1D17",
              color: active ? "#1F1D17" : "#F6C414",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {badge}
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: 9.5,
          opacity: 0.7,
          lineHeight: 1.2,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function KIStyleChip({
  style,
  accent,
  seed,
  active,
  onClick,
}: {
  style: KIStyleDef;
  accent: PlakatAccent;
  seed: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        borderRadius: 9,
        overflow: "hidden",
        boxShadow: active
          ? "0 0 0 2px #000"
          : "0 0 0 1.5px rgba(0,0,0,.12)",
      }}
    >
      <div style={{ aspectRatio: "1 / 1", width: "100%" }}>
        <KIPortrait
          style={style.id}
          seed={seed}
          accent={accent}
          shape="rect"
        />
      </div>
      <div
        style={{
          padding: "4px 2px 5px",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: active ? "#1F1D17" : "#1F1D17",
          background: active ? "#F6C414" : "transparent",
        }}
      >
        {style.label}
      </div>
    </button>
  );
}

// ─── Portrait surface ──────────────────────────────────────────────
// KI mode renders the generated KIPortrait. Upload mode renders a real
// drag-&-drop zone: if a photoData URL exists it shows the <img>, else a
// subtle dashed drop placeholder. Clicking opens a hidden file picker.
function PortraitSurface({
  p,
  shape,
  placeholder,
  onPhoto,
}: {
  p: PlakatState;
  shape: "rect" | "circle";
  placeholder: string;
  onPhoto: (dataUrl: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  if (p.photoMode === "ki") {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <KIPortrait
          style={p.kiStyle}
          seed={p.kiSeed}
          accent={p.accent}
          shape={shape}
        />
      </div>
    );
  }

  const radius = shape === "circle" ? "50%" : undefined;

  const readFile = (file: File | undefined | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    readFile(e.dataTransfer?.files?.[0]);
  };

  if (p.photoData) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          width: "100%",
          height: "100%",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <img
          src={p.photoData}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius: radius,
          }}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => readFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        width: "100%",
        height: "100%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 8,
        background: "#F0EEE8",
        boxShadow: "inset 0 0 0 2px rgba(31,29,23,.18)",
        borderRadius: radius,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#807A6A",
          letterSpacing: ".02em",
          lineHeight: 1.3,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {placeholder}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => readFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />
    </div>
  );
}

// Render the actual portrait. SVG, viewBox 200×280 (portrait ratio). Each
// style uses the SAME silhouette shape — only the treatment (color, stroke,
// halftone, etc.) differs. Seed nudges tilt/scale/hue so re-rolling feels
// like a fresh generation.
function KIPortrait({
  style,
  seed,
  accent,
}: {
  style: PlakatKiStyle;
  seed: number;
  accent: PlakatAccent;
  shape: "rect" | "circle";
}) {
  const rng = React.useMemo(
    () => pqRng((seed || 1) + style.length * 17),
    [seed, style],
  );
  const tilt = (rng() - 0.5) * 8; // ±4°
  const scale = 0.94 + rng() * 0.12; // 0.94–1.06
  const offX = (rng() - 0.5) * 16;
  // hueShift kept for parity with the prototype's rng draw sequence
  void ((rng() - 0.5) * 30);

  const ac =
    accent === "red" ? "#D81E26" : accent === "gold" ? "#F6C414" : "#1F1D17";
  const acDeep =
    accent === "red" ? "#9B1219" : accent === "gold" ? "#C48A05" : "#000000";

  // Common head + shoulders shape, used by every style with different fills.
  const head = (fill: string) => (
    <g
      transform={`translate(${100 + offX} 0) rotate(${tilt} 0 140) scale(${scale})`}
    >
      <ellipse cx="0" cy="105" rx="54" ry="62" fill={fill} />
      {/* neck */}
      <rect x="-18" y="160" width="36" height="30" fill={fill} />
      {/* shoulders */}
      <path
        d="M -110 280 Q -110 200 -55 188 Q 0 178 55 188 Q 110 200 110 280 Z"
        fill={fill}
      />
    </g>
  );

  const wrap = (children: React.ReactNode, bg: string) => (
    <svg
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block", background: bg }}
    >
      <defs>
        <pattern
          id={`grain-${seed}`}
          x="0"
          y="0"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".5" fill="rgba(0,0,0,.18)" />
        </pattern>
        <pattern
          id={`halftone-${seed}`}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2.5" cy="2.5" r="1.4" fill={ac} />
        </pattern>
      </defs>
      {children}
    </svg>
  );

  if (style === "silhouette") {
    return wrap(
      <>
        {head(ac)}
        {/* subtle highlight to suggest light */}
        <rect
          x="0"
          y="0"
          width="200"
          height="280"
          fill="url(#highlight-grad)"
          opacity="0"
        />
      </>,
      accent === "gold" ? "#1F1D17" : "#FBF6E9",
    );
  }

  if (style === "linocut") {
    return wrap(
      <>
        {head("#1F1D17")}
        <rect
          width="200"
          height="280"
          fill={`url(#grain-${seed})`}
          opacity=".7"
        />
      </>,
      "#EEE8DA",
    );
  }

  if (style === "risograph") {
    // Two offset prints — cyan-ish + accent — with light halftone fill.
    const print2 = "#3A506B";
    return wrap(
      <>
        <g opacity=".85" transform="translate(4 3)">
          {head(ac)}
        </g>
        <g opacity=".75" transform="translate(-4 -3)">
          {head(print2)}
        </g>
        <rect
          width="200"
          height="280"
          fill={`url(#grain-${seed})`}
          opacity=".55"
        />
      </>,
      "#FBF6E9",
    );
  }

  if (style === "popart") {
    return wrap(
      <>
        {/* split background */}
        <rect x="0" y="0" width="100" height="280" fill="#F6C414" />
        <rect x="100" y="0" width="100" height="280" fill={ac} />
        {/* halftone hint */}
        <rect
          width="200"
          height="280"
          fill={`url(#halftone-${seed})`}
          opacity=".18"
        />
        {head("#1F1D17")}
      </>,
      "#1F1D17",
    );
  }

  // aquarell — soft radial wash, head as a lighter tint.
  const aquaBg =
    accent === "gold"
      ? "#FBF1D2"
      : accent === "red"
        ? "#FBE0DE"
        : "#EEE8DA";
  return wrap(
    <>
      <defs>
        <radialGradient id={`aqua-${seed}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={ac} stopOpacity=".65" />
          <stop offset="70%" stopColor={acDeep} stopOpacity=".25" />
          <stop offset="100%" stopColor={acDeep} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="280" fill={aquaBg} />
      <ellipse
        cx="100"
        cy="125"
        rx="95"
        ry="110"
        fill={`url(#aqua-${seed})`}
      />
      {head(acDeep)}
      <rect
        width="200"
        height="280"
        fill={`url(#grain-${seed})`}
        opacity=".35"
      />
    </>,
    aquaBg,
  );
}
