import type { CSSProperties, ReactNode } from "react";
import type { SkinTokens } from "@/lib/tokens";

/* ============================================================
   Shared UI primitives — chunky 3D press-buttons, cards, pills,
   the hand-drawn icon set, the black-red-gold flag stripe.
   ============================================================ */

type PressVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "red"
  | "gold"
  | "success"
  | "dark";
type PressSize = "sm" | "md" | "lg";

function pressVariant(v: PressVariant) {
  switch (v) {
    case "primary":
    case "gold":
      return { bg: "var(--pq-gold)", fg: "#1F1D17", shadow: "var(--pq-gold-deep)", border: undefined };
    case "red":
      return { bg: "var(--pq-red)", fg: "#FFFFFF", shadow: "var(--pq-red-deep)", border: undefined };
    case "success":
      return { bg: "var(--pq-green)", fg: "#FFFFFF", shadow: "var(--pq-green-deep)", border: undefined };
    case "dark":
      return { bg: "var(--pq-ink)", fg: "#FBF6E9", shadow: "#000", border: undefined };
    case "secondary":
      return { bg: "#FFFFFF", fg: "var(--pq-ink)", shadow: "#E8E2D2", border: "1.5px solid #E8E2D2" };
    case "ghost":
    default:
      return { bg: "transparent", fg: "var(--pq-ink-soft)", shadow: "transparent", border: "1.5px solid var(--pq-line)" };
  }
}

export function PressButton({
  variant = "primary",
  size = "md",
  full = false,
  icon,
  children,
  onClick,
  disabled,
  style = {},
  ariaLabel,
  type = "button",
}: {
  variant?: PressVariant;
  size?: PressSize;
  full?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const v = pressVariant(variant);
  const sz = {
    sm: { h: 38, pad: 14, fs: 14, depth: 3, r: 12 },
    md: { h: 50, pad: 20, fs: 16, depth: 4, r: 14 },
    lg: { h: 60, pad: 24, fs: 18, depth: 5, r: 18 },
  }[size];
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="pq-press"
      style={{
        height: sz.h,
        padding: `0 ${sz.pad}px`,
        fontSize: sz.fs,
        background: v.bg,
        color: v.fg,
        boxShadow: `inset 0 -${sz.depth}px 0 ${v.shadow}, 0 1px 0 rgba(0,0,0,.04)`,
        border: v.border || "none",
        borderRadius: sz.r,
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.55 : 1,
        textTransform: variant === "ghost" ? "none" : "uppercase",
        letterSpacing: variant === "ghost" ? "normal" : ".04em",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── StatPill ─────────────────────────────────────────────── */
export function StatPill({
  icon,
  value,
  color = "var(--pq-ink)",
  iconAnim,
}: {
  icon: ReactNode;
  value: ReactNode;
  color?: string;
  iconAnim?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px 6px 8px",
        background: "#fff",
        border: "1.5px solid var(--pq-line)",
        borderRadius: 999,
        fontWeight: 700,
        color,
        boxShadow: "inset 0 -2px 0 rgba(20,19,15,.04)",
        fontSize: 15,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center bottom",
          animation: iconAnim ? `${iconAnim} 1.8s ease-in-out infinite` : undefined,
        }}
      >
        {icon}
      </span>
      <span className="pq-mono" style={{ fontSize: 14 }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Hand-drawn icon set ──────────────────────────────────── */
export const Icons = {
  flame: (color = "#D81E26") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M12 3 C 14 7 17 8 17 13 a5 5 0 1 1 -10 0 c 0 -2 1 -3 2 -5 c 0 2 1 3 2 3 c 0 -3 0 -5 1 -8 Z" fill={color} />
      <path d="M12 11 c 1 1 2 2 2 4 a2 2 0 1 1 -4 0 c 0 -1 1 -2 2 -4 Z" fill="#F6C414" />
    </svg>
  ),
  heart: (color = "#D81E26") => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 21 C 4 14 4 8 8 6 C 10 5 12 6 12 9 C 12 6 14 5 16 6 C 20 8 20 14 12 21 Z" fill={color} />
    </svg>
  ),
  bolt: (color = "#F6C414") => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M13 2 L 5 14 L 11 14 L 9 22 L 19 9 L 13 9 Z" fill={color} stroke="#C48A05" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  ),
  star: (color = "#F6C414") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M12 2 L 14.8 8.7 L 22 9.3 L 16.5 14 L 18.2 21 L 12 17.3 L 5.8 21 L 7.5 14 L 2 9.3 L 9.2 8.7 Z" fill={color} />
    </svg>
  ),
  check: (color = "#FBF6E9") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M4 12 l 5 5 L 20 6" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: (color = "#807A6A") => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <rect x="5" y="11" width="14" height="9" rx="2" fill={color} />
      <path d="M8 11 V 8 a 4 4 0 0 1 8 0 V 11" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  ),
  trophy: (color = "#F6C414") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M7 3 H 17 V 8 a 5 5 0 0 1 -10 0 Z" fill={color} stroke="#C48A05" strokeWidth="1.4" />
      <path d="M5 5 H 7 V 8 a 2 2 0 0 1 -2 0 Z M 17 5 H 19 V 8 a 2 2 0 0 1 -2 0 Z" fill="none" stroke="#C48A05" strokeWidth="1.4" />
      <path d="M9 13 L 9 17 H 15 V 13" stroke="#1F1D17" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <rect x="7" y="18" width="10" height="3" rx="1" fill="#1F1D17" />
    </svg>
  ),
  house: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M3 11 L 12 3 L 21 11 V 20 a 1 1 0 0 1 -1 1 H 14 V 14 H 10 V 21 H 4 a 1 1 0 0 1 -1 -1 Z" fill={color} />
      <rect x="10" y="14" width="4" height="7" fill="#F6C414" />
    </svg>
  ),
  newspaper: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect x="3" y="4" width="14" height="16" rx="1.5" fill="#FBF6E9" stroke={color} strokeWidth="1.5" />
      <path d="M6 8 H 14 M 6 11 H 14 M 6 14 H 11" stroke={color} strokeWidth="1.4" />
      <rect x="6" y="6" width="8" height="1" fill="#D81E26" />
      <rect x="17" y="9" width="4" height="11" rx="1" fill={color} />
    </svg>
  ),
  chat: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M4 5 H 20 a 2 2 0 0 1 2 2 V 16 a 2 2 0 0 1 -2 2 H 9 L 4 22 V 7 a 2 2 0 0 1 2 -2 Z" fill={color} />
      <circle cx="10" cy="12" r="1.3" fill="#F6C414" />
      <circle cx="14" cy="12" r="1.3" fill="#F6C414" />
    </svg>
  ),
  bars: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect x="4" y="14" width="3" height="6" fill={color} />
      <rect x="10" y="9" width="3" height="11" fill="#D81E26" />
      <rect x="16" y="4" width="3" height="16" fill="#F6C414" stroke="#C48A05" strokeWidth=".5" />
    </svg>
  ),
  user: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <circle cx="12" cy="9" r="4" fill={color} />
      <path d="M3 21 a 9 9 0 0 1 18 0 Z" fill={color} />
    </svg>
  ),
  tv: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect x="3" y="5" width="18" height="12" rx="2" fill={color} />
      <rect x="5" y="7" width="14" height="8" fill="#F6C414" />
      <path d="M8 21 H 16 M 12 17 V 21" stroke={color} strokeWidth="2" />
    </svg>
  ),
  ballot: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#FBF6E9" stroke={color} strokeWidth="1.6" />
      <path d="M7 11 l 3 3 l 7 -7" stroke="#D81E26" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevron: (dir: "right" | "left" | "up" | "down" = "right", color = "#807A6A") => {
    const r = { right: 0, left: 180, up: -90, down: 90 }[dir] || 0;
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ transform: `rotate(${r}deg)` }}>
        <path d="M9 5 L 16 12 L 9 19" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  },
  send: (color = "#FBF6E9") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M3 12 L 21 4 L 14 21 L 11 13 Z" fill={color} stroke="#14130F" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  speaker: (color = "#1F1D17") => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M4 9 H 8 L 14 4 V 20 L 8 15 H 4 Z" fill={color} />
      <path d="M17 8 Q 20 12 17 16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
};

/* ─── Card ─────────────────────────────────────────────────── */
export function Card({
  children,
  style = {},
  padded = true,
  accent,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padded?: boolean;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "var(--pq-radius-card)",
        border: "1.5px solid var(--pq-line)",
        boxShadow: "var(--pq-shadow-card)",
        overflow: "hidden",
        position: "relative",
        ...(padded ? { padding: 16 } : {}),
        ...style,
      }}
    >
      {accent && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: accent }} />
      )}
      {children}
    </div>
  );
}

/* ─── SectionLabel ─────────────────────────────────────────── */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "0 4px",
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      <div
        className="pq-display"
        style={{
          textTransform: "uppercase",
          letterSpacing: ".06em",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--pq-ink-mute)",
        }}
      >
        {children}
      </div>
      {right}
    </div>
  );
}

/* ─── ProgressBar ──────────────────────────────────────────── */
export function ProgressBar({
  value,
  max = 100,
  color = "var(--pq-gold)",
  height = 14,
  showLabel = false,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      style={{
        position: "relative",
        background: "#EFE7D2",
        borderRadius: 999,
        height,
        boxShadow: "inset 0 1px 2px rgba(20,19,15,.10)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 999,
          boxShadow: `inset 0 -${Math.floor(height / 3)}px 0 rgba(0,0,0,.12), inset 0 ${Math.floor(
            height / 4,
          )}px 0 rgba(255,255,255,.18)`,
          transition: "width .35s cubic-bezier(.3,.7,.4,1)",
        }}
      />
      {showLabel && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 8,
            color: "#1F1D17",
            fontWeight: 700,
            fontSize: 11,
          }}
          className="pq-mono"
        >
          {Math.round(pct)}%
        </div>
      )}
    </div>
  );
}

/* ─── FlagStripe ───────────────────────────────────────────── */
export function FlagStripe({
  height = 4,
  style = {},
  animated = false,
}: {
  height?: number;
  style?: CSSProperties;
  animated?: boolean;
}) {
  if (animated) {
    return (
      <div style={{ height, overflow: "hidden", ...style }}>
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "200%",
            animation: "pq-flag-sweep 14s linear infinite",
            willChange: "transform",
          }}
        >
          <div style={{ flex: 1, background: "#14130F" }} />
          <div style={{ flex: 1, background: "#D81E26" }} />
          <div style={{ flex: 1, background: "#F6C414" }} />
          <div style={{ flex: 1, background: "#14130F" }} />
          <div style={{ flex: 1, background: "#D81E26" }} />
          <div style={{ flex: 1, background: "#F6C414" }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", height, ...style }}>
      <div style={{ flex: 1, background: "#14130F" }} />
      <div style={{ flex: 1, background: "#D81E26" }} />
      <div style={{ flex: 1, background: "#F6C414" }} />
    </div>
  );
}

/* ─── BottomNav (skin-aware) ───────────────────────────────── */
export type NavId = "home" | "phone" | "spectrum" | "profile";

export function BottomNav({
  skin,
  active,
  onChange,
}: {
  skin: SkinTokens;
  active: NavId;
  onChange: (id: NavId) => void;
}) {
  const items: { id: NavId; icon: (c: string) => ReactNode; label: string }[] = [
    { id: "home", icon: Icons.house, label: "Home" },
    { id: "phone", icon: Icons.chat, label: "Telefon" },
    { id: "spectrum", icon: Icons.bars, label: "Spektrum" },
    { id: "profile", icon: Icons.user, label: "Profil" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        paddingTop: 8,
        background: skin.navBg,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: `1px solid ${skin.navBorder}`,
        display: "flex",
        justifyContent: "space-around",
        zIndex: 30,
      }}
    >
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: "6px 4px",
              minWidth: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <div
              style={{
                opacity: on ? 1 : 0.45,
                transform: on ? "scale(1.05)" : "scale(1)",
                transition: "all .15s",
              }}
            >
              {it.icon(on ? skin.iconActive : skin.iconRest)}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: on ? skin.text : skin.iconRest,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              {it.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
