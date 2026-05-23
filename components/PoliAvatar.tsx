import type { Character } from "@/lib/types";
import {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES_M,
  HAIR_STYLES_F,
  SUIT_COLORS,
  TIE_COLORS,
} from "@/lib/onboardingData";

/* ============================================================
   PoliAvatar — playful bust portrait. Proper anatomy: visible
   neck drawn first, suit overlaps it, hair wraps the skull.
   ============================================================ */

export function PoliAvatar({ character: c, size = 80 }: { character: Character; size?: number }) {
  if (c && c.photo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          background: "#F4ECD6",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,.04)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.photo}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 28%", display: "block" }}
        />
      </div>
    );
  }

  const skin = SKIN_TONES[c.skin] || SKIN_TONES[0];
  const hairCol = HAIR_COLORS[c.hairColor] || HAIR_COLORS[0];
  const suit = SUIT_COLORS[c.suit] || SUIT_COLORS[0];
  const tieDef = TIE_COLORS[c.tie] || TIE_COLORS[0];
  const hasTie = tieDef.id !== "none";
  const hairList = c.gender === "m" ? HAIR_STYLES_M : HAIR_STYLES_F;
  const hairKind = hairList[c.hair] || hairList[0];
  const isBald = hairKind === "bald" || hairKind === "beardonly";

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      {/* NECK */}
      <path d="M 40 54 Q 38 68 42 86 L 58 86 Q 62 68 60 54 Z" fill={skin} />
      <ellipse cx="50" cy="58" rx="11" ry="2.6" fill="rgba(0,0,0,.10)" />
      <path d="M 50 64 Q 49 70 50 76" stroke="rgba(0,0,0,.08)" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* SUIT / SHOULDERS */}
      <path d="M 4 100 Q 4 78 20 72 L 36 70 L 50 82 L 64 70 L 80 72 Q 96 78 96 100 Z" fill={suit.bg} />
      <path d="M 50 82 L 36 70 L 41 92 Z" fill="rgba(255,255,255,.08)" />
      <path d="M 50 82 L 64 70 L 59 92 Z" fill="rgba(255,255,255,.08)" />
      <path d="M 36 70 L 41 92" stroke="rgba(255,255,255,.18)" strokeWidth=".6" fill="none" />
      <path d="M 64 70 L 59 92" stroke="rgba(255,255,255,.18)" strokeWidth=".6" fill="none" />
      {/* SHIRT COLLAR */}
      <path d="M 36 70 L 50 84 L 64 70 L 58 73 L 50 80 L 42 73 Z" fill="#FFFFFF" />
      <path d="M 42 73 L 50 80 L 58 73" stroke="rgba(0,0,0,.10)" strokeWidth=".5" fill="none" />
      {/* TIE */}
      {hasTie && (
        <g>
          <path d="M 50 78 L 46 82 L 54 82 Z" fill={tieDef.bg} />
          <path d="M 46 82 L 54 82 L 56 100 L 50 102 L 44 100 Z" fill={tieDef.bg} />
          <path d="M 46 82 L 54 82 L 52 84 L 48 84 Z" fill="rgba(0,0,0,.22)" />
          <path d="M 49 84 L 49 98" stroke="rgba(255,255,255,.18)" strokeWidth=".6" fill="none" />
        </g>
      )}
      {/* EARS */}
      <ellipse cx="27" cy="44" rx="3.4" ry="5" fill={skin} />
      <ellipse cx="73" cy="44" rx="3.4" ry="5" fill={skin} />
      <path d="M 27 44 q 1.2 0 1.2 2" stroke="rgba(0,0,0,.18)" strokeWidth=".6" fill="none" />
      <path d="M 73 44 q -1.2 0 -1.2 2" stroke="rgba(0,0,0,.18)" strokeWidth=".6" fill="none" />
      {/* FACE */}
      <ellipse cx="50" cy="40" rx="22" ry="24" fill={skin} />
      <ellipse cx="50" cy="60" rx="12" ry="2.4" fill="rgba(0,0,0,.06)" />
      {/* HAIR */}
      {!isBald && <Hair kind={hairKind} color={hairCol} />}
      {hairKind === "beardonly" && <ellipse cx="50" cy="22" rx="16" ry="4" fill={hairCol} opacity=".15" />}
      {/* BEARD */}
      {c.gender === "m" && c.beard > 0 && <Beard density={c.beard} color={hairCol} />}
      {/* BROWS */}
      <path d="M 35 33 Q 41 30.5 46 33" stroke={hairCol} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 54 33 Q 59 30.5 65 33" stroke={hairCol} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* EYES */}
      <ellipse cx="41" cy="40" rx="2.4" ry="2.9" fill="#1F1D17" />
      <ellipse cx="59" cy="40" rx="2.4" ry="2.9" fill="#1F1D17" />
      <circle cx="41.9" cy="39.2" r="0.9" fill="#FFFFFF" />
      <circle cx="59.9" cy="39.2" r="0.9" fill="#FFFFFF" />
      {/* NOSE */}
      <path d="M 48.5 46 Q 47.6 51 50 52 Q 52.4 51 51.5 46" stroke="rgba(0,0,0,.18)" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* CHEEKS */}
      <ellipse cx="34" cy="49" rx="3.4" ry="1.8" fill="#E89A8A" opacity=".4" />
      <ellipse cx="66" cy="49" rx="3.4" ry="1.8" fill="#E89A8A" opacity=".4" />
      {/* MOUTH */}
      <path d="M 45 55 Q 50 58.5 55 55" stroke="#5A2828" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      {/* GLASSES */}
      {c.glasses && (
        <g stroke="#1F1D17" strokeWidth="1.4" fill="none">
          <circle cx="41" cy="40" r="6" />
          <circle cx="59" cy="40" r="6" />
          <path d="M 47 40 L 53 40" />
          <path d="M 35 40 L 30 39" />
          <path d="M 65 40 L 70 39" />
        </g>
      )}
    </svg>
  );
}

function Hair({ kind, color }: { kind: string; color: string }) {
  if (kind === "short") {
    return (
      <g>
        <path d="M 28 38 Q 26 16 50 16 Q 74 16 72 38 Q 72 26 64 22 Q 50 18 36 22 Q 28 26 28 38 Z" fill={color} />
        <path d="M 32 30 Q 40 22 50 22" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "side") {
    return (
      <g>
        <path d="M 28 38 Q 26 14 50 14 Q 74 16 72 38 Q 72 26 62 22 Q 48 18 36 24 Q 30 30 28 38 Z" fill={color} />
        <path d="M 42 18 Q 50 32 70 28" stroke="rgba(0,0,0,.28)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "swept") {
    return (
      <g>
        <path d="M 28 38 Q 22 10 50 10 Q 78 12 72 38 Q 70 22 56 20 Q 42 22 32 28 Q 28 32 28 38 Z" fill={color} />
        <path d="M 32 26 Q 50 16 68 22" stroke="rgba(255,255,255,.18)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "curly") {
    return (
      <g fill={color}>
        <ellipse cx="50" cy="22" rx="22" ry="12" />
        <circle cx="32" cy="28" r="6.5" />
        <circle cx="40" cy="16" r="7" />
        <circle cx="50" cy="12" r="7" />
        <circle cx="60" cy="16" r="7" />
        <circle cx="68" cy="28" r="6.5" />
        <circle cx="30" cy="38" r="4.5" />
        <circle cx="70" cy="38" r="4.5" />
      </g>
    );
  }
  if (kind === "bob") {
    return (
      <g>
        <path d="M 24 50 Q 22 12 50 12 Q 78 12 76 50 L 72 54 L 70 54 Q 72 30 60 24 Q 50 20 40 24 Q 28 30 30 54 L 28 54 L 24 50 Z" fill={color} />
        <path d="M 36 18 Q 50 28 70 22" stroke="rgba(0,0,0,.22)" strokeWidth=".9" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "long") {
    return (
      <g>
        <path d="M 22 42 Q 18 12 50 10 Q 82 12 78 42 Q 84 70 80 100 L 66 100 Q 72 70 68 42 Q 60 24 50 22 Q 40 24 32 42 Q 28 70 34 100 L 20 100 Q 16 70 22 42 Z" fill={color} />
        <path d="M 36 18 Q 50 26 66 18" stroke="rgba(0,0,0,.18)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "bun") {
    return (
      <g fill={color}>
        <path d="M 28 38 Q 28 16 50 16 Q 72 16 72 38 Q 72 26 62 22 Q 50 20 38 22 Q 28 26 28 38 Z" />
        <circle cx="50" cy="8" r="8.5" />
        <ellipse cx="50" cy="14" rx="4" ry="1.8" fill="rgba(0,0,0,.18)" />
      </g>
    );
  }
  if (kind === "pixie") {
    return (
      <g>
        <path d="M 28 38 Q 28 16 50 16 Q 72 16 72 38 Q 72 24 60 22 Q 50 20 40 22 Q 28 26 28 38 Z" fill={color} />
        <path d="M 50 18 Q 60 14 70 20" stroke="rgba(255,255,255,.18)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "ponytail") {
    return (
      <g fill={color}>
        <path d="M 28 38 Q 26 14 50 14 Q 74 16 72 38 Q 72 26 62 22 Q 50 20 38 22 Q 28 28 28 38 Z" />
        <path d="M 70 28 Q 88 36 86 60 Q 82 72 74 68 Q 78 56 72 42 Z" />
        <path d="M 70 28 Q 78 34 80 42" stroke="rgba(0,0,0,.18)" strokeWidth=".8" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

function Beard({ density, color }: { density: number; color: string }) {
  if (density === 1) {
    return (
      <g opacity=".4">
        <path d="M 32 50 Q 36 60 50 62 Q 64 60 68 50" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g fill={color}>
      <path d="M 30 46 Q 32 58 38 62 Q 44 64 50 64 Q 56 64 62 62 Q 68 58 70 46 Q 66 54 58 54 Q 54 52 50 52 Q 46 52 42 54 Q 34 54 30 46 Z" />
      <ellipse cx="50" cy="58" rx="4" ry="2" fill="rgba(0,0,0,.15)" />
    </g>
  );
}
