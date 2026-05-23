import type { MascotStyle } from "@/lib/types";

/* ============================================================
   Bundesadler — "Ferdi", the friendly federal-eagle mascot.
   Three styles: bold (plush) · line (editorial ink) · mosaic.
   All variants share the same pose.
   ============================================================ */

interface MascotProps {
  variant?: MascotStyle;
  size?: number;
  mood?: "happy" | "sad" | "thinking";
  winking?: boolean;
}

export function Bundesadler({
  variant = "bold",
  size = 120,
  mood = "happy",
  winking = false,
}: MascotProps) {
  if (variant === "line") return <AdlerLine size={size} winking={winking} />;
  if (variant === "mosaic") return <AdlerMosaic size={size} winking={winking} />;
  return <AdlerBold size={size} mood={mood} winking={winking} />;
}

function AdlerBold({
  size,
  mood,
  winking,
}: {
  size: number;
  mood: string;
  winking: boolean;
}) {
  const happy = mood !== "sad" && mood !== "thinking";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
      <ellipse cx="100" cy="186" rx="50" ry="6" fill="rgba(20,19,15,.10)" />
      <path d="M40 110 Q22 78 36 56 Q44 46 56 50 Q66 56 70 76 L66 124 Z" fill="#1F1D17" />
      <path d="M160 110 Q178 78 164 56 Q156 46 144 50 Q134 56 130 76 L134 124 Z" fill="#1F1D17" />
      <path d="M44 96 Q40 84 50 78" stroke="#3A3528" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M156 96 Q160 84 150 78" stroke="#3A3528" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M70 100 Q70 60 100 56 Q130 60 130 100 L130 142 Q130 168 100 170 Q70 168 70 142 Z" fill="#26241D" />
      <path d="M82 120 Q82 100 100 96 Q118 100 118 120 L118 150 Q118 164 100 166 Q82 164 82 150 Z" fill="#FBF6E9" />
      <path d="M82 160 L72 184 L92 174 L100 188 L108 174 L128 184 L118 160 Z" fill="#1F1D17" />
      <path d="M88 168 L92 180 M100 170 L100 184 M112 168 L108 180" stroke="#3A3528" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="68" r="36" fill="#26241D" />
      <path d="M70 64 Q70 40 100 38 Q130 40 130 64 Q130 70 124 72 L76 72 Q70 70 70 64 Z" fill="#2C2A21" />
      <path d="M93 78 L107 78 L102 96 Z" fill="#F6C414" />
      <path d="M93 78 L107 78 L100 84 Z" fill="#C48A05" />
      {happy && <ellipse cx="100" cy="83" rx="3" ry="1.2" fill="#9B1219" />}
      <circle cx="87" cy="64" r="6" fill="#FBF6E9" />
      <circle cx="113" cy="64" r="6" fill="#FBF6E9" />
      {winking ? (
        <path d="M83 64 Q87 60 91 64" stroke="#14130F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="88" cy="65" r="3" fill="#14130F" />
          <circle cx="89" cy="64" r="1" fill="#FBF6E9" />
        </>
      )}
      <circle cx="114" cy="65" r="3" fill="#14130F" />
      <circle cx="115" cy="64" r="1" fill="#FBF6E9" />
      <circle cx="80" cy="78" r="3.5" fill="#D81E26" opacity=".35" />
      <circle cx="120" cy="78" r="3.5" fill="#D81E26" opacity=".35" />
      <path d="M92 36 Q90 28 96 28 Q98 26 100 30 Q102 26 104 28 Q110 28 108 36" fill="#1F1D17" />
      <path d="M88 168 L86 178 M92 168 L92 180 M96 168 L98 180" stroke="#C48A05" strokeWidth="3" strokeLinecap="round" />
      <path d="M104 168 L102 180 M108 168 L108 180 M112 168 L114 178" stroke="#C48A05" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function AdlerLine({ size, winking }: { size: number; winking: boolean }) {
  const s = 2.4;
  const c = "#1F1D17";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
      <ellipse cx="100" cy="186" rx="50" ry="5" fill="rgba(20,19,15,.08)" />
      <path d="M70 100 Q70 60 100 56 Q130 60 130 100 L130 142 Q130 168 100 170 Q70 168 70 142 Z" fill="#FBF6E9" stroke={c} strokeWidth={s} strokeLinejoin="round" />
      <path d="M40 110 Q22 78 36 56 Q46 50 60 56 Q66 64 68 80" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M160 110 Q178 78 164 56 Q154 50 140 56 Q134 64 132 80" fill="none" stroke={c} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      <g stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round">
        <path d="M46 70 L52 78" /><path d="M40 82 L48 90" /><path d="M40 96 L48 104" />
        <path d="M154 70 L148 78" /><path d="M160 82 L152 90" /><path d="M160 96 L152 104" />
      </g>
      <path d="M82 122 Q82 102 100 98 Q118 102 118 122" fill="none" stroke={c} strokeWidth="1.6" />
      <path d="M82 160 L72 184 L92 172 L100 188 L108 172 L128 184 L118 160" fill="none" stroke={c} strokeWidth={s} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="100" cy="68" r="34" fill="#FBF6E9" stroke={c} strokeWidth={s} />
      <path d="M68 66 Q68 42 100 40 Q132 42 132 66" fill="none" stroke={c} strokeWidth="1.4" />
      <path d="M93 78 L107 78 L102 96 Z" fill="#F6C414" stroke={c} strokeWidth={s} strokeLinejoin="round" />
      <path d="M93 78 L107 78" stroke={c} strokeWidth="1.2" />
      {winking ? (
        <path d="M82 66 Q88 62 94 66" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" />
      ) : (
        <circle cx="88" cy="66" r="3.5" fill={c} />
      )}
      <circle cx="112" cy="66" r="3.5" fill={c} />
      <path d="M92 36 Q92 28 96 28 Q98 26 100 30 Q102 26 104 28 Q108 28 108 36" fill="none" stroke={c} strokeWidth={s} strokeLinejoin="round" />
      <g stroke="#C48A05" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M88 170 L86 180" /><path d="M92 170 L92 182" /><path d="M96 170 L98 182" />
        <path d="M104 170 L102 182" /><path d="M108 170 L108 182" /><path d="M112 170 L114 180" />
      </g>
    </svg>
  );
}

function AdlerMosaic({ size, winking }: { size: number; winking: boolean }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
      <ellipse cx="100" cy="186" rx="50" ry="6" fill="rgba(20,19,15,.10)" />
      <path d="M40 110 L36 56 L62 70 L70 110 Z" fill="#14130F" />
      <path d="M62 70 L70 110 L78 86 Z" fill="#26241D" />
      <path d="M160 110 L164 56 L138 70 L130 110 Z" fill="#14130F" />
      <path d="M138 70 L130 110 L122 86 Z" fill="#26241D" />
      <path d="M70 100 Q70 60 100 56 Q130 60 130 100 L130 142 Q130 168 100 170 Q70 168 70 142 Z" fill="#14130F" />
      <path d="M82 110 L118 110 L118 150 Q118 164 100 166 Q82 164 82 150 Z" fill="#D81E26" />
      <path d="M84 116 L116 116 L116 138 L84 138 Z" fill="#FBF6E9" />
      <path d="M82 160 L72 184 L92 174 L100 188 L108 174 L128 184 L118 160 Z" fill="#14130F" />
      <path d="M92 174 L100 188 L108 174 L100 178 Z" fill="#F6C414" />
      <path d="M68 70 Q68 38 100 38 Q132 38 132 70 Q132 80 122 84 L78 84 Q68 80 68 70 Z" fill="#14130F" />
      <path d="M70 60 L100 38 L100 78 Z" fill="#1F1D17" />
      <path d="M93 80 L107 80 L102 98 Z" fill="#F6C414" />
      <path d="M93 80 L102 98 L100 86 Z" fill="#C48A05" />
      {winking ? (
        <path d="M83 66 Q88 62 93 66" stroke="#FBF6E9" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : (
        <rect x="84" y="62" width="8" height="8" fill="#FBF6E9" />
      )}
      <rect x="108" y="62" width="8" height="8" fill="#FBF6E9" />
      {!winking && <rect x="86" y="64" width="3" height="4" fill="#14130F" />}
      <rect x="110" y="64" width="3" height="4" fill="#14130F" />
      <path d="M88 36 L100 24 L112 36 L100 30 Z" fill="#14130F" />
      <path d="M84 168 L80 184 L92 178 Z" fill="#C48A05" />
      <path d="M116 168 L120 184 L108 178 Z" fill="#C48A05" />
    </svg>
  );
}

/* Compact icon-sized adler for nav + badges. */
export function AdlerMark({ size = 28, color = "#14130F" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: "block" }}>
      <path
        d="M16 6 C 12 6 10 8 10 12 L 10 14 L 4 12 L 8 18 L 4 22 L 11 21 L 10 26 L 16 23 L 22 26 L 21 21 L 28 22 L 24 18 L 28 12 L 22 14 L 22 12 C 22 8 20 6 16 6 Z"
        fill={color}
      />
      <path d="M14 14 L 18 14 L 16 18 Z" fill="#F6C414" />
    </svg>
  );
}
